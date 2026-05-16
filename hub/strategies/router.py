"""User strategy library endpoints.

Each user owns a set of `user_strategies` rows: builtin (read-only refs),
authored (owned source), or marketplace (installed copies). Authored rows
can be edited; marketplace rows can be uninstalled; builtin can't be removed.
"""
from __future__ import annotations

import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from ..audit import service as audit
from ..auth.deps import get_current_user
from ..config import settings
from ..db.base import get_session
from ..db.models.strategy import (
    STRATEGY_SOURCES,
    MarketplaceStrategy,
    UserStrategy,
)
from ..db.models.user import User
from ..onchain.inft_client import StrategyINFTClient
from ..onchain.marketplace_client import MarketplaceChainClient

logger = logging.getLogger(__name__)


def _build_chain_client() -> MarketplaceChainClient:
    """Override-able factory so tests can monkeypatch."""
    return MarketplaceChainClient(
        rpc_url=settings.MANTLE_RPC_URL or None,
        private_key=settings.MANTLE_PRIVATE_KEY or None,
        registry_address=settings.STRATEGY_REGISTRY_ADDRESS or None,
        attest_address=settings.BACKTEST_ATTEST_ADDRESS or None,
    )


def _build_inft_client() -> StrategyINFTClient:
    """Factory for ERC-7857 StrategyINFT on 0G Galileo."""
    return StrategyINFTClient(
        rpc_url=settings.ZERO_G_RPC_URL or None,
        private_key=settings.ZERO_G_PRIVATE_KEY or None,
        contract_address=settings.INFT_CONTRACT_ADDRESS or None,
    )

router = APIRouter(prefix="/strategies", tags=["strategies"])


# ── Schemas ─────────────────────────────────────────────────────────────────


class StrategyCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    code: str = Field(min_length=1)
    params_schema: Optional[dict[str, Any]] = None


class StrategyPatch(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    code: Optional[str] = None
    params_schema: Optional[dict[str, Any]] = None


class StrategyOut(BaseModel):
    id: str
    name: str
    source: str
    code_hash: Optional[str]
    marketplace_id: Optional[str]
    params_schema: Optional[dict[str, Any]]
    created_at: str

    @classmethod
    def from_row(cls, row: UserStrategy) -> "StrategyOut":
        return cls(
            id=row.id,
            name=row.name,
            source=row.source,
            code_hash=row.code_hash,
            marketplace_id=row.marketplace_id,
            params_schema=row.params_schema,
            created_at=row.created_at.isoformat() if row.created_at else "",
        )


# ── Helpers ─────────────────────────────────────────────────────────────────


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


async def _load_owned(
    db: AsyncSession, strategy_id: str, user_id: str
) -> UserStrategy:
    row = (
        await db.execute(
            select(UserStrategy).where(
                UserStrategy.id == strategy_id, UserStrategy.user_id == user_id
            )
        )
    ).scalar_one_or_none()
    if not row:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return row


# ── Endpoints ───────────────────────────────────────────────────────────────


@router.get("", response_model=list[StrategyOut])
async def list_strategies(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """List current user's installed + authored strategies."""
    rows = (
        await db.execute(
            select(UserStrategy)
            .where(UserStrategy.user_id == user.id)
            .order_by(UserStrategy.created_at.desc())
        )
    ).scalars().all()
    return [StrategyOut.from_row(r) for r in rows]


@router.post("", response_model=StrategyOut, status_code=201)
async def create_authored(
    body: StrategyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Create an authored strategy in the user's library."""
    if body.name not in (None, "") and body.name.lower() == "builtin":
        raise HTTPException(status_code=400, detail="Reserved name")
    row = UserStrategy(
        user_id=user.id,
        source="authored",
        name=body.name,
        code_hash=_hash_code(body.code),
        code_blob=body.code,
        params_schema=body.params_schema,
    )
    db.add(row)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Strategy name already in use")
    await db.refresh(row)
    await audit.record(
        actor=user.id, action="strategy.create", target=row.id, db=None
    )
    return StrategyOut.from_row(row)


@router.get("/{strategy_id}", response_model=StrategyOut)
async def get_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Fetch one strategy from the user's library."""
    row = await _load_owned(db, strategy_id, user.id)
    return StrategyOut.from_row(row)


@router.patch("/{strategy_id}", response_model=StrategyOut)
async def patch_strategy(
    strategy_id: str,
    body: StrategyPatch,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Edit an authored strategy. Re-hash code if changed."""
    row = await _load_owned(db, strategy_id, user.id)
    if row.source != "authored":
        raise HTTPException(
            status_code=403, detail="Only authored strategies can be edited"
        )
    if body.name is not None:
        row.name = body.name
    if body.code is not None:
        row.code_blob = body.code
        row.code_hash = _hash_code(body.code)
    if body.params_schema is not None:
        row.params_schema = body.params_schema
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Strategy name already in use")
    await db.refresh(row)
    return StrategyOut.from_row(row)


@router.delete("/{strategy_id}", status_code=204)
async def delete_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Delete authored or uninstall marketplace strategy. Builtin can't be removed."""
    row = await _load_owned(db, strategy_id, user.id)
    if row.source == "builtin":
        raise HTTPException(status_code=403, detail="Cannot remove builtin strategy")
    if row.source == "marketplace" and row.marketplace_id:
        mp = (
            await db.execute(
                select(MarketplaceStrategy).where(
                    MarketplaceStrategy.id == row.marketplace_id
                )
            )
        ).scalar_one_or_none()
        if mp and mp.installs_count > 0:
            mp.installs_count -= 1
    await db.delete(row)
    await db.commit()
    return None


@router.post("/{strategy_id}/install", response_model=StrategyOut, status_code=201)
async def install_marketplace(
    strategy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Install a marketplace strategy into the caller's library."""
    mp = (
        await db.execute(
            select(MarketplaceStrategy).where(MarketplaceStrategy.id == strategy_id)
        )
    ).scalar_one_or_none()
    if not mp or mp.delisted:
        raise HTTPException(status_code=404, detail="Marketplace strategy not found")

    # Already installed?
    existing = (
        await db.execute(
            select(UserStrategy).where(
                UserStrategy.user_id == user.id,
                UserStrategy.marketplace_id == mp.id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        return StrategyOut.from_row(existing)

    row = UserStrategy(
        user_id=user.id,
        source="marketplace",
        name=mp.name,
        code_hash=mp.code_hash,
        code_blob=mp.code_blob,
        params_schema=mp.params_schema,
        marketplace_id=mp.id,
    )
    db.add(row)
    mp.installs_count += 1
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409, detail="Strategy name conflicts in your library"
        )
    await db.refresh(row)

    # ERC-7857: grant buyer execution rights on the INFT without exposing config.
    if (
        mp.inft_token_id is not None
        and user.wallet_chain and user.wallet_chain.startswith("0g")
        and user.wallet_address.startswith("0x")
    ):
        inft = _build_inft_client()
        await inft.authorize_usage(mp.inft_token_id, user.wallet_address)

    await audit.record(
        actor=user.id, action="strategy.install", target=mp.id, db=None
    )
    return StrategyOut.from_row(row)


class PublishResponse(BaseModel):
    marketplace_id: str
    status: str
    strategy_hash: str
    backtest: dict[str, Any]
    tx_hashes: dict[str, Optional[str]]


async def _validate_and_backtest(
    code: str, name: str, symbol: str = "BTC/USDT"
) -> dict[str, Any]:
    """Call user-server's internal validate-and-backtest endpoint."""
    url = f"{settings.USER_SERVER_INTERNAL_URL.rstrip('/')}/internal/strategies/validate-and-backtest"
    headers = {"X-Hub-Secret": settings.INTERNAL_SECRET}
    async with httpx.AsyncClient(timeout=settings.PUBLISH_BACKTEST_TIMEOUT_SECONDS) as c:
        try:
            resp = await c.post(
                url, headers=headers, json={"code": code, "name": name, "symbol": symbol}
            )
        except httpx.HTTPError as exc:
            logger.warning("validate-and-backtest call failed: %s", exc)
            raise HTTPException(status_code=502, detail="backtest service unavailable") from exc
    if resp.status_code == 400:
        raise HTTPException(status_code=400, detail=resp.json().get("detail", resp.text))
    if resp.status_code >= 500:
        raise HTTPException(status_code=502, detail="backtest service error")
    resp.raise_for_status()
    return resp.json()


@router.post("/{strategy_id}/publish", response_model=PublishResponse)
async def publish_strategy(
    strategy_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """Publish authored strategy: validate AST, backtest, attest on-chain, list."""
    row = await _load_owned(db, strategy_id, user.id)
    if row.source != "authored":
        raise HTTPException(
            status_code=403, detail="Only authored strategies can be published"
        )
    if not row.code_blob or not row.code_hash:
        raise HTTPException(status_code=400, detail="Strategy has no code")

    # 1) Validate + backtest via user-server.
    bt = await _validate_and_backtest(row.code_blob, row.name, symbol="BTC/USDT")

    strategy_hash_hex: str = bt["strategy_hash"]
    dataset_hash_hex: str = bt["dataset_hash"]

    # 2) On-chain submissions (graceful no-op if disabled).
    chain = _build_chain_client()
    tx_registry = await chain.publish_strategy(
        bytes.fromhex(strategy_hash_hex),
        b"\x00" * 32,
        row.name,
    )
    tx_attest = await chain.attest_backtest(
        bytes.fromhex(strategy_hash_hex),
        bytes.fromhex(dataset_hash_hex),
        sharpe_bps=int(bt["sharpe_bps"]),
        max_dd_bps=int(bt["max_dd_bps"]),
        total_return_bps=int(bt["total_return_bps"]),
        win_rate_bps=int(bt["win_rate_bps"]),
        n_trades=int(bt["n_trades"]),
    )

    # 3) Insert/upsert marketplace row with metrics.
    existing = (
        await db.execute(
            select(MarketplaceStrategy).where(
                MarketplaceStrategy.author_user_id == user.id,
                MarketplaceStrategy.code_hash == strategy_hash_hex,
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        mp = existing
        mp.name = row.name
        mp.code_blob = row.code_blob
        mp.params_schema = row.params_schema
    else:
        mp = MarketplaceStrategy(
            author_user_id=user.id,
            name=row.name,
            code_hash=strategy_hash_hex,
            code_blob=row.code_blob,
            params_schema=row.params_schema,
            published_at=datetime.now(timezone.utc),
        )
        db.add(mp)

    mp.sharpe_bps = int(bt["sharpe_bps"])
    mp.max_dd_bps = int(bt["max_dd_bps"])
    mp.total_return_bps = int(bt["total_return_bps"])
    mp.win_rate_bps = int(bt["win_rate_bps"])
    mp.n_trades = int(bt["n_trades"])
    mp.registry_tx = tx_registry
    mp.attest_tx = tx_attest

    # 4) Mint ERC-7857 StrategyINFT on 0G. metadataHash = strategy hash;
    # sealedConfigHash = keccak(code_blob) so buyers can't see config until
    # oracle re-encrypts post-transfer. Only attempt if user has EVM addr.
    inft_token_id: int | None = None
    inft_mint_tx: str | None = None
    if user.wallet_chain and user.wallet_chain.startswith("0g") and user.wallet_address.startswith("0x"):
        inft = _build_inft_client()
        sealed_hash = hashlib.sha3_256(row.code_blob.encode()).digest()
        mint = await inft.mint(
            to_address=user.wallet_address,
            metadata_hash=bytes.fromhex(strategy_hash_hex),
            sealed_config_hash=sealed_hash,
        )
        if mint is not None:
            inft_token_id, inft_mint_tx = mint
            mp.inft_token_id = inft_token_id
            mp.inft_mint_tx = inft_mint_tx

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Marketplace conflict")
    await db.refresh(mp)
    await audit.record(actor=user.id, action="strategy.publish", target=mp.id, db=None)

    return PublishResponse(
        marketplace_id=mp.id,
        status="published",
        strategy_hash=strategy_hash_hex,
        backtest=bt,
        tx_hashes={
            "registry": tx_registry,
            "attest": tx_attest,
            "inft_mint": inft_mint_tx,
            "inft_token_id": str(inft_token_id) if inft_token_id else None,
        },
    )
