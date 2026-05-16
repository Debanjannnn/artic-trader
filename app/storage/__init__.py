"""0G Storage client — uploads LLM reasoning + trade detail JSON to 0G Storage Log Layer.

Only the content root hash stays on-chain (via DecisionLogger/TradeLogger contracts).
Full payload is retrievable from 0G via the root hash.
"""
from .og_storage import OGStorageClient, get_client

__all__ = ["OGStorageClient", "get_client"]
