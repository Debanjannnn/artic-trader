"use client";

import { useRef, Children, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function HorizontalSection({ children }: { children: ReactNode }) {
  const count = Children.count(children);
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", `-${((count - 1) / count) * 100}%`]);

  return (
    <>
      {/* Desktop: vertical scroll-jacked horizontal pan with snap stops */}
      <section ref={ref} className="relative hidden md:block">
        {/* Relative snap-target markers drive section height to count*100vh
            and provide one snap stop per horizontal panel boundary. */}
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            aria-hidden
            className="h-screen w-full snap-start snap-always"
          />
        ))}

        {/* Sticky panel viewer overlays the markers, pinned to viewport top
            while section is in view. */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="sticky top-0 h-screen w-full overflow-hidden bg-background pointer-events-auto">
            <motion.div
              style={{ x, width: `${count * 100}vw` }}
              className="flex h-full"
            >
              {Children.map(children, (child, i) => (
                <div
                  key={i}
                  className="h-screen flex items-center justify-center overflow-hidden"
                  style={{ width: "100vw", flexShrink: 0 }}
                >
                  <div className="w-full h-full">{child}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile fallback: stack vertical */}
      <div className="md:hidden">
        {Children.map(children, (child, i) => (
          <div key={i} className="min-h-screen flex items-center justify-center snap-start snap-always">
            <div className="w-full">{child}</div>
          </div>
        ))}
      </div>
    </>
  );
}
