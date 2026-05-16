"use client";

import { useEffect, useRef, useState } from "react";

const steps = [
  {
    number: "I",
    title: "Configure your agent.",
    description:
      "Set token pair, LLM provider, risk limits, leverage, and strategy overrides. Under two minutes — zero boilerplate.",
    code: `{
  "name": "snowdrift",
  "symbol": "BTC/USDT",
  "llm": "claude-opus-4-7",
  "leverage": 3,
  "risk_profile": "balanced",
  "tp_pct": 4.5,
  "sl_pct": 2.0,
  "auto_start": true
}`,
  },
  {
    number: "II",
    title: "Deploy anywhere.",
    description:
      "Launch locally or push to a remote VM. The hub tracks heartbeats, persists state, and isolates every agent in its own process.",
    code: `POST /agents
→ 201 Created

{
  "id": "agt_8xKp2mNq",
  "name": "snowdrift",
  "status": "starting",
  "symbol": "BTC/USDT",
  "vm": "morph-vm-04"
}

# Hub spawned container
# Heartbeat: ✓ alive`,
  },
  {
    number: "III",
    title: "Monitor & profit.",
    description:
      "Watch trades stream in real time. Agents auto-rebalance on the supervisor interval. Pause, reconfigure, or scale with one command.",
    code: `[14:22:01] [TICK]   BTC/USDT 97,420.00
[14:22:01] [TEE]    0G Compute → momentum-v3
[14:22:02] [ACTION] open long 0.12 BTC
[14:22:03] [TRADE]  filled @ 97,418.50
[14:22:03] [0G:ST]  reasoning cid 0xbafy…7p
[14:22:03] [0G:CH]  TradeLogged 0x9f3ae…d1a2 ✓
[14:22:03] [PNL]    unrealised +0.24%
[14:23:01] [SUPER]  approve · hold`,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-background text-foreground overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        {/* <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 40px, currentColor 40px, currentColor 41px)`,
          }}
        /> */}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="mb-16 lg:mb-24">
          <span className="inline-flex items-center gap-3 text-sm font-mono text-foreground/50 mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            How it works
          </span>
          <h2
            className={`text-4xl lg:text-6xl font-light tracking-tight transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Three steps.
            <br />
            <em className="not-italic font-serif text-foreground/50">Infinite pack potential.</em>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          <div className="space-y-0">
            {steps.map((step, index) => (
              <button
                key={step.number}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`w-full text-left py-8 border-b border-foreground/10 transition-all duration-500 group ${
                  activeStep === index ? "opacity-100" : "opacity-35 hover:opacity-65"
                }`}
              >
                <div className="flex items-start gap-6">
                  <span className="font-serif text-3xl text-foreground/30 pt-0.5 w-8 shrink-0">
                    {step.number}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-2xl lg:text-3xl font-light tracking-tight mb-3 group-hover:translate-x-1 transition-transform duration-300">
                      {step.title}
                    </h3>
                    <p className="text-foreground/60 leading-relaxed text-[15px]">
                      {step.description}
                    </p>
                    {activeStep === index && (
                      <div className="mt-4 h-px bg-foreground/15 overflow-hidden">
                        <div
                          className="h-full bg-background"
                          style={{ animation: "hiw-progress 5s linear forwards" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:sticky lg:top-32 self-start">
            <div className="border border-foreground/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-foreground/10 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-foreground/20" />
                  <div className="w-3 h-3 rounded-full bg-foreground/20" />
                  <div className="w-3 h-3 rounded-full bg-foreground/20" />
                </div>
                <span className="text-[11px] font-mono text-foreground/35">
                  {activeStep === 0 ? "agent.config.json" : activeStep === 1 ? "hub · spawn" : "artic · live tape"}
                </span>
              </div>

              <div className="p-7 font-mono text-[13px] min-h-[260px]">
                <pre className="text-foreground/65 leading-loose">
                  {steps[activeStep].code.split("\n").map((line, li) => (
                    <div key={`${activeStep}-${li}`} className="code-line-reveal" style={{ animationDelay: `${li * 60}ms` }}>
                      <span className="text-foreground/20 select-none w-6 inline-block tabular-nums text-right mr-4">{li + 1}</span>
                      <span className="inline-flex flex-wrap">
                        {line.split("").map((char, ci) => (
                          <span
                            key={`${activeStep}-${li}-${ci}`}
                            className="code-char-reveal"
                            style={{ animationDelay: `${li * 60 + ci * 10}ms` }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </span>
                        ))}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>

              <div className="px-5 py-3 border-t border-foreground/10 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                <span className="text-[11px] font-mono text-foreground/40">
                  {activeStep === 0 ? "valid · ready to spawn" : activeStep === 1 ? "agent alive · heartbeat ✓" : "streaming · on-chain ✓"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes hiw-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .code-line-reveal {
          opacity: 0;
          transform: translateX(-8px);
          animation: lineReveal 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes lineReveal {
          to { opacity: 1; transform: translateX(0); }
        }
        .code-char-reveal {
          opacity: 0;
          filter: blur(6px);
          animation: charReveal 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes charReveal {
          to { opacity: 1; filter: blur(0); }
        }
      `}</style>
    </section>
  );
}
