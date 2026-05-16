"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Family = {
  key: string;
  title: string;
  blurb: string;
  algos: string[];
  accent: string;
};

const families: Family[] = [
  {
    key: "momentum",
    title: "Momentum",
    blurb: "Ride trends. Exit when the move exhausts.",
    accent: "#6FCAA0",
    algos: ["MACD-cross", "RSI-breakout", "Donchian-channel", "Supertrend", "ADX-filter"],
  },
  {
    key: "mean-rev",
    title: "Mean reversion",
    blurb: "Fade overshoots. Trade the snap-back.",
    accent: "#8FB1E8",
    algos: ["Bollinger-fade", "Z-score reversion", "Keltner-bounce", "Pivot-revert"],
  },
  {
    key: "statistical",
    title: "Statistical",
    blurb: "Distribution-driven entries. Probabilistic exits.",
    accent: "#B3C9EE",
    algos: ["Hurst-regime", "Ornstein-Uhlenbeck", "Cointegration", "Kalman-trend"],
  },
  {
    key: "volatility",
    title: "Volatility",
    blurb: "Trade the variance, not the level.",
    accent: "#F0C561",
    algos: ["ATR-breakout", "Vol-target", "Squeeze-momentum", "GARCH-vol"],
  },
  {
    key: "volume",
    title: "Volume",
    blurb: "Follow the flow. Confirm with size.",
    accent: "#F3E4D1",
    algos: ["VWAP-anchor", "OBV-trend", "Volume-spike", "Accum-dist"],
  },
  {
    key: "smart-money",
    title: "Smart money",
    blurb: "Read order-flow imprints. Front-run liquidity.",
    accent: "#E85F5F",
    algos: ["Order-block", "Liquidity-sweep", "FVG-fill", "BOS-confirm"],
  },
  {
    key: "rwa",
    title: "RWA hedging",
    blurb: "Stable-asset overlays. Yield-aware sizing.",
    accent: "#6FCAA0",
    algos: ["Funding-skew", "Basis-trade", "Stable-rotation"],
  },
];

export function StrategyCatalog() {
  const [active, setActive] = useState(0);
  const f = families[active];

  return (
    <section className="relative px-6 md:px-12 py-28 md:py-36 max-w-7xl mx-auto">
      <div className="mb-14">
        <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-3">
          §04 — Strategy library
        </p>
        <h2 className="text-[clamp(36px,5vw,64px)] font-light tracking-tight text-foreground leading-[0.95]">
          Seven families.<br />
          <em className="not-italic font-serif text-foreground/80">Thirty + algorithms.</em>
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-10 lg:gap-16">
        <div className="border-t border-foreground/10">
          {families.map((fam, i) => {
            const isActive = i === active;
            return (
              <button
                key={fam.key}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="group relative w-full flex items-center justify-between py-4 px-1 border-b border-foreground/10 text-left"
              >
                {isActive && (
                  <motion.span
                    layoutId="strat-active"
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{ background: fam.accent }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className={
                    "text-[15px] tracking-tight transition-colors pl-3 " +
                    (isActive ? "text-foreground" : "text-foreground/55 group-hover:text-foreground/85")
                  }
                >
                  {fam.title}
                </span>
                <span className="text-[10px] font-mono text-foreground/30 tabular-nums">
                  {String(fam.algos.length).padStart(2, "0")}
                </span>
              </button>
            );
          })}
        </div>

        <div className="lg:sticky lg:top-28 self-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <p
                className="text-[10px] tracking-[2.5px] uppercase font-mono mb-4"
                style={{ color: f.accent }}
              >
                Family / {f.title}
              </p>
              <h3 className="text-[clamp(28px,3.4vw,44px)] font-light tracking-tight text-foreground leading-tight mb-5 max-w-[20ch]">
                {f.blurb}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 max-w-2xl">
                {f.algos.map((a, i) => (
                  <motion.div
                    key={a}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 py-3 border-b border-foreground/5"
                  >
                    <span className="text-[10px] font-mono text-foreground/30 tabular-nums w-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[13px] text-foreground/85">{a}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
