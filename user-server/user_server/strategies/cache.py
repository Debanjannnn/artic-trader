"""LRU cache for parsed Style-B strategies, keyed by sha256(source)."""
from __future__ import annotations

import hashlib
from collections import OrderedDict
from threading import Lock

from .runner import StrategyHandle, load_strategy

_MAX_ENTRIES = 256
_lock = Lock()
_cache: "OrderedDict[str, StrategyHandle]" = OrderedDict()


def _hash(source: str) -> str:
    return hashlib.sha256(source.encode("utf-8")).hexdigest()


def get_or_load(source: str) -> StrategyHandle:
    """Return cached handle for `source`, loading + validating on miss."""
    key = _hash(source)
    with _lock:
        handle = _cache.get(key)
        if handle is not None:
            _cache.move_to_end(key)
            return handle
    # Load outside the lock — validation/compile is CPU work.
    handle = load_strategy(source)
    with _lock:
        _cache[key] = handle
        _cache.move_to_end(key)
        while len(_cache) > _MAX_ENTRIES:
            _cache.popitem(last=False)
    return handle


def clear() -> None:
    """Drop all cached handles (test helper)."""
    with _lock:
        _cache.clear()


def size() -> int:
    with _lock:
        return len(_cache)
