"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useScroll, useTransform } from "framer-motion";

type Feature = {
  title: string;
  short: string;
  description: string;
  icon: string;
  accent: string;
  tilt: number;
};

const features: Feature[] = [
  {
    title: "LLM strategy engine",
    short: "AI picks the strategy",
    description:
      "Agents study historical market data and let your chosen LLM select or generate the optimal strategy. Re-evaluates on your schedule.",
    icon: "/assets/landing/icons/fox-brain.svg",
    accent: "#6FCAA0",
    tilt: -1.2,
  },
  {
    title: "Multi-agent orchestration",
    short: "Run dozens in parallel",
    description:
      "Launch dozens of agents simultaneously — locally or on remote VMs. Each runs isolated with its own config, strategy, and position.",
    icon: "/assets/landing/icons/paw-pack.svg",
    accent: "#F3E4D1",
    tilt: 0.8,
  },
  {
    title: "30+ quant strategies",
    short: "Battle-tested live",
    description:
      "Start immediately with momentum, mean reversion, volatility, volume, and statistical strategies — all proven on live markets.",
    icon: "/assets/landing/icons/glacier-chart.svg",
    accent: "#8FB1E8",
    tilt: -0.6,
  },
  {
    title: "Risk-first architecture",
    short: "Hub keeps the kill switch",
    description:
      "Per-agent position limits, drawdown stops, and kill switches. The hub maintains authority — no agent can exceed its mandate.",
    icon: "/assets/landing/icons/ice-shield.svg",
    accent: "#B3C9EE",
    tilt: 1.4,
  },
  {
    title: "Multi-market support",
    short: "Spot, perps, on-chain",
    description:
      "Trade spot and perpetuals on HashKey Global, stream prices from Pyth, and log decisions on-chain — all from one hub.",
    icon: "/assets/landing/icons/frozen-globe.svg",
    accent: "#6FCAA0",
    tilt: -1.0,
  },
  {
    title: "Real-time monitoring",
    short: "Live PnL, logs, reasoning",
    description:
      "Live P&L, position snapshots, trade logs, and LLM reasoning — streamed to your dashboard, Telegram bot, or CLI in real time.",
    icon: "/assets/landing/icons/aurora-pulse.svg",
    accent: "#F0C561",
    tilt: 0.6,
  },
];

const CARD_VW = 56;
const GAP_PX = 96;

export function FeaturesHorizontal() {
  return (
    <>
      <DesktopTrack />
      <MobileStack />
    </>
  );
}

function Wave({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 12" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M2 6 Q12 2 22 6 T42 6 T62 6 T82 6 T102 6 T122 6 T142 6 T162 6 T182 6 T198 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DesktopTrack() {
  const trackRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const [pad, setPad] = useState(0);

  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      const cardW = (CARD_VW / 100) * vw;
      const innerW = features.length * cardW + (features.length - 1) * GAP_PX;
      setPad(Math.max(0, (vw - cardW) / 2));
      setTravel(Math.max(0, innerW - cardW));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);

  return (
    <section
      ref={trackRef}
      className="relative hidden md:block"
      style={{ height: `${features.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-12 pt-28 pb-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-2">
                §02 — Capabilities
              </p>
              <h2 className="text-[clamp(40px,5.5vw,72px)] font-light tracking-tight text-foreground leading-[0.95]">
                Built for the <em className="not-italic font-serif text-foreground/80">cold</em> side<br />
                of crypto.
              </h2>
            </div>
            <div className="text-right hidden lg:block">
              <p className="text-[10px] tracking-[2px] uppercase text-foreground/30 font-mono">scroll →</p>
              <Wave className="text-foreground/20 w-24 h-3 mt-2" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center overflow-hidden">
          <motion.div
            ref={innerRef}
            style={{ x, paddingLeft: pad, paddingRight: pad }}
            className="flex"
          >
            {features.map((f, i) => (
              <FeatureCard key={f.title} feature={f} index={i} />
            ))}
          </motion.div>
        </div>

        <div className="px-12 pb-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {features.map((_, i) => (
              <Pill key={i} index={i} progress={scrollYProgress} total={features.length} />
            ))}
          </div>
          <p className="text-[10px] tracking-[2px] uppercase text-foreground/35 font-mono">
            <span className="text-foreground/70">06</span> / 06 — features
          </p>
        </div>
      </div>
    </section>
  );
}

function MobileStack() {
  return (
    <section className="md:hidden px-6 py-20 space-y-8">
      <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono">§02 — Capabilities</p>
      <h2 className="text-[clamp(36px,9vw,48px)] font-light tracking-tight text-foreground leading-[1] mb-8">
        Built for the <em className="not-italic font-serif text-foreground/80">cold</em> side of crypto.
      </h2>
      {features.map((f, i) => (
        <div key={`m-${f.title}`}>
          <FeatureCard feature={f} index={i} mobile />
        </div>
      ))}
    </section>
  );
}

function FeatureCard({
  feature,
  index,
  mobile = false,
}: {
  feature: Feature;
  index: number;
  mobile?: boolean;
}) {
  const num = `0${index + 1}`.slice(-2);
  return (
    <div
      className={
        mobile
          ? "relative w-full rounded-[28px] border border-foreground/10 bg-foreground/2 p-7"
          : "relative shrink-0 h-[68vh] rounded-[32px] border border-foreground/8 bg-gradient-to-b from-white/[0.03] to-white/[0.005]"
      }
      style={
        mobile
          ? undefined
          : {
              width: `${CARD_VW}vw`,
              marginRight: `${GAP_PX}px`,
              transform: `rotate(${feature.tilt}deg)`,
            }
      }
    >
      <div className="absolute -top-32 -right-20 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: feature.accent }} />
      <div
        aria-hidden
        className="absolute inset-0 rounded-[32px] pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 60% at 0% 0%, rgba(243,228,209,0.04) 0%, transparent 55%)",
        }}
      />

      <div className={mobile ? "relative" : "relative h-full p-10 lg:p-14 flex flex-col"}>
        <div className="flex items-start justify-between">
          <span
            className="font-serif text-foreground/30 leading-none select-none"
            style={{ fontSize: mobile ? "72px" : "clamp(72px, 9vw, 132px)" }}
          >
            {num}
          </span>
          <div className="text-right pt-3">
            <p className="text-[10px] tracking-[2px] uppercase text-foreground/40 font-mono">
              {feature.short}
            </p>
            <Wave className="ml-auto mt-2 text-foreground/20 w-16 h-2.5" />
          </div>
        </div>

        <div
          className={
            mobile
              ? "my-6 flex justify-start"
              : "flex-1 flex items-center justify-end"
          }
        >
          <div
            className={mobile ? "relative w-40 h-40" : "relative w-56 h-56 lg:w-72 lg:h-72"}
            style={!mobile ? { transform: `rotate(${-feature.tilt * 0.8}deg)` } : undefined}
          >
            <Image src={feature.icon} alt={feature.title} fill className="object-contain" />
          </div>
        </div>

        <div className={mobile ? "" : "max-w-[26ch]"}>
          <h3 className="text-[clamp(22px,2.4vw,32px)] font-light tracking-tight text-foreground leading-[1.1] mb-3">
            {feature.title}
          </h3>
          <Wave className="text-foreground/15 w-20 h-2 mb-4" />
          <p className="text-[14px] text-foreground/55 leading-relaxed max-w-md">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function Pill({
  index,
  progress,
  total,
}: {
  index: number;
  progress: MotionValue<number>;
  total: number;
}) {
  const seg = 1 / total;
  const start = Math.max(0, seg * index);
  const mid = Math.max(start, seg * index + 0.001);
  const end = Math.max(mid, seg * (index + 1));
  const w = useTransform(progress, [start, end], [10, 32]);
  const opacity = useTransform(progress, [start, mid, end], [0.35, 1, 0.35]);
  return <motion.span style={{ width: w, opacity }} className="h-[2px] rounded-full bg-white" />;
}
