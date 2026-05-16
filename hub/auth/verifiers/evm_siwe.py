"""EVM personal_sign verifier for 0G (and any EIP-191 EVM chain).

Signature shape: EIP-191 `personal_sign` over the canonical sign-in message
string the hub builds. We recover the signer with `eth_account` and check it
matches `address` (case-insensitive checksum compare).

The Cosmos ADR-36 verifier has a 4-arg signature (address, message,
signature_b64, pubkey_b64). EVM has no pubkey input — the address is recovered
from sig — so `pubkey_b64` is accepted and ignored to keep the dispatcher
interface stable.

Signature format accepted:
  * `0x`-prefixed hex (canonical MetaMask output)
  * base64 (legacy fallback, in case a non-EVM client routes through here)
"""
from __future__ import annotations

import base64
import logging

logger = logging.getLogger(__name__)


def _normalize_signature(sig: str) -> bytes:
    s = sig.strip()
    if s.startswith("0x") or s.startswith("0X"):
        return bytes.fromhex(s[2:])
    # raw hex without 0x?
    if len(s) in (130, 128) and all(c in "0123456789abcdefABCDEF" for c in s):
        return bytes.fromhex(s)
    # base64 fallback
    return base64.b64decode(s)


def verify_evm_siwe(
    address: str,
    message: str,
    signature: str,
    pubkey_b64: str,  # noqa: ARG001 — unused; recovered from sig
) -> bool:
    """Recover signer from EIP-191 personal_sign and compare to `address`."""
    try:
        from eth_account import Account
        from eth_account.messages import encode_defunct
    except Exception as exc:  # pragma: no cover — dep should be present via web3
        logger.error("evm_siwe verify: eth_account import failed: %s", exc)
        return False

    try:
        sig_bytes = _normalize_signature(signature)
        encoded = encode_defunct(text=message)
        recovered = Account.recover_message(encoded, signature=sig_bytes)
        ok = recovered.lower() == address.lower()
        if not ok:
            logger.warning(
                "evm_siwe: recovered=%s expected=%s", recovered, address
            )
        return ok
    except Exception as exc:
        logger.warning("evm_siwe verify failed: %s", exc)
        return False
