"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

const features = [
  {
    title: "LLM strategy engine",
    tag: "Strategy",
    description:
      "Your chosen LLM picks the optimal strategy every interval. Planner and supervisor can be different models.",
    icon: "/assets/fox-robot-agent.png",
    accent: "#6FCAA0",
    pills: ["GPT-4o", "Claude 4.7", "Gemini 2.5"],
  },
  {
    title: "Multi-agent orchestration",
    tag: "Agents",
    description:
      "One isolated process per symbol. Each with its own config, position, and LLM context.",
    icon: "/assets/landing/icons/paw-pack.svg",
    accent: "#F3E4D1",
    pills: ["Per-symbol", "Isolated VM", "Parallel"],
  },
  {
    title: "30+ quant strategies",
    tag: "Algorithms",
    description:
      "Momentum, mean-rev, stat-arb, vol, smart-money, RWA — all proven on live markets.",
    icon: "/assets/landing/icons/glacier-chart.svg",
    accent: "#8FB1E8",
    pills: ["Momentum", "Mean-rev", "Stat-arb"],
  },
  {
    title: "Risk-first architecture",
    tag: "Safety",
    description:
      "Per-agent drawdown caps and kill switches. Hub authority — no agent exceeds its mandate.",
    icon: "/assets/landing/icons/ice-shield.svg",
    accent: "#B3C9EE",
    pills: ["Kill switch", "Drawdown cap", "Hub auth"],
  },
  {
    title: "Multi-market support",
    tag: "Markets",
    description:
      "HashKey Global, Pyth price feeds, and on-chain audit — all from one hub.",
    icon: "/assets/landing/icons/frozen-globe.svg",
    accent: "#6FCAA0",
    pills: ["Spot", "Perps", "On-chain"],
  },
  {
    title: "Real-time monitoring",
    tag: "Observability",
    description:
      "Every fill, every LLM verdict, every supervisor decision — streamed live.",
    icon: "/assets/landing/icons/aurora-pulse.svg",
    accent: "#F0C561",
    pills: ["Live PnL", "LLM logs", "Decisions"],
  },
];

const COL_TPLS = ["2fr 0.75fr 0.75fr", "0.75fr 2fr 0.75fr", "0.75fr 0.75fr 2fr"];
const ROW_TPLS = ["2fr 0.75fr", "0.75fr 2fr"];
const BASE_COLS = "1fr 1fr 1fr";
const BASE_ROWS = "1fr 1fr";

export type BentoTheme = {
  cardBg: string;
  borderIdle: string;
  borderActive: string;
  borderWidth: number;
  borderRadius: number;
  accentOpacityIdle: number;
  accentOpacityActive: number;
  accentGradient: string;
  iconSize: number;
  titleSizeIdle: number;
  titleSizeActive: number;
  titleColor: string;
  descColor: string;
  cardGap: number;
  cardHeight: number;
  pillBg: string;
  pillBorder: string;
  pillColor: string;
  cardPaddingX: number;
  cardPaddingY: number;
  // Image / icon controls
  iconShowIdle: boolean;
  iconOpacityIdle: number;
  iconOpacityActive: number;
  iconScaleIdle: number;
  iconScaleActive: number;
  iconRightOffset: number;
  iconTranslateIdleX: number;
  iconTranslateActiveX: number;
  iconRotateIdle: number;
  iconRotateActive: number;
  iconBlurIdle: number;
  iconBlurActive: number;
  iconBrightness: number;
  iconSaturate: number;
  iconHueRotate: number;
  iconDropShadow: string;
  iconMixBlendMode: string;
};

export const DEFAULT_BENTO_THEME: BentoTheme = {
  cardBg: "#0E141A",
  borderIdle: "rgba(150,150,200,0.10)",
  borderActive: "rgba(150,150,200,0.30)",
  borderWidth: 1.5,
  borderRadius: 15,
  accentOpacityIdle: 0.3,
  accentOpacityActive: 0.14,
  accentGradient: "radial-gradient(70% 80% at 90% 10%, {accent}, transparent)",
  iconSize: 124,
  titleSizeIdle: 24,
  titleSizeActive: 40,
  titleColor: "rgba(242,240,235,1)",
  descColor: "rgba(242,240,235,0.5)",
  cardGap: 10,
  cardHeight: 490,
  pillBg: "transparent",
  pillBorder: "rgba(255,255,255,0.15)",
  pillColor: "rgba(255,255,255,0.55)",
  cardPaddingX: 1.4,
  cardPaddingY: 1.25,
  iconShowIdle: false,
  iconOpacityIdle: 0,
  iconOpacityActive: 1,
  iconScaleIdle: 0.6,
  iconScaleActive: 1,
  iconRightOffset: 1.25,
  iconTranslateIdleX: 16,
  iconTranslateActiveX: 0,
  iconRotateIdle: 0,
  iconRotateActive: 0,
  iconBlurIdle: 0,
  iconBlurActive: 0,
  iconBrightness: 1,
  iconSaturate: 1,
  iconHueRotate: 0,
  iconDropShadow: "none",
  iconMixBlendMode: "normal",
};

export function FeaturesBento({ theme: t = DEFAULT_BENTO_THEME }: { theme?: BentoTheme } = {}) {
  const [active, setActive] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  function setGrid(col: number | null, row: number | null) {
    const el = gridRef.current;
    if (!el) return;
    el.style.gridTemplateColumns = col !== null ? COL_TPLS[col] : BASE_COLS;
    el.style.gridTemplateRows    = row !== null ? ROW_TPLS[row] : BASE_ROWS;
  }

  function enter(i: number) {
    if (timer.current) clearTimeout(timer.current);
    setActive(i);
    setGrid(i % 3, Math.floor(i / 3));
  }

  function leave() {
    timer.current = setTimeout(() => {
      setActive(null);
      setGrid(null, null);
    }, 80);
  }

  return (
    <section className="px-6 md:px-12 py-24 md:py-36 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-3">
          Capabilities
        </p>
        <h2 className="text-[clamp(36px,5vw,64px)] font-light tracking-tight text-foreground leading-[0.95]">
          Everything your pack needs.
        </h2>
      </motion.div>

      <div
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: BASE_COLS,
          gridTemplateRows: BASE_ROWS,
          gap: `${t.cardGap}px`,
          height: `${t.cardHeight}px`,
          transition:
            "grid-template-columns 0.55s cubic-bezier(0.4,0,0.2,1), grid-template-rows 0.55s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {features.map((f, i) => (
          <BentoCell
            key={f.title}
            feature={f}
            isActive={active === i}
            onEnter={() => enter(i)}
            onLeave={leave}
            theme={t}
          />
        ))}
      </div>
    </section>
  );
}

function BentoCell({
  feature: f,
  isActive,
  onEnter,
  onLeave,
  theme: t,
}: {
  feature: (typeof features)[0];
  isActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
  theme: BentoTheme;
}) {
  const accentBg = t.accentGradient.replace(/\{accent\}/g, f.accent);
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        borderRadius: `${t.borderRadius}px`,
        border: `${t.borderWidth}px solid ${isActive ? t.borderActive : t.borderIdle}`,
        background: t.cardBg,
        overflow: "hidden",
        cursor: "default",
        position: "relative",
        transition: "border-color 0.3s ease",
      }}
    >
      {/* accent bg */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: accentBg,
          opacity: isActive ? t.accentOpacityActive : t.accentOpacityIdle,
          transition: "opacity 0.4s ease",
        }}
      />

      {/* content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: `${t.cardPaddingY}rem ${t.cardPaddingX}rem`,
          paddingRight: isActive ? `calc(${t.iconSize}px + 2.25rem)` : `${t.cardPaddingX}rem`,
          paddingLeft: `${t.cardPaddingX}rem`,
          height: "100%",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          transition: "padding-right 0.55s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* top row: tag */}
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "10px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "3px 9px",
              borderRadius: "20px",
              background: `${f.accent}1a`,
              color: f.accent,
              border: `0.5px solid ${f.accent}33`,
              fontFamily: "var(--font-mono, monospace)",
              whiteSpace: "nowrap",
            }}
          >
            {f.tag}
          </span>
        </div>

        {/* title */}
        <p
          style={{
            fontSize: `${isActive ? t.titleSizeActive : t.titleSizeIdle}px`,
            fontWeight: 300,
            color: t.titleColor,
            margin: "0 0 6px",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            transition: "font-size 0.55s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {f.title}
        </p>

        {/* description */}
        <p
          style={{
            fontSize: "13px",
            color: t.descColor,
            lineHeight: 1.6,
            margin: 0,
            opacity: isActive ? 1 : 0,
            maxHeight: isActive ? "120px" : "0px",
            overflow: "hidden",
            transition: "opacity 0.35s ease 0.12s, max-height 0.5s cubic-bezier(0.4,0,0.2,1) 0.05s",
          }}
        >
          {f.description}
        </p>

        {/* pills */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            marginTop: "auto",
            paddingTop: "10px",
            opacity: isActive ? 1 : 0,
            maxHeight: isActive ? "60px" : "0px",
            overflow: "hidden",
            transition: "opacity 0.3s ease 0.2s, max-height 0.5s cubic-bezier(0.4,0,0.2,1) 0.05s",
          }}
        >
          {f.pills.map((p) => (
            <span
              key={p}
              style={{
                fontSize: "11px",
                padding: "3px 10px",
                borderRadius: "20px",
                border: `0.5px solid ${t.pillBorder}`,
                background: t.pillBg,
                color: t.pillColor,
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* hover icon — appears on right when active */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          right: `${t.iconRightOffset}rem`,
          top: "50%",
          width: t.iconSize,
          height: t.iconSize,
          transform: `translateY(-50%) translateX(${
            isActive ? t.iconTranslateActiveX : t.iconTranslateIdleX
          }px) scale(${isActive ? t.iconScaleActive : t.iconScaleIdle}) rotate(${
            isActive ? t.iconRotateActive : t.iconRotateIdle
          }deg)`,
          opacity: isActive ? t.iconOpacityActive : t.iconShowIdle ? t.iconOpacityIdle : 0,
          filter: `blur(${isActive ? t.iconBlurActive : t.iconBlurIdle}px) brightness(${
            t.iconBrightness
          }) saturate(${t.iconSaturate}) hue-rotate(${t.iconHueRotate}deg)${
            t.iconDropShadow !== "none" ? ` drop-shadow(${t.iconDropShadow})` : ""
          }`,
          mixBlendMode: t.iconMixBlendMode as React.CSSProperties["mixBlendMode"],
          transition:
            "opacity 0.35s ease 0.08s, transform 0.55s cubic-bezier(0.4,0,0.2,1), filter 0.4s ease",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <Image src={f.icon} alt="" fill className="object-contain" />
      </div>
    </div>
  );
}
