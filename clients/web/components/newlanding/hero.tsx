"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-end justify-center text-right pr-20 md:pr-32 py-40 overflow-hidden">
      {/* Gradient background */}
      {/* <div
        className="absolute inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 50% 0%, rgba(218,119,86,0.25) 0%, transparent 70%),
            radial-gradient(ellipse 40% 30% at 20% 80%, rgba(29,158,117,0.12) 0%, transparent 60%),
            #0a0a0f
          `,
        }}
      /> */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/heroVideo.mp4" type="video/mp4" />
      </video>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }} 
        className="z-10 flex flex-col items-end justify-center text-right max-w-5xl"
      >
        {/* Badge */}
        <div className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-foreground/50 bg-background/40 backdrop-blur-md text-xs text-foreground my-7">
          <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
          Now in early access
        </div>
        {/* Heading */}
        <h1 className="relative z-10 text-[clamp(48px,8vw,96px)] font-bold tracking-[-2px] leading-[1.02] mb-6">
          <span className="block bg-linear-to-br from-white via-accent-warm to-blue-accent bg-clip-text text-transparent">
            AI agents that trade.
          </span>
          <span className="block bg-linear-to-br from-blue-accent via-accent-warm to-white bg-clip-text text-transparent">
            On-chain by design.
          </span>
        </h1>
        {/* Subtitle */}
        <p className="relative z-10 text-lg md:text-xl text-foreground/85 max-w-4xl leading-relaxed mb-10 ml-auto">
          Artic spawns isolated agents per symbol on dedicated VMs, lets your
          LLM pick from 30+ quant strategies, and writes every decision to an
          immutable on-chain audit log.
        </p>
        {/* Actions */}
        <div className="relative z-10 flex gap-3 items-center flex-wrap justify-end">
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
              "border-cta-hover! text-cta-hover bg-white! hover:border-cta-hover/50 hover:text-cta-hover/50 rounded-[10px] px-7 py-6 text-[15px] font-medium"
            )}
          >
            Read the docs
          </Link>
        </div>
      </motion.div>

      {/* <TerminalMockup /> */}
    </section>
  );
}
