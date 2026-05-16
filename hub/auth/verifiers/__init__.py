"""Chain-pluggable signature verifiers.

Each entry: chain_id → Callable[[address, message, signature_b64, pubkey_b64], bool].
Raise nothing; return False on any verification failure. Message is the exact
string the client signed (server rebuilds it from the stored nonce).
"""
from __future__ import annotations

from typing import Callable

from .evm_siwe import verify_evm_siwe

Verifier = Callable[[str, str, str, str], bool]

VERIFIERS: dict[str, Verifier] = {
    "0g-mainnet": verify_evm_siwe,
}


def get_verifier(chain: str) -> Verifier | None:
    return VERIFIERS.get(chain)
