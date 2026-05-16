"""On-chain client for StrategyINFT (ERC-7857 Agent ID).

Mirrors marketplace_client.py pattern. Mints a tradable NFT per published
strategy whose encrypted config is referenced by `metadataHash`. Buyers gain
execution rights via `authorizeUsage` without ever seeing the raw config.

Disabled gracefully when RPC / key / contract address absent.
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _load_inft_abi() -> list[dict[str, Any]]:
    """Load ABI from contracts/inft_deployed.json (written by deploy_inft.py)."""
    path = _repo_root() / "contracts" / "inft_deployed.json"
    try:
        with open(path, "r") as f:
            return json.load(f)["abi"]
    except (FileNotFoundError, KeyError, json.JSONDecodeError) as exc:
        logger.warning("INFT ABI load failed (%s); client disabled", exc)
        return []


class StrategyINFTClient:
    """Mint StrategyINFT tokens + authorize usage. No-op when unconfigured."""

    def __init__(
        self,
        rpc_url: str | None,
        private_key: str | None,
        contract_address: str | None,
        gas_limit: int = 500_000,
    ) -> None:
        abi = _load_inft_abi()
        self._enabled = bool(rpc_url and private_key and contract_address and abi)
        self._gas_limit = gas_limit
        self._w3 = None
        self._account = None
        self._contract = None

        if not self._enabled:
            logger.info("StrategyINFTClient disabled (missing config)")
            return

        try:
            from web3 import Web3
        except ImportError:
            logger.warning("web3 not installed; StrategyINFTClient disabled")
            self._enabled = False
            return

        self._w3 = Web3(Web3.HTTPProvider(rpc_url))
        self._account = self._w3.eth.account.from_key(private_key)
        self._contract = self._w3.eth.contract(
            address=Web3.to_checksum_address(contract_address), abi=abi
        )

    @classmethod
    def from_env(cls) -> "StrategyINFTClient":
        return cls(
            rpc_url=os.environ.get("ZERO_G_RPC_URL")
            or os.environ.get("CHAIN_RPC_URL"),
            private_key=os.environ.get("ZERO_G_PRIVATE_KEY")
            or os.environ.get("CHAIN_PRIVATE_KEY"),
            contract_address=os.environ.get("INFT_CONTRACT_ADDRESS"),
        )

    @property
    def is_enabled(self) -> bool:
        return self._enabled

    async def mint(
        self,
        to_address: str,
        metadata_hash: bytes,
        sealed_config_hash: bytes,
    ) -> Optional[tuple[int, str]]:
        """Mint INFT to `to_address`. Returns (tokenId, tx_hash_hex) or None."""
        if not self._enabled:
            return None
        if len(metadata_hash) != 32 or len(sealed_config_hash) != 32:
            raise ValueError("hashes must be 32 bytes")

        def _send() -> tuple[int, str]:
            assert self._w3 and self._account and self._contract
            from web3 import Web3
            recipient = Web3.to_checksum_address(to_address)
            nonce = self._w3.eth.get_transaction_count(self._account.address)
            tx = self._contract.functions.mint(
                recipient, metadata_hash, sealed_config_hash
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
            receipt = self._w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)
            # Extract tokenId from Minted event (topic[1]).
            token_id = 0
            for log in receipt.logs:
                if log.topics and len(log.topics) >= 2:
                    try:
                        token_id = int.from_bytes(log.topics[1], "big")
                        break
                    except Exception:
                        continue
            return token_id, tx_hash.hex()

        try:
            return await asyncio.to_thread(_send)
        except Exception as exc:
            logger.warning("StrategyINFT.mint failed: %s", exc)
            return None

    async def authorize_usage(self, token_id: int, user_address: str) -> Optional[str]:
        """Grant `user_address` execution rights on tokenId. Returns tx hash or None."""
        if not self._enabled:
            return None

        def _send() -> str:
            assert self._w3 and self._account and self._contract
            from web3 import Web3
            user = Web3.to_checksum_address(user_address)
            nonce = self._w3.eth.get_transaction_count(self._account.address)
            tx = self._contract.functions.authorizeUsage(
                int(token_id), user
            ).build_transaction(
                {
                    "from": self._account.address,
                    "nonce": nonce,
                    "gas": 120_000,
                    "gasPrice": self._w3.eth.gas_price,
                }
            )
            signed = self._account.sign_transaction(tx)
            tx_hash = self._w3.eth.send_raw_transaction(signed.raw_transaction)
            return tx_hash.hex()

        try:
            return await asyncio.to_thread(_send)
        except Exception as exc:
            logger.warning("StrategyINFT.authorizeUsage failed: %s", exc)
            return None
