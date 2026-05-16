"use client";

import { useRef, useEffect, useCallback, useState, Children, type ReactNode } from "react";
import { gsap } from "gsap";

const DURATION = 0.85;
const EASE = "power3.out";
const WHEEL_THRESHOLD = 30;       // min |deltaY| to count
const MULTI_STEP_THRESHOLD = 120; // per-unit deltaY for extra steps
const TOUCH_THRESHOLD = 40;
const TOUCH_MULTI = 220;

type Props = {
  top: ReactNode;
  middle: ReactNode;
  bottom: ReactNode;
};

export function LandingSnapContainer({ top, middle, bottom }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const xRef = useRef<HTMLDivElement>(null);
  const idxRef = useRef(0);

  const topArr = Children.toArray(top);
  const midArr = Children.toArray(middle);
  const botArr = Children.toArray(bottom);

  const topCount = topArr.length;
  const midCount = midArr.length;
  const botCount = botArr.length;
  const total = topCount + midCount + botCount;

  const [vh, setVh] = useState(0);

  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const computeTargets = useCallback(
    (step: number) => {
      const h = vh || (typeof window !== "undefined" ? window.innerHeight : 0);
      let scrollTop = 0;
      let xPct = 0;

      if (step < topCount) {
        scrollTop = step * h;
        xPct = 0;
      } else if (step < topCount + midCount) {
        scrollTop = topCount * h;
        xPct = -(step - topCount) * 100;
      } else {
        const botIdx = step - topCount - midCount;
        scrollTop = (topCount + 1 + botIdx) * h;
        xPct = -(midCount - 1) * 100;
      }
      return { scrollTop, xPct };
    },
    [topCount, midCount, vh]
  );

  const go = useCallback(
    (next: number) => {
      const cur = idxRef.current;
      let clamped = Math.max(0, Math.min(next, total - 1));

      // Restrict crossings through middle (horizontal panels): one step at
      // a time within middle, and never skip past middle in a single event.
      const midStart = topCount;
      const midEnd = topCount + midCount - 1;
      if (clamped > cur) {
        if (cur >= midStart && cur <= midEnd) {
          clamped = Math.min(clamped, cur + 1);
        } else if (cur < midStart && clamped > midStart) {
          clamped = midStart;
        }
      } else if (clamped < cur) {
        if (cur >= midStart && cur <= midEnd) {
          clamped = Math.max(clamped, cur - 1);
        } else if (cur > midEnd && clamped < midEnd) {
          clamped = midEnd;
        }
      }

      if (clamped === cur) return;

      const scrollEl = scrollRef.current;
      const xEl = xRef.current;
      if (!scrollEl || !xEl) return;

      idxRef.current = clamped;

      const { scrollTop: rawScroll, xPct } = computeTargets(clamped);
      const isLastStep = clamped === total - 1 && botCount > 0;
      const toScroll = isLastStep
        ? Math.max(0, scrollEl.scrollHeight - window.innerHeight)
        : rawScroll;
      const toX = (xPct / 100) * window.innerWidth;

      // GSAP handles overwrite — fast successive calls retarget smoothly
      gsap.to(scrollEl, {
        scrollTop: toScroll,
        duration: DURATION,
        ease: EASE,
        overwrite: true,
      });
      gsap.to(xEl, {
        x: toX,
        duration: DURATION,
        ease: EASE,
        overwrite: true,
      });
    },
    [computeTargets, total, botCount]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let touchY = 0;
    let wheelAccum = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;

    const flushWheel = () => {
      if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) {
        wheelAccum = 0;
        return;
      }
      const dir = wheelAccum > 0 ? 1 : -1;
      const steps = Math.max(1, Math.floor(Math.abs(wheelAccum) / MULTI_STEP_THRESHOLD));
      wheelAccum = 0;
      go(idxRef.current + dir * steps);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccum += e.deltaY;
      if (wheelTimer) clearTimeout(wheelTimer);
      wheelTimer = setTimeout(flushWheel, 40);
    };

    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const delta = touchY - e.changedTouches[0].clientY;
      if (Math.abs(delta) < TOUCH_THRESHOLD) return;
      const dir = delta > 0 ? 1 : -1;
      const steps = Math.max(1, Math.floor(Math.abs(delta) / TOUCH_MULTI));
      go(idxRef.current + dir * steps);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        go(idxRef.current + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        go(idxRef.current - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        go(0);
      } else if (e.key === "End") {
        e.preventDefault();
        go(total - 1);
      }
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
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [go, total]);

  return (
    <main ref={scrollRef} className="h-screen overflow-y-hidden overflow-x-hidden">
      {topArr.map((child, i) => (
        <div key={`top-${i}`} className="h-screen w-screen overflow-hidden flex items-center justify-center">
          <div className="w-full">{child}</div>
        </div>
      ))}

      {/* Pinned middle viewport — horizontal scroll-jack via x-transform */}
      <div className="h-screen w-screen overflow-hidden relative">
        <div
          ref={xRef}
          className="flex h-full will-change-transform"
          style={{ width: `${midCount * 100}vw` }}
        >
          {midArr.map((child, i) => (
            <div
              key={`mid-${i}`}
              className="h-screen overflow-hidden flex items-center justify-center"
              style={{ width: "100vw", flexShrink: 0 }}
            >
              <div className="w-full">{child}</div>
            </div>
          ))}
        </div>
      </div>

      {botArr.map((child, i) => {
        const isLast = i === botArr.length - 1;
        if (isLast) {
          return (
            <div key={`bot-${i}`} className="w-screen overflow-hidden">
              {child}
            </div>
          );
        }
        return (
          <div key={`bot-${i}`} className="h-screen w-screen overflow-hidden flex items-center justify-center">
            <div className="w-full">{child}</div>
          </div>
        );
      })}
    </main>
  );
}
