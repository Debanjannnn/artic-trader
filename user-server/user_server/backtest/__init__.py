"""Backtest engine — runs Style-B on_tick strategies on historical candles."""
from __future__ import annotations

from .engine import Result, run
from .metrics import max_drawdown, sharpe, total_return, win_rate

__all__ = ["Result", "run", "sharpe", "max_drawdown", "win_rate", "total_return"]
