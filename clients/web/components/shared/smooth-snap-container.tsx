"use client";

import { useRef, useEffect, useCallback, type ReactNode } from "react";

const DURATION = 950;

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function SmoothSnapContainer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const idx = useRef(0);
  const busy = useRef(false);

  const go = useCallback((next: number) => {
    const el = ref.current;
    if (!el || busy.current) return;
    const sections = Array.from(el.children) as HTMLElement[];
    const clamped = Math.max(0, Math.min(next, sections.length - 1));
    const from = el.scrollTop;
    const to = sections[clamped]?.offsetTop ?? 0;
    if (Math.abs(from - to) < 2) return;

    busy.current = true;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / DURATION, 1);
      el.scrollTop = from + (to - from) * ease(p);
      if (p < 1) requestAnimationFrame(tick);
      else { idx.current = clamped; busy.current = false; }
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let touchY = 0;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!busy.current) go(e.deltaY > 0 ? idx.current + 1 : idx.current - 1);
    };
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchY - e.changedTouches[0].clientY;
      if (!busy.current && Math.abs(delta) > 40)
        go(delta > 0 ? idx.current + 1 : idx.current - 1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") { e.preventDefault(); go(idx.current + 1); }
      else if (e.key === "ArrowUp" || e.key === "PageUp") { e.preventDefault(); go(idx.current - 1); }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [go]);

  return (
    <main ref={ref} className="h-screen overflow-y-hidden">
      {children}
    </main>
  );
}
