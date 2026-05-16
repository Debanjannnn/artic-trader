"""
mETH / ETH staking-premium mean reversion (Mantle RWA).

mETH is Mantle's liquid-staked ETH. Its price vs ETH should track
~1 + accrued staking yield. We trade the spread:
- Buy mETH when ratio < 1 - discount_threshold (discounted vs fair)
- Sell mETH when ratio > 1 + premium_threshold (premium vs fair)

Lower-vol asset class, so position sizing should be 0.5x normal and
stops are tight (0.5% SL, 1.5% TP). Caller's risk layer reads sizing
hints out of the detail string; we also return a small clipped signal.

TODO(mantle): replace hardcoded yield with on-chain query to the Mantle
staking contract; pull mETH/ETH ratio from Merchant Moe / Agni DEX once
the Mantle adapter lands. Until then `prices` is interpreted as the
mETH/ETH ratio time series fed by the engine's price source.
"""
from typing import List, Tuple


def meth_rwa(
    prices: List[float],
    yield_apr: float = 0.04,
    discount_threshold: float = 0.002,
    premium_threshold: float = 0.005,
    sl_pct: float = 0.005,
    tp_pct: float = 0.015,
    size_mult: float = 0.5,
    **_,
) -> Tuple[float, str]:
    """Mean-revert staking premium of mETH/ETH ratio.

    Args:
        prices: mETH/ETH ratio series (most recent last).
        yield_apr: annualised mETH staking yield estimate (LLM-overridable).
        discount_threshold: ratio < (1 - this) -> long.
        premium_threshold: ratio > (1 + this) -> short.

    Returns (signal, detail). signal in [-1, 1], scaled by size_mult.
    """
    if not prices:
        return 0.0, "no prices"
    if len(prices) < 2:
        return 0.0, "warming up"

    ratio = prices[-1]
    if ratio <= 0:
        return 0.0, "invalid ratio"

    # Per-day yield drift — purely informational for the LLM detail string.
    daily_yield = yield_apr / 365.0
    fair = 1.0  # baseline; the staking premium accrues into ratio over time

    deviation = ratio - fair

    if ratio < (fair - discount_threshold):
        # Long mETH — buy the discount.
        magnitude = min(1.0, abs(deviation) / max(discount_threshold, 1e-9))
        sig = magnitude * size_mult
        return sig, (
            f"meth_rwa long: ratio={ratio:.5f} discount={-deviation*1e4:.1f}bps "
            f"yield_apr={yield_apr:.3f} daily={daily_yield*1e4:.2f}bps "
            f"SL={sl_pct*100:.2f}% TP={tp_pct*100:.2f}% size_mult={size_mult}"
        )

    if ratio > (fair + premium_threshold):
        # Short mETH — fade the premium.
        magnitude = min(1.0, abs(deviation) / max(premium_threshold, 1e-9))
        sig = -magnitude * size_mult
        return sig, (
            f"meth_rwa short: ratio={ratio:.5f} premium={deviation*1e4:.1f}bps "
            f"yield_apr={yield_apr:.3f} daily={daily_yield*1e4:.2f}bps "
            f"SL={sl_pct*100:.2f}% TP={tp_pct*100:.2f}% size_mult={size_mult}"
        )

    return 0.0, (
        f"meth_rwa flat: ratio={ratio:.5f} dev={deviation*1e4:.1f}bps "
        f"thresholds=[-{discount_threshold*1e4:.0f},+{premium_threshold*1e4:.0f}]bps"
    )
