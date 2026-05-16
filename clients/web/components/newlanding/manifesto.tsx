"use client";

import { motion } from "framer-motion";

const lines = [
  { text: "Markets favor the cold-blooded.", opacity: "text-foreground" },
  { text: "We built tooling that doesn\u2019t flinch,", opacity: "text-foreground/55" },
  { text: "doesn\u2019t panic,", opacity: "text-foreground/40" },
  { text: "and never lies about the loss.", opacity: "text-foreground", italic: true },
];

export function Manifesto() {
  return (
    <section className="relative px-6 md:px-12 py-32 md:py-48 max-w-6xl mx-auto overflow-hidden">
      {/* background decorative quote */}
      <span
        aria-hidden
        className="pointer-events-none select-none absolute -top-8 -left-4 md:left-2 font-serif text-foreground/3 leading-none"
        style={{ fontSize: "clamp(200px, 30vw, 400px)" }}
      >
        &ldquo;
      </span>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-10"
      >
        §10 — Manifesto
      </motion.p>

      <blockquote
        className="font-serif font-light leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(36px, 5.5vw, 84px)" }}
      >
        {lines.map((line, i) => (
          <motion.span
            key={i}
            className={`block ${line.opacity}${line.italic ? " italic" : ""}`}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.65, delay: i * 0.12 }}
          >
            {line.text}
          </motion.span>
        ))}
      </blockquote>

      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.55, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
        className="mt-14 ml-2 flex items-center gap-4"
      >
        <span className="h-px w-16 bg-foreground/30" />
        <p className="text-[11px] font-mono uppercase tracking-[2px] text-foreground/45">
          Artic — the pack ledger
        </p>
      </motion.div>
    </section>
  );
}
