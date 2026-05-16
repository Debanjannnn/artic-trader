"""RestrictedPython executor. Compile-then-exec with static safety + wall-clock
timeout via SIGALRM. Any violation falls back to `simple_momentum` and emits
a log entry. Memory-cap via RLIMIT_AS is deferred — see user-vm.md §Strategy
runner (subprocess isolation is zone work post-alpha).
"""
from __future__ import annotations

import math
import signal
import statistics
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any

from RestrictedPython import compile_restricted, safe_builtins
from RestrictedPython.Guards import (
    guarded_iter_unpack_sequence,
    safer_getattr,
)

from .builtins import BUILTINS, Signal, simple_momentum


class SandboxViolation(Exception):
    """Raised when the user strategy blows a sandbox guarantee (time, import, etc.)."""


class SandboxTimeout(SandboxViolation):
    pass


@dataclass
class RunResult:
    signal: Signal
    strategy_name: str  # name that actually produced the signal (may be the fallback)
    fallback: bool
    error: str | None = None


@contextmanager
def _timeout(ms: int):
    """SIGALRM-based; only works on the main thread of the main interpreter."""

    def _handler(_signum, _frame):
        raise SandboxTimeout(f"strategy exceeded {ms}ms")

    sec = max(1, round(ms / 1000))
    old_handler = signal.signal(signal.SIGALRM, _handler)
    signal.alarm(sec)
    try:
        yield
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, old_handler)


def _safe_globals() -> dict[str, Any]:
    return {
        "__builtins__": {**safe_builtins, "math": math, "statistics": statistics},
        "_getattr_": safer_getattr,
        "_getiter_": iter,
        "_iter_unpack_sequence_": guarded_iter_unpack_sequence,
    }


def run(
    strat_name: str,
    strat_source: str | None,
    plan: dict,
    price_history: list[float],
    candles: list | None = None,
    timeout_ms: int = 500,
) -> RunResult:
    """Execute a strategy. Name matches a builtin or `strat_source` is compiled/executed.

    Guarantees: no unhandled exception escapes; on any sandbox violation the
    fallback runs and a human-readable error is set.
    """
    if strat_name in BUILTINS and strat_source is None:
        try:
            sig = BUILTINS[strat_name](plan, price_history, candles)
            return RunResult(signal=sig, strategy_name=strat_name, fallback=False)
        except Exception as exc:  # noqa: BLE001
            return _fallback(plan, price_history, candles, error=f"builtin raised: {exc}")

    if not strat_source:
        return _fallback(plan, price_history, candles, error=f"no source for {strat_name!r}")

    try:
        code = compile_restricted(strat_source, filename="<strategy>", mode="exec")
    except SyntaxError as exc:
        return _fallback(plan, price_history, candles, error=f"compile: {exc}")

    globs = _safe_globals()
    locs: dict[str, Any] = {}
    try:
        with _timeout(timeout_ms):
            exec(code, globs, locs)  # noqa: S102 — sandboxed
            compute = locs.get("compute") or globs.get("compute")
            if not callable(compute):
                raise SandboxViolation("strategy missing callable `compute(plan, price_history, candles)`")
            sig = compute(plan, price_history, candles)
        if not (
            isinstance(sig, tuple) and len(sig) == 2 and isinstance(sig[0], (int, float)) and isinstance(sig[1], str)
        ):
            raise SandboxViolation(f"strategy returned bad shape: {type(sig).__name__}")
        return RunResult(signal=(float(sig[0]), sig[1]), strategy_name=strat_name, fallback=False)
    except SandboxTimeout as exc:
        return _fallback(plan, price_history, candles, error=str(exc))
    except SandboxViolation as exc:
        return _fallback(plan, price_history, candles, error=f"violation: {exc}")
    except Exception as exc:  # noqa: BLE001 — catch-all; sandbox must never crash user-server
        return _fallback(plan, price_history, candles, error=f"error: {type(exc).__name__}: {exc}")


def _fallback(plan: dict, price_history: list[float], candles: list | None, *, error: str) -> RunResult:
    sig = simple_momentum(plan, price_history, candles)
    return RunResult(signal=sig, strategy_name="simple_momentum", fallback=True, error=error)


# ---------------------------------------------------------------------------
# Style-B ABI: on_tick(ctx) -> {"action", "size", "reason"}.
# AST-whitelisted sandbox; coexists with the legacy `compute(...)` runner above.
# ---------------------------------------------------------------------------

import hashlib  # noqa: E402
from typing import Callable, NamedTuple, Optional  # noqa: E402

from .sandbox import (  # noqa: E402
    RuntimeViolation,
    TimeoutViolation,
    make_safe_globals,
    parse_and_validate,
)

VALID_ACTIONS = frozenset({"OPEN_LONG", "OPEN_SHORT", "CLOSE", "HOLD"})


class StrategyHandle(NamedTuple):
    on_tick: Callable[[dict], dict]
    on_init: Optional[Callable[[dict], None]]
    on_close: Optional[Callable[[dict], None]]
    get_params: Optional[Callable[[], dict]]
    code_hash: str


def load_strategy(source: str) -> StrategyHandle:
    """Validate, compile, and exec a Style-B strategy. Returns a callable handle."""
    tree = parse_and_validate(source)
    code = compile(tree, filename="<strategy>", mode="exec")
    namespace: dict = make_safe_globals()
    try:
        exec(code, namespace)  # noqa: S102 — sandboxed namespace
    except Exception as exc:  # noqa: BLE001
        raise RuntimeViolation(f"load failed: {type(exc).__name__}: {exc}") from exc

    on_tick = namespace.get("on_tick")
    if not callable(on_tick):
        raise RuntimeViolation("strategy missing required `on_tick(ctx)` function")

    return StrategyHandle(
        on_tick=on_tick,
        on_init=namespace.get("on_init") if callable(namespace.get("on_init")) else None,
        on_close=namespace.get("on_close") if callable(namespace.get("on_close")) else None,
        get_params=namespace.get("get_params") if callable(namespace.get("get_params")) else None,
        code_hash=hashlib.sha256(source.encode("utf-8")).hexdigest(),
    )


def _alarm_handler(_signum, _frame):
    raise TimeoutViolation("strategy on_tick exceeded wall-clock budget")


def tick(handle: StrategyHandle, ctx: dict, timeout_s: int = 2) -> dict:
    """Invoke handle.on_tick(ctx) under a SIGALRM cap. Validates result shape."""
    old_handler = signal.signal(signal.SIGALRM, _alarm_handler)
    signal.alarm(timeout_s)
    try:
        result = handle.on_tick(ctx)
    except TimeoutViolation:
        raise
    except Exception as exc:  # noqa: BLE001
        raise RuntimeViolation(f"on_tick raised: {type(exc).__name__}: {exc}") from exc
    finally:
        signal.alarm(0)
        signal.signal(signal.SIGALRM, old_handler)

    if not isinstance(result, dict):
        raise RuntimeViolation(f"on_tick must return dict, got {type(result).__name__}")
    action = result.get("action")
    if action not in VALID_ACTIONS:
        raise RuntimeViolation(f"invalid action {action!r}; must be one of {sorted(VALID_ACTIONS)}")
    size = result.get("size", 0)
    if not isinstance(size, (int, float)) or not (0 <= float(size) <= 1):
        raise RuntimeViolation(f"invalid size {size!r}; must be number in [0, 1]")
    reason = result.get("reason", "")
    if not isinstance(reason, str):
        raise RuntimeViolation(f"invalid reason; must be str, got {type(reason).__name__}")
    return {"action": action, "size": float(size), "reason": reason}
