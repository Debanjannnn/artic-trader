"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

type Trade = {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  size: string;
  pnlPct: number;
  agent: string;
  ts: string;
};

const symbols = ["BTC/USDT", "ETH/USDT", "SOL/USDT", "AVAX/USDT", "LINK/USDT", "MATIC/USDT", "ARB/USDT"];
const agents = ["snowdrift", "permafrost", "tundra", "blizzard", "icefall", "glacier", "fjord", "cairn"];

function genTrade(id: number): Trade {
  const side: Trade["side"] = Math.random() > 0.5 ? "LONG" : "SHORT";
  return {
    id,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    side,
    size: (0.05 + Math.random() * 1.2).toFixed(3),
    pnlPct: parseFloat(((Math.random() - 0.4) * 4).toFixed(2)),
    agent: agents[Math.floor(Math.random() * agents.length)],
    ts: new Date().toLocaleTimeString("en-GB", { hour12: false }),
  };
}

function Sparkline({ data }: { data: number[] }) {
  const W = 300;
  const H = 48;
  const path = useMemo(() => {
    if (data.length < 2) return "";
    const cumulative = data.reduce<number[]>((acc, v) => {
      acc.push((acc[acc.length - 1] ?? 0) + v);
      return acc;
    }, []);
    const min = Math.min(...cumulative);
    const max = Math.max(...cumulative);
    const range = max - min || 1;
    return cumulative
      .map((v, i) => {
        const x = (i / (cumulative.length - 1)) * W;
        const y = H - 4 - ((v - min) / range) * (H - 8);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [data]);

  const isPositive = useMemo(() => {
    const sum = data.reduce((a, b) => a + b, 0);
    return sum >= 0;
  }, [data]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="w-full h-12"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isPositive ? "#6FCAA0" : "#E85F5F"} stopOpacity="0.25" />
          <stop offset="100%" stopColor={isPositive ? "#6FCAA0" : "#E85F5F"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${path} L ${W} ${H} L 0 ${H} Z`}
        fill="url(#spark-fill)"
      />
      <path
        d={path}
        fill="none"
        stroke={isPositive ? "#6FCAA0" : "#E85F5F"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LivePnlFeed() {
  const [trades, setTrades] = useState<Trade[]>(() =>
    Array.from({ length: 12 }, (_, i) => genTrade(i))
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let counter = trades.length;
    const id = setInterval(() => {
      counter += 1;
      setTrades((prev) => [genTrade(counter), ...prev].slice(0, 12));
    }, 2400);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sessionTotal = trades.reduce((s, t) => s + t.pnlPct, 0);
  const isUp = sessionTotal >= 0;

  return (
    <section className="relative px-6 md:px-12 py-28 md:py-36 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 items-start">

        <div className="rounded-2xl border border-foreground/10 bg-foreground/1.5 overflow-hidden">
          {/* header */}
          <div className="px-5 py-3 border-b border-foreground/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: isUp ? "#6FCAA0" : "#E85F5F" }}
              />
              <span className="text-[11px] font-mono uppercase tracking-wider text-foreground/55">
                pack · live tape
              </span>
            </div>
            <span
              className="text-[11px] font-mono tabular-nums"
              style={{ color: isUp ? "#6FCAA0" : "#E85F5F" }}
            >
              session {isUp ? "+" : ""}{sessionTotal.toFixed(2)}%
            </span>
          </div>

          {/* sparkline */}
          <div className="px-2 pt-2 pb-1 border-b border-foreground/5">
            <Sparkline data={trades.map((t) => t.pnlPct)} />
          </div>

          {/* rows */}
          <div className="divide-y divide-white/5 max-h-80 overflow-hidden">
            {trades.slice(0, 8).map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22 }}
                className="px-5 py-2.5 flex items-center gap-4 font-mono text-[12px] hover:bg-foreground/2"
              >
                <span className="text-foreground/25 w-14 shrink-0 tabular-nums">{t.ts}</span>
                <span className="text-foreground/50 w-20 shrink-0 truncate">{t.agent}</span>
                <span className="text-foreground/80 w-20 shrink-0">{t.symbol}</span>
                <span
                  className="w-12 shrink-0 text-[11px] tracking-wide"
                  style={{ color: t.side === "LONG" ? "#6FCAA0" : "#E85F5F" }}
                >
                  {t.side}
                </span>
                <span className="text-foreground/40 flex-1 truncate">{t.size}</span>
                <span
                  className="tabular-nums w-14 text-right shrink-0"
                  style={{ color: t.pnlPct >= 0 ? "#6FCAA0" : "#E85F5F" }}
                >
                  {t.pnlPct >= 0 ? "+" : ""}{t.pnlPct.toFixed(2)}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="lg:pl-6">
          <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-4">
            §08 — Live tape
          </p>
          <h2 className="text-[clamp(32px,4vw,52px)] font-light tracking-tight text-foreground leading-[0.95] mb-6">
            See the pack<br />
            <em className="not-italic font-serif text-foreground/80">trade in real time.</em>
          </h2>
          <p className="text-[14px] text-foreground/55 leading-relaxed max-w-md mb-8">
            Every fill from every agent in your pack streams to one tape. Filter by symbol, side, or agent. Replay any window. Export to CSV.
          </p>

          {/* stat pills */}
          <div className="flex flex-wrap gap-3">
            {[
              { label: "agents active", value: "8" },
              { label: "fills / min", value: "~24" },
              { label: "symbols tracked", value: "7" },
            ].map(({ label, value }) => (
              <div key={label} className="px-4 py-2.5 rounded-xl border border-foreground/10 bg-foreground/2">
                <p className="text-[18px] font-light text-foreground tabular-nums">{value}</p>
                <p className="text-[10px] font-mono text-foreground/35 uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
