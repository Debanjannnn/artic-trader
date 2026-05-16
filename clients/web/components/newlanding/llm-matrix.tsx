"use client";

import { motion } from "framer-motion";

const OpenAIGlyph = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <circle cx="20" cy="20" r="14" />
    <circle cx="20" cy="20" r="6" />
    <line x1="20" y1="6" x2="20" y2="14" />
    <line x1="20" y1="26" x2="20" y2="34" />
    <line x1="6" y1="20" x2="14" y2="20" />
    <line x1="26" y1="20" x2="34" y2="20" />
  </svg>
);

const AnthropicGlyph = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 8 L34 32 H6 Z" />
    <path d="M20 18 L26 30 H14 Z" fill="currentColor" fillOpacity="0.25" stroke="none" />
  </svg>
);

const GoogleGlyph = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <path d="M33 20 A13 13 0 1 0 20 33" />
    <path d="M22 20 H33" />
    <line x1="33" y1="17" x2="33" y2="23" />
  </svg>
);

const DeepSeekGlyph = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
    <circle cx="15" cy="20" r="9" />
    <circle cx="25" cy="20" r="9" />
    <path d="M28 14 L34 8 M28 26 L34 32" strokeOpacity="0.5" />
  </svg>
);

const ZeroGGlyph = () => (
  <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="20" cy="20" r="13" />
    <path d="M13 20 L20 27 L27 13" />
    <circle cx="20" cy="20" r="3" fill="currentColor" stroke="none" />
  </svg>
);

const providers = [
  { name: "0G Compute (TeeML)", model: "TEE-sealed · default", Glyph: ZeroGGlyph },
  { name: "OpenAI", model: "gpt-4o · o1 · o3", Glyph: OpenAIGlyph },
  { name: "Anthropic", model: "claude 4.7 opus · sonnet", Glyph: AnthropicGlyph },
  { name: "Google", model: "gemini 2.5 · flash", Glyph: GoogleGlyph },
  { name: "DeepSeek", model: "v3 · r1", Glyph: DeepSeekGlyph },
];

export function LlmMatrix() {
  return (
    <section className="relative px-6 md:px-12 py-24 md:py-32 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div>
          <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-3">
            §06 — LLM providers
          </p>
          <h2 className="text-[clamp(28px,3.6vw,44px)] font-light tracking-tight text-foreground leading-none max-w-[22ch]">
            Bring your own key.<br />
            <em className="not-italic font-serif text-foreground/70">Swap models any time.</em>
          </h2>
        </div>
        <p className="text-[12px] text-foreground/50 max-w-sm leading-relaxed">
          Default routes through 0G Compute TeeML — sealed inference with provider signature. Or bring your own key; supervisor + planner can be different models.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 border-t border-l border-foreground/10">
        {providers.map(({ name, model, Glyph }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="relative px-6 md:px-10 py-10 md:py-14 border-r border-b border-foreground/10 group hover:bg-foreground/2 transition-colors"
          >
            <span className="absolute top-3 right-4 text-[10px] font-mono text-foreground/20 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="text-foreground/25 mb-6 group-hover:text-foreground/55 transition-colors">
              <Glyph />
            </div>
            <p className="text-[16px] tracking-tight text-foreground mb-1">{name}</p>
            <p className="text-[11px] font-mono text-foreground/40 tracking-wide">{model}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
