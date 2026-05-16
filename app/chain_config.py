"""Chain config — 0G Mainnet only.

Resolves RPC URL / private key / chain ID / explorer base from env. 0G-only;
no legacy multi-chain fallbacks.
"""
import os
from typing import Optional


def get_rpc_url() -> Optional[str]:
    return os.getenv("ZERO_G_RPC_URL") or None


def get_private_key() -> Optional[str]:
    return os.getenv("ZERO_G_PRIVATE_KEY") or None


def get_chain_id() -> Optional[str]:
    """EVM chain ID. 0G Mainnet = 16661."""
    return os.getenv("ZERO_G_CHAIN_ID") or "16661"


def get_explorer_base() -> str:
    """0G Mainnet explorer."""
    return os.getenv("ZERO_G_EXPLORER_BASE", "https://chainscan.0g.ai").rstrip("/")


def explorer_tx_url(tx_hash: str) -> str:
    if not tx_hash:
        return ""
    h = tx_hash if tx_hash.startswith("0x") else f"0x{tx_hash}"
    return f"{get_explorer_base()}/tx/{h}"


def explorer_address_url(address: str) -> str:
    if not address:
        return ""
    return f"{get_explorer_base()}/address/{address}"
