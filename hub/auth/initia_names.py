"""Deprecated — Initia `.init` name service removed. Stub kept so router
callsites + User model columns don't need a coordinated migration."""
from __future__ import annotations

from datetime import datetime


def is_stale(resolved_at: datetime | None) -> bool:
    return False


async def resolve_init_name(address: str) -> str | None:
    return None
