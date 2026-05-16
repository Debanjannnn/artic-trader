"use client";

import { motion } from "framer-motion";

const stats = [
  { num: "30+", label: "quant strategies", note: "momentum · mean-rev · stat-arb" },
  { num: "04", label: "LLM providers", note: "openai · anthropic · gemini · deepseek" },
  { num: "01", label: "audit chain", note: "every decision logged on-chain" },
  { num: "∞", label: "agents per account", note: "isolated per symbol, parallel" },
];

export function StatStrip() {
  return (
    <section className="relative px-6 md:px-12 py-28 md:py-36 max-w-7xl mx-auto">
      <div className="flex items-end justify-between mb-12">
        <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono">
          §01 — In numbers
        </p>
        <div className="hidden md:block h-px flex-1 mx-6 bg-foreground/10" />
        <p className="text-[10px] tracking-[2px] uppercase text-foreground/35 font-mono">
          live · paper · supervised
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-16">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
            className="relative"
          >
            <div
              className="font-serif font-light text-foreground leading-[0.85]"
              style={{ fontSize: "clamp(72px, 9vw, 148px)" }}
            >
              {s.num}
            </div>
            <div className="mt-4">
              <p className="text-[13px] tracking-tight text-foreground/85 mb-1">{s.label}</p>
              <p className="text-[11px] tracking-[1.2px] uppercase text-foreground/35 font-mono">
                {s.note}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
