"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const items = [
  {
    q: "Is live trading enabled?",
    a: "Paper trading is the default. Live execution on HashKey Global is rolling out per account in alpha — request access in your settings panel.",
  },
  {
    q: "Who custodies my funds?",
    a: "You. Artic never holds keys. Live execution uses an exchange API key you provision; on-chain logging signs from your own auto-signing session — revocable any time.",
  },
  {
    q: "Where do my LLM keys live?",
    a: "Encrypted at rest in your hub Postgres (AES). Injected ephemerally into agent containers at spawn — never written to disk inside the agent.",
  },
  {
    q: "Can I bring my own strategy?",
    a: "Yes. Strategies are plain Python that emit signals through a stable contract. Drop a file in your strategies repo and the supervisor picks it up.",
  },
  {
    q: "What about slippage and exchange outages?",
    a: "The supervisor halts on max session loss, drift, and stale price data. Each agent enforces its own kill switches independent of the planner.",
  },
  {
    q: "Why an audit chain at all?",
    a: "Reproducibility. Every supervisor verdict, strategy switch, and trade fill emits a signed event to 0G Chain (DecisionLogger + TradeLogger). Full LLM reasoning + trade detail JSON sealed on 0G Storage and bound by hash — replay why an agent did what, three months later.",
  },
  {
    q: "What 0G modules does Artic use?",
    a: "Four. 0G Chain for DecisionLogger / TradeLogger / StrategyINFT events; 0G Compute (TeeML) for sealed LLM inference with provider attestation; 0G Storage for full reasoning + trade JSON; and ERC-7857 INFTs for tradable, encrypted strategy configs.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative px-6 md:px-12 py-28 md:py-36 max-w-5xl mx-auto">
      <p className="text-[10px] tracking-[2.5px] uppercase text-foreground/35 font-mono mb-4">
        §11 — Questions
      </p>
      <h2 className="text-[clamp(36px,4.6vw,60px)] font-light tracking-tight text-foreground leading-[0.95] mb-12 max-w-[18ch]">
        Things people<br />
        <em className="not-italic font-serif text-foreground/80">tend to ask.</em>
      </h2>

      <div className="border-t border-foreground/10">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q} className="border-b border-foreground/10">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-start justify-between gap-6 py-6 text-left group"
              >
                <span className="flex items-baseline gap-5">
                  <span className="text-[10px] font-mono text-foreground/35 tabular-nums pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[18px] md:text-[22px] tracking-tight text-foreground group-hover:text-foreground/85 transition-colors">
                    {it.q}
                  </span>
                </span>
                <span
                  className="font-mono text-2xl text-foreground/40 transition-transform shrink-0"
                  style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0)" }}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 pl-12 pr-12 text-[14px] md:text-[15px] text-foreground/60 leading-relaxed max-w-[60ch]">
                      {it.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
