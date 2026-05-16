"""0G Storage client.

0G Storage Log Layer stores arbitrary blobs addressed by Merkle root hash.
There is no Python SDK; uploads require both a Flow contract `submit()` tx
AND a segment upload to a storage node. We therefore shell out to a thin
Node sidecar in ./sidecar/ that wraps `@0glabs/0g-ts-sdk`.

Indexer URL (Galileo turbo): https://indexer-storage-testnet-turbo.0g.ai
EVM RPC: https://evmrpc-testnet.0g.ai

Failure mode: if anything goes wrong (sidecar missing, network, gas, etc.)
return (None, None). Trading must NOT block on storage availability.
"""
from __future__ import annotations

import json
import logging
import os
import subprocess
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

_DEFAULT_INDEXER = "https://indexer-storage-testnet-turbo.0g.ai"
_DEFAULT_RPC = "https://evmrpc-testnet.0g.ai"
_SIDECAR_DIR = Path(__file__).resolve().parent / "sidecar"
_SIDECAR_ENTRY = _SIDECAR_DIR / "index.js"


class OGStorageClient:
    """Thin wrapper around the 0G TS SDK invoked via Node subprocess.

    Lazy-init: holds no resources until first call. Safe to import even
    when Node/sidecar deps are missing — methods return (None, None).
    """

    def __init__(
        self,
        indexer_url: Optional[str] = None,
        rpc_url: Optional[str] = None,
        private_key: Optional[str] = None,
    ) -> None:
        self.indexer_url = (
            indexer_url
            or os.getenv("ZERO_G_STORAGE_INDEXER_URL")
            or _DEFAULT_INDEXER
        )
        self.rpc_url = (
            rpc_url
            or os.getenv("ZERO_G_RPC_URL")
            or os.getenv("CHAIN_RPC_URL")
            or _DEFAULT_RPC
        )
        self.private_key = (
            private_key
            or os.getenv("ZERO_G_PRIVATE_KEY")
            or os.getenv("CHAIN_PRIVATE_KEY")
            or ""
        )
        self._checked = False
        self._available = False

    # ---- public ---------------------------------------------------------

    def upload_json(self, data: dict) -> Tuple[Optional[str], Optional[str]]:
        """Upload a small JSON blob to 0G Storage.

        Returns (root_hash, tx_hash). Either may be None on failure.
        """
        if not self._ready():
            return (None, None)
        try:
            payload = json.dumps(data, separators=(",", ":"), default=str)
            result = self._run_sidecar("upload", payload)
            if not result or not result.get("ok"):
                logger.warning("[og_storage] upload failed: %s", result)
                return (None, None)
            return (result.get("rootHash"), result.get("txHash"))
        except Exception as e:  # pragma: no cover — last-resort guard
            logger.warning("[og_storage] upload exception: %s", e)
            return (None, None)

    def download_json(self, root_hash: str) -> Optional[dict]:
        """Fetch + parse a JSON blob by Merkle root hash."""
        if not root_hash or not self._ready():
            return None
        try:
            result = self._run_sidecar("download", root_hash)
            if not result or not result.get("ok"):
                logger.warning("[og_storage] download failed: %s", result)
                return None
            raw = result.get("data", "")
            return json.loads(raw) if raw else None
        except Exception as e:  # pragma: no cover
            logger.warning("[og_storage] download exception: %s", e)
            return None

    # ---- internals ------------------------------------------------------

    def _ready(self) -> bool:
        if self._checked:
            return self._available
        self._checked = True
        if not self.private_key:
            logger.info("[og_storage] disabled: no private key configured")
            return False
        if not _SIDECAR_ENTRY.is_file():
            logger.info("[og_storage] disabled: sidecar not built at %s", _SIDECAR_ENTRY)
            return False
        node_modules = _SIDECAR_DIR / "node_modules"
        if not node_modules.is_dir():
            logger.info(
                "[og_storage] disabled: sidecar deps missing — run `npm install` in %s",
                _SIDECAR_DIR,
            )
            return False
        self._available = True
        return True

    def _run_sidecar(self, op: str, arg: str) -> Optional[dict]:
        env = {
            **os.environ,
            "ZERO_G_INDEXER_URL": self.indexer_url,
            "ZERO_G_RPC_URL": self.rpc_url,
            "ZERO_G_PRIVATE_KEY": self.private_key,
        }
        proc = subprocess.run(
            ["node", str(_SIDECAR_ENTRY), op],
            input=arg,
            capture_output=True,
            text=True,
            env=env,
            timeout=60,
            cwd=str(_SIDECAR_DIR),
        )
        if proc.returncode != 0:
            logger.warning("[og_storage] sidecar exit=%s stderr=%s", proc.returncode, proc.stderr[:500])
            return None
        try:
            # Sidecar always prints a single JSON line on stdout (last line)
            line = proc.stdout.strip().splitlines()[-1]
            return json.loads(line)
        except Exception as e:
            logger.warning("[og_storage] sidecar parse failed: %s out=%s", e, proc.stdout[:500])
            return None


# Module-level singleton (lazy)
_singleton: Optional[OGStorageClient] = None


def get_client() -> OGStorageClient:
    global _singleton
    if _singleton is None:
        _singleton = OGStorageClient()
    return _singleton
