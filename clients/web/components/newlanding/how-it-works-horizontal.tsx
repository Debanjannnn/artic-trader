"use client";

import { useEffect, useRef, useState } from "react";
import type { MotionValue } from "framer-motion";
import { motion, useScroll, useTransform } from "framer-motion";

type Step = {
  title: string;
  label: string;
  description: string;
  glyph: React.ReactNode;
  accent: string;
  tilt: number;
};

const steps: Step[] = [
  {
    title: "Configure your agent.",
    label: "Setup",
    description:
      "Set token pair, market type, LLM provider, risk limits, and any custom strategy overrides. Under two minutes — zero boilerplate.",
    accent: "#8FB1E8",
    tilt: -1.0,
    glyph: (
      <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="#F3E4D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M48 100 Q48 60 100 50 Q156 60 152 100 Q156 142 100 152 Q48 144 48 100 Z" opacity="0.5" strokeDasharray="3 4"/>
        <path d="M68 100 Q68 76 100 72 Q132 76 132 100 Q132 124 100 128 Q68 126 68 100 Z"/>
        <path d="M100 30 L100 50"/>
        <path d="M100 150 L100 170"/>
        <path d="M30 100 L50 100"/>
        <path d="M150 100 L170 100"/>
        <path d="M48 48 L62 62"/>
        <path d="M138 138 L152 152"/>
        <path d="M152 48 L138 62"/>
        <path d="M62 138 L48 152"/>
        <circle cx="100" cy="100" r="6" stroke="#6FCAA0"/>
        <path d="M85 95 Q90 88 100 88"/>
      </svg>
    ),
  },
  {
    title: "Deploy anywhere.",
    label: "Deploy",
    description:
      "Launch the agent locally or push it to a remote VM. The hub tracks heartbeats, persists state, and isolates every agent in its own process.",
    accent: "#6FCAA0",
    tilt: 0.8,
    glyph: (
      <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="#F3E4D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 78 L78 60 L78 140 L28 158 Z"/>
        <path d="M78 60 L128 78 L128 158 L78 140 Z" opacity="0.85"/>
        <path d="M128 78 L172 60 L172 140 L128 158" opacity="0.7"/>
        <path d="M52 95 L52 130" opacity="0.6"/>
        <path d="M62 92 L62 132" opacity="0.6"/>
        <path d="M100 105 L100 142" opacity="0.6"/>
        <path d="M148 100 L148 135" opacity="0.5"/>
        <path d="M50 38 Q100 22 150 38" strokeDasharray="2 4" opacity="0.7"/>
        <circle cx="100" cy="22" r="4" stroke="#6FCAA0"/>
        <path d="M93 22 Q100 12 107 22"/>
      </svg>
    ),
  },
  {
    title: "Monitor & iterate.",
    label: "Observe",
    description:
      "Watch trades stream in real time. Agents auto-rebalance on schedule. Pause, reconfigure, or scale any agent with a single command.",
    accent: "#F0C561",
    tilt: -0.6,
    glyph: (
      <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" stroke="#F3E4D1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M28 56 Q24 40 40 36 L160 36 Q176 40 172 56 L172 144 Q176 160 160 164 L40 164 Q24 160 28 144 Z"/>
        <path d="M40 70 L160 70" opacity="0.4"/>
        <path d="M44 130 L60 110 L78 122 L96 88 L116 100 L138 70 L156 84"/>
        <path d="M44 130 L60 110 L78 122 L96 88" stroke="#6FCAA0"/>
        <path d="M96 88 L116 100 L138 70 L156 84" stroke="#F0C561"/>
        <circle cx="96" cy="88" r="4" stroke="#6FCAA0"/>
        <circle cx="138" cy="70" r="4" stroke="#F0C561"/>
        <path d="M40 100 L52 100 M40 115 L52 115 M40 130 L52 130" opacity="0.3" strokeWidth="1.2"/>
        <path d="M44 144 L48 144 M58 144 L62 144 M72 144 L76 144 M86 144 L90 144" opacity="0.5" strokeWidth="1.2"/>
      </svg>
    ),
  },
];

export function HowItWorksHorizontal() {
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

const STEP_VW = 60;
const GAP_PX = 120;

function DesktopTrack() {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [travel, setTravel] = useState(0);
  const [pad, setPad] = useState(0);

  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      const cardW = (STEP_VW / 100) * vw;
      const innerW = steps.length * cardW + (steps.length - 1) * GAP_PX;
      setPad(Math.max(0, (vw - cardW) / 2));
      setTravel(Math.max(0, innerW - cardW));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);

  return (
    <section
      ref={ref}
      className="relative hidden md:block"
      style={{ height: `${steps.length * 110}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-12 pt-24 pb-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-2">
                §03 — Process
              </p>
              <h2 className="text-[clamp(40px,5vw,64px)] font-light tracking-tight text-foreground leading-[0.95]">
                Configure. Deploy.<br />
                <em className="not-italic font-serif text-foreground/80">Profit.</em>
              </h2>
            </div>
            <div className="hidden lg:block text-right">
              <p className="text-[10px] tracking-[2px] uppercase text-foreground/30 font-mono">scroll →</p>
              <Wave className="text-foreground/20 w-24 h-3 mt-2" />
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center overflow-hidden">
          <motion.div ref={innerRef} style={{ x, paddingLeft: pad, paddingRight: pad }} className="flex">
            {steps.map((s, i) => (
              <StepCard key={s.label} step={s} index={i} />
            ))}
          </motion.div>
        </div>

        <div className="px-12 pb-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <Pill key={i} index={i} progress={scrollYProgress} total={steps.length} />
            ))}
          </div>
          <p className="text-[10px] tracking-[2px] uppercase text-foreground/35 font-mono">03 / 03 — steps</p>
        </div>
      </div>
    </section>
  );
}

function MobileStack() {
  return (
    <section className="md:hidden px-6 py-20 space-y-10">
      <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono">§03 — Process</p>
      <h2 className="text-[clamp(32px,8vw,44px)] font-light tracking-tight text-foreground leading-[1] mb-6">
        Configure. Deploy. <em className="not-italic font-serif text-foreground/80">Profit.</em>
      </h2>
      {steps.map((s, i) => (
        <StepCard key={`m-${s.label}`} step={s} index={i} mobile />
      ))}
    </section>
  );
}

function StepCard({ step, index, mobile = false }: { step: Step; index: number; mobile?: boolean }) {
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
              width: `${STEP_VW}vw`,
              marginRight: `${GAP_PX}px`,
              transform: `rotate(${step.tilt}deg)`,
            }
      }
    >
      <div
        aria-hidden
        className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ background: step.accent }}
      />

      <div className={mobile ? "relative" : "relative h-full p-10 lg:p-14 flex flex-col"}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/40 font-mono mb-2">
              Step / {step.label}
            </p>
            <Wave className="text-foreground/20 w-16 h-2" />
          </div>
          <span
            className="font-serif text-foreground/30 leading-none select-none"
            style={{ fontSize: mobile ? "60px" : "clamp(60px, 7vw, 110px)" }}
          >
            {num}
          </span>
        </div>

        <div className={mobile ? "my-6 flex justify-start" : "flex-1 flex items-center justify-center my-4"}>
          <div className={mobile ? "w-44 h-44" : "w-60 h-60 lg:w-72 lg:h-72"} style={!mobile ? { transform: `rotate(${-step.tilt * 0.6}deg)` } : undefined}>
            {step.glyph}
          </div>
        </div>

        <div className={mobile ? "" : "max-w-[28ch]"}>
          <h3 className="text-[clamp(24px,2.6vw,36px)] font-light tracking-tight text-foreground leading-[1.1] mb-3">
            {step.title}
          </h3>
          <Wave className="text-foreground/15 w-24 h-2 mb-4" />
          <p className="text-[14px] text-foreground/55 leading-relaxed max-w-md">{step.description}</p>
        </div>
      </div>
    </div>
  );
}

function Pill({ index, progress, total }: { index: number; progress: MotionValue<number>; total: number }) {
  const seg = 1 / total;
  const start = Math.max(0, seg * index);
  const mid = Math.max(start, seg * index + 0.001);
  const end = Math.max(mid, seg * (index + 1));
  const w = useTransform(progress, [start, end], [10, 32]);
  const opacity = useTransform(progress, [start, mid, end], [0.35, 1, 0.35]);
  return <motion.span style={{ width: w, opacity }} className="h-[2px] rounded-full bg-white" />;
}
