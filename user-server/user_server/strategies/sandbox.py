"""AST-whitelist Python sandbox for user-authored Style-B strategies.

Validates source against a node whitelist + name blacklist, then exec()s into
a clean namespace whose __builtins__ is a curated SAFE_BUILTINS dict. Wall-clock
caps are applied at tick() time in runner.py via signal.alarm; memory cap is
applied process-wide on first import (best-effort; Linux only).
"""
from __future__ import annotations

import ast
import resource
from typing import Any

# --- Errors -----------------------------------------------------------------


class SandboxError(Exception):
    """Base class for all sandbox failures."""


class ASTViolation(SandboxError):
    """Source contains a banned AST node or name."""


class RuntimeViolation(SandboxError):
    """Strategy produced an invalid result or raised at runtime."""


class TimeoutViolation(SandboxError):
    """Strategy exceeded its wall-clock budget."""


# --- AST whitelist ----------------------------------------------------------

ALLOWED_NODES: frozenset[type] = frozenset(
    {
        ast.Module,
        ast.Expr,
        ast.Constant,
        ast.FormattedValue,  # f-string component (banned via JoinedStr below)
        ast.List,
        ast.Tuple,
        ast.Dict,
        ast.Set,
        ast.BinOp,
        ast.UnaryOp,
        ast.BoolOp,
        ast.Compare,
        ast.IfExp,
        ast.If,
        ast.For,
        ast.While,
        ast.Break,
        ast.Continue,
        ast.Pass,
        ast.FunctionDef,
        ast.arguments,
        ast.arg,
        ast.Return,
        ast.Lambda,
        ast.Call,
        ast.keyword,
        ast.Name,
        ast.Load,
        ast.Store,
        ast.Del,  # ast.Del context (not Delete stmt) — needed for some forms; harmless
        ast.Assign,
        ast.AugAssign,
        ast.AnnAssign,
        ast.Subscript,
        ast.Slice,
        ast.Index if hasattr(ast, "Index") else ast.Slice,  # py<3.9 compat noop
        ast.ListComp,
        ast.SetComp,
        ast.DictComp,
        ast.GeneratorExp,
        ast.comprehension,
        # operator nodes
        ast.Add,
        ast.Sub,
        ast.Mult,
        ast.Div,
        ast.FloorDiv,
        ast.Mod,
        ast.Pow,
        ast.MatMult,
        ast.LShift,
        ast.RShift,
        ast.BitOr,
        ast.BitXor,
        ast.BitAnd,
        ast.USub,
        ast.UAdd,
        ast.Not,
        ast.Invert,
        ast.And,
        ast.Or,
        ast.Eq,
        ast.NotEq,
        ast.Lt,
        ast.LtE,
        ast.Gt,
        ast.GtE,
        ast.Is,
        ast.IsNot,
        ast.In,
        ast.NotIn,
        ast.Starred,
    }
)

BANNED_NODES: frozenset[type] = frozenset(
    {
        ast.Import,
        ast.ImportFrom,
        ast.Attribute,
        ast.Global,
        ast.Nonlocal,
        ast.ClassDef,
        ast.Try,
        ast.Raise,
        ast.With,
        ast.AsyncWith,
        ast.Yield,
        ast.YieldFrom,
        ast.AsyncFunctionDef,
        ast.AsyncFor,
        ast.Await,
        ast.Delete,
        ast.JoinedStr,  # f-strings
    }
)

BANNED_NAMES: frozenset[str] = frozenset(
    {
        "__import__",
        "eval",
        "exec",
        "compile",
        "open",
        "input",
        "globals",
        "locals",
        "vars",
        "dir",
        "getattr",
        "setattr",
        "delattr",
        "hasattr",
        "type",
        "object",
        "super",
        "__builtins__",
        "__class__",
        "__bases__",
        "__subclasses__",
        "__mro__",
        "__dict__",
        "__code__",
        "__globals__",
    }
)

# Curated builtins exposed to user code. No I/O, no introspection.
SAFE_BUILTINS: dict[str, Any] = {
    "range": range,
    "len": len,
    "min": min,
    "max": max,
    "abs": abs,
    "sum": sum,
    "sorted": sorted,
    "round": round,
    "enumerate": enumerate,
    "zip": zip,
    "map": map,
    "filter": filter,
    "any": any,
    "all": all,
    "int": int,
    "float": float,
    "str": str,
    "bool": bool,
    "list": list,
    "dict": dict,
    "tuple": tuple,
    "set": set,
    "True": True,
    "False": False,
    "None": None,
}


def validate_ast(tree: ast.AST) -> None:
    """Walk the AST; raise ASTViolation on any banned node, name, or dunder."""
    for node in ast.walk(tree):
        node_type = type(node)
        if node_type in BANNED_NODES:
            raise ASTViolation(f"banned syntax: {node_type.__name__}")
        # Name nodes get their identifier checked.
        if isinstance(node, ast.Name):
            if node.id in BANNED_NAMES or _is_dunder(node.id):
                raise ASTViolation(f"banned name: {node.id!r}")
        # FunctionDef / Lambda arg names also can't shadow dunders.
        if isinstance(node, ast.arg) and _is_dunder(node.arg):
            raise ASTViolation(f"banned arg name: {node.arg!r}")
        # Forbid any string literal that looks like a dunder lookup keyword
        # being used as a Subscript key (cheap belt-and-braces).
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            if _is_dunder(node.value):
                raise ASTViolation(f"banned dunder literal: {node.value!r}")


def _is_dunder(name: str) -> bool:
    return name.startswith("__") and name.endswith("__") and len(name) >= 4


def parse_and_validate(source: str) -> ast.Module:
    """Parse source and run AST whitelist. Raises ASTViolation on violation."""
    try:
        tree = ast.parse(source, filename="<strategy>", mode="exec")
    except SyntaxError as exc:
        raise ASTViolation(f"syntax error: {exc.msg}") from exc
    validate_ast(tree)
    return tree


def make_safe_globals() -> dict[str, Any]:
    """Build a fresh globals dict for executing a validated strategy."""
    return {"__builtins__": dict(SAFE_BUILTINS)}


def apply_memory_cap(limit_bytes: int = 128 * 1024 * 1024) -> None:
    """Best-effort RLIMIT_AS cap. Linux only; silently ignored elsewhere."""
    try:
        soft, hard = resource.getrlimit(resource.RLIMIT_AS)
        new_hard = hard if hard != resource.RLIM_INFINITY and hard < limit_bytes else limit_bytes
        resource.setrlimit(resource.RLIMIT_AS, (limit_bytes, new_hard))
    except (ValueError, OSError, AttributeError):
        pass
