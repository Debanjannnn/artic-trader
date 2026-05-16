"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function IcePattern() {
  return (
    <svg
      width="100%"
      height="100%"
      className="absolute inset-0 w-full h-full"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="ice-diag" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <line x1="0" y1="32" x2="32" y2="0" stroke="white" strokeWidth="0.5" strokeOpacity="0.18" />
          <line x1="-8" y1="32" x2="24" y2="0" stroke="white" strokeWidth="0.5" strokeOpacity="0.08" />
          <line x1="8" y1="32" x2="40" y2="0" stroke="white" strokeWidth="0.5" strokeOpacity="0.08" />
        </pattern>
        <radialGradient id="ice-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#6FCAA0" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#0A0E12" stopOpacity="0.6" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#ice-diag)" />
      <rect width="100%" height="100%" fill="url(#ice-vignette)" />
    </svg>
  );
}

function Lanyard() {
  return (
    <div className="flex flex-col items-center" aria-hidden>
      {/* two cord strands */}
      <svg width="28" height="56" viewBox="0 0 28 56" fill="none">
        <path
          d="M 8 0 Q 6 20 10 36 Q 12 46 14 56"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.25"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 20 0 Q 22 20 18 36 Q 16 46 14 56"
          stroke="white"
          strokeWidth="1.5"
          strokeOpacity="0.25"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      {/* clip ring */}
      <div className="w-5 h-3 rounded-t-full border border-foreground/30 bg-foreground/10 -mt-0.5" />
    </div>
  );
}

interface BadgeCardProps {
  email: string;
  issued: boolean;
}

function BadgeCard({ issued }: BadgeCardProps) {
  return (
    <div className="relative w-[280px] rounded-2xl overflow-hidden border border-foreground/15 bg-card"
      style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.08) inset" }}
    >
      <IcePattern />

      {/* card content */}
      <div className="relative z-10 p-6 flex flex-col gap-10">
        {/* top: logo + tagline */}
        <div>
          <p className="font-serif text-[22px] font-bold text-foreground tracking-tight leading-none mb-1">
            ARTIC
          </p>
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/40">
            AI trading platform
          </p>
        </div>

        {/* middle: large pattern zone */}
        <div className="h-[120px]" />

        {/* bottom: id + badge */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] font-mono text-foreground/25 uppercase tracking-widest mb-0.5">
              member id
            </p>
            <p className="text-[13px] font-mono text-foreground/60 tabular-nums">
              ARC-{issued ? "CONFIRMED" : "PENDING"}
            </p>
          </div>
          <div className="px-3 py-1 rounded-full border border-[#6FCAA0]/40 bg-[#6FCAA0]/10">
            <p className="text-[10px] font-mono uppercase tracking-[2px] text-[#6FCAA0]">
              {issued ? "approved" : "alpha"}
            </p>
          </div>
        </div>
      </div>

      {/* bottom strip */}
      <div className="relative z-10 px-6 py-3 border-t border-foreground/8 bg-white/[0.03] flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/35">
          early access
        </p>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "err">("idle");

  const cardWrapRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 280, damping: 25 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 280, damping: 25 });

  function onMove(e: React.MouseEvent) {
    const el = cardWrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) { setState("err"); return; }
    setState("ok");
  }

  return (
    <section className="relative px-6 md:px-12 py-28 md:py-36 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

        {/* left — text */}
        <div>
          <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-4">
            §12 — Waitlist
          </p>
          <h2 className="text-[clamp(36px,4.6vw,60px)] font-light tracking-tight text-foreground leading-[0.95] mb-6">
            Join the<br />
            <em className="not-italic font-serif text-foreground/80">alpha cohort.</em>
          </h2>
          <p className="text-[14px] text-foreground/55 leading-relaxed max-w-md mb-10">
            Limited slots per cohort. Approved accounts get live execution, strategy config access, and credit grants.
          </p>

          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-md">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (state !== "idle") setState("idle"); }}
              placeholder="you@protonmail.com"
              className="flex-1 px-5 py-4 rounded-xl border border-foreground/10 bg-white/[0.02] text-foreground placeholder-white/30 font-mono text-[13px] focus:outline-none focus:border-foreground/30 transition-colors"
            />
            <button
              type="submit"
              className="px-7 py-4 rounded-xl bg-white text-[#0A0E12] font-medium text-[14px] tracking-tight hover:bg-foreground/90 transition-colors whitespace-nowrap"
            >
              {state === "ok" ? "On the list ✓" : "Request access"}
            </button>
          </form>

          {state === "err" && (
            <p className="mt-3 text-[12px] font-mono text-[#E85F5F]">enter a valid email</p>
          )}
          {state === "ok" && (
            <p className="mt-3 text-[12px] font-mono text-[#6FCAA0]">sit tight — invites roll out weekly</p>
          )}

          <div className="mt-8 flex items-center gap-6 text-[11px] font-mono text-foreground/30">
            <span>encrypted at rest</span>
            <span className="h-px w-8 bg-foreground/15" />
            <span>no spam · ever</span>
          </div>
        </div>

        {/* right — 3D badge */}
        <div className="flex justify-center">
          <div
            ref={cardWrapRef}
            onMouseMove={onMove}
            onMouseLeave={onLeave}
            style={{ perspective: "900px" }}
            className="cursor-default"
          >
            <motion.div
              style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
              className="flex flex-col items-center"
            >
              <Lanyard />
              <BadgeCard email={email} issued={state === "ok"} />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
