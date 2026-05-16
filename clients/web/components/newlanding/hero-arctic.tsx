"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SnowOverlay } from "./snow-overlay";

const Fox3D = dynamic(
  () => import("./fox-3d").then((m) => m.Fox3D),
  { ssr: false }
);

export function HeroArctic() {
  return (
    <section className="relative h-screen flex items-center overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-0 z-0 pointer-events-none opacity-70"
        style={{
          background:
            "radial-gradient(80% 60% at 80% 40%, rgba(143,177,232,0.18) 0%, transparent 60%), radial-gradient(60% 50% at 20% 80%, rgba(111,202,160,0.12) 0%, transparent 65%)",
        }}
      />
      <div className="absolute inset-y-0 right-0 w-[60%] z-0 pointer-events-none">
        <Fox3D />
      </div>
      {/* <SnowOverlay density={110} /> */}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="relative z-10 w-full max-w-7xl mx-auto"
      >
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-foreground/15 bg-foreground/5 backdrop-blur-sm text-xs text-foreground/80 mb-7">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-light animate-pulse" />
            Built on 0G · TEE-sealed inference · early access
          </div>

          <h1 className="text-[clamp(40px,7vw,80px)] font-bold tracking-[-2px] leading-[1.05] text-foreground mb-6">
            AI agents that trade.
            <br />
            <span className="text-foreground/60">On-chain by design.</span>
          </h1>

          <p className="text-xl text-foreground/70 max-w-xl leading-relaxed mb-10">
            Artic spawns isolated agents per symbol on dedicated VMs, lets a
            TEE-sealed LLM (0G Compute) pick from 30+ quant strategies, and
            logs every decision + trade to 0G Chain with reasoning on 0G Storage.
          </p>

          <div className="flex gap-3 items-center flex-wrap">
            <Link
              href="/connect"
              className={cn(
                buttonVariants(),
                "rounded-2xl text-foreground border border-cta-border bg-linear-to-b from-cta-light! to-cta! hover:from-cta! hover:to-cta-hover! px-7 py-6 text-[15px] font-medium transition-all hover:-translate-y-0.5"
              )}
            >
              Launch app
            </Link>
            <Link
              href="/docs"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "border-foreground/20 text-foreground bg-foreground/5 backdrop-blur-sm hover:bg-foreground/10 hover:border-foreground/30 rounded-[10px] px-7 py-6 text-[15px] font-medium"
              )}
            >
              Read the docs
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
