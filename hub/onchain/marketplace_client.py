"""On-chain client for marketplace publishing (StrategyRegistry + BacktestAttest).

Reads ABI from `contracts/out/<File>.sol/<File>.json` (foundry build output) when
present; falls back to inline minimal ABIs. Gracefully no-ops when RPC URL or
private key absent — same pattern as `app/onchain_logger.py`.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)


# Inline fallback ABIs (matches contracts/src/StrategyRegistry.sol +
# contracts/src/BacktestAttest.sol). Used if foundry artifacts not on disk.
_REGISTRY_ABI_FALLBACK: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "publish",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "strategyHash", "type": "bytes32"},
            {"name": "codeCID", "type": "bytes32"},
            {"name": "name", "type": "string"},
        ],
        "outputs": [],
    },
]

_ATTEST_ABI_FALLBACK: list[dict[str, Any]] = [
    {
        "type": "function",
        "name": "attest",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "strategyHash", "type": "bytes32"},
            {"name": "datasetHash", "type": "bytes32"},
            {"name": "sharpeBps", "type": "int32"},
            {"name": "maxDdBps", "type": "uint16"},
            {"name": "totalReturnBps", "type": "int32"},
            {"name": "winRateBps", "type": "uint16"},
            {"name": "nTrades", "type": "uint32"},
        ],
        "outputs": [],
    },
]


def _repo_root() -> Path:
    # /hub/onchain/marketplace_client.py → repo root is two parents up.
    return Path(__file__).resolve().parents[2]


def _load_abi(contract_filename: str, fallback: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Load `<contract>.json` from contracts/out/<file>.sol/. Fall back if missing."""
    artifact = (
        _repo_root() / "contracts" / "out" / f"{contract_filename}.sol" / f"{contract_filename}.json"
    )
    if not artifact.exists():
        logger.warning("ABI artifact not found at %s; using fallback", artifact)
        return fallback
    try:
        with open(artifact, "r") as f:
            data = json.load(f)
        abi = data.get("abi")
        if not isinstance(abi, list):
            return fallback
        return abi
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("Failed to load ABI %s: %s; using fallback", artifact, exc)
        return fallback


class MarketplaceChainClient:
    """Submits StrategyRegistry.publish + BacktestAttest.attest to Mantle.

    Disabled gracefully when RPC URL / key / addresses absent. Disabled clients
    return None from each tx-submitting method.
    """

    def __init__(
        self,
        rpc_url: str | None,
        private_key: str | None,
        registry_address: str | None,
        attest_address: str | None,
        gas_limit: int = 300_000,
    ) -> None:
        self._enabled = bool(rpc_url and private_key and registry_address and attest_address)
        self._rpc_url = rpc_url
        self._registry_address = registry_address
        self._attest_address = attest_address
        self._gas_limit = gas_limit
        self._w3 = None
        self._account = None
        self._registry = None
        self._attest = None

        if not self._enabled:
            logger.info("MarketplaceChainClient disabled (missing config)")
            return

        try:
            from web3 import Web3
        except ImportError:  # pragma: no cover
            logger.warning("web3 not installed; MarketplaceChainClient disabled")
            self._enabled = False
            return

        self._w3 = Web3(Web3.HTTPProvider(rpc_url))
        self._account = self._w3.eth.account.from_key(private_key)
        self._registry = self._w3.eth.contract(
            address=Web3.to_checksum_address(registry_address),
            abi=_load_abi("StrategyRegistry", _REGISTRY_ABI_FALLBACK),
        )
        self._attest = self._w3.eth.contract(
            address=Web3.to_checksum_address(attest_address),
            abi=_load_abi("BacktestAttest", _ATTEST_ABI_FALLBACK),
        )

    @classmethod
    def from_env(cls) -> "MarketplaceChainClient":
        return cls(
            rpc_url=os.environ.get("MANTLE_RPC_URL") or None,
            private_key=os.environ.get("MANTLE_PRIVATE_KEY") or None,
            registry_address=os.environ.get("STRATEGY_REGISTRY_ADDRESS") or None,
            attest_address=os.environ.get("BACKTEST_ATTEST_ADDRESS") or None,
        )

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    async def publish_strategy(
        self,
        strategy_hash: bytes,
        code_cid: bytes,
        name: str,
    ) -> Optional[str]:
        """Submit StrategyRegistry.publish. Returns tx hash hex or None if disabled."""
        if not self._enabled:
            return None
        if len(strategy_hash) != 32 or len(code_cid) != 32:
            raise ValueError("strategy_hash and code_cid must be 32 bytes")

        def _send() -> str:
            assert self._w3 is not None and self._account is not None and self._registry is not None
            nonce = self._w3.eth.get_transaction_count(self._account.address)
            tx = self._registry.functions.publish(strategy_hash, code_cid, name).build_transaction(
                {
                    "from": self._account.address,
                    "nonce": nonce,
                    "gas": self._gas_limit,
                    "gasPrice": self._w3.eth.gas_price,
                }
            )
            signed = self._account.sign_transaction(tx)
            tx_hash = self._w3.eth.send_raw_transaction(signed.raw_transaction)
            return tx_hash.hex()

        try:
            return await asyncio.to_thread(_send)
        except Exception as exc:  # noqa: BLE001
            logger.warning("publish_strategy failed: %s", exc)
            return None

    async def attest_backtest(
        self,
        strategy_hash: bytes,
        dataset_hash: bytes,
        sharpe_bps: int,
        max_dd_bps: int,
        total_return_bps: int,
        win_rate_bps: int,
        n_trades: int,
    ) -> Optional[str]:
        """Submit BacktestAttest.attest. Returns tx hash hex or None if disabled."""
        if not self._enabled:
            return None
        if len(strategy_hash) != 32 or len(dataset_hash) != 32:
            raise ValueError("hashes must be 32 bytes")

        def _send() -> str:
            assert self._w3 is not None and self._account is not None and self._attest is not None
            nonce = self._w3.eth.get_transaction_count(self._account.address)
            tx = self._attest.functions.attest(
                strategy_hash,
                dataset_hash,
                int(sharpe_bps),
                int(max_dd_bps),
                int(total_return_bps),
                int(win_rate_bps),
                int(n_trades),
            ).build_transaction(
                {
                    "from": self._account.address,
                    "nonce": nonce,
                    "gas": self._gas_limit,
                    "gasPrice": self._w3.eth.gas_price,
                }
            )
            signed = self._account.sign_transaction(tx)
            tx_hash = self._w3.eth.send_raw_transaction(signed.raw_transaction)
            return tx_hash.hex()

        try:
            return await asyncio.to_thread(_send)
        except Exception as exc:  # noqa: BLE001
            logger.warning("attest_backtest failed: %s", exc)
            return None
