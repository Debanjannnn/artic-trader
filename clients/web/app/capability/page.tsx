"use client";

import { useState } from "react";
import {
  FeaturesBento,
  DEFAULT_BENTO_THEME,
  type BentoTheme,
} from "@/components/newlanding/features-bento-test";

type Knob =
  | { key: keyof BentoTheme; label: string; type: "color"; group: string }
  | { key: keyof BentoTheme; label: string; type: "number"; min: number; max: number; step?: number; group: string }
  | { key: keyof BentoTheme; label: string; type: "text"; group: string }
  | { key: keyof BentoTheme; label: string; type: "bool"; group: string };

const KNOBS: Knob[] = [
  { key: "cardBg", label: "Card BG", type: "color", group: "Card" },
  { key: "borderIdle", label: "Border (idle)", type: "text", group: "Card" },
  { key: "borderActive", label: "Border (active)", type: "text", group: "Card" },
  { key: "borderWidth", label: "Border width", type: "number", min: 0, max: 6, step: 0.5, group: "Card" },
  { key: "borderRadius", label: "Border radius", type: "number", min: 0, max: 48, step: 1, group: "Card" },
  { key: "cardGap", label: "Card gap (px)", type: "number", min: 0, max: 40, step: 1, group: "Card" },
  { key: "cardHeight", label: "Grid height (px)", type: "number", min: 300, max: 900, step: 10, group: "Card" },
  { key: "cardPaddingX", label: "Padding X (rem)", type: "number", min: 0.5, max: 4, step: 0.05, group: "Card" },
  { key: "cardPaddingY", label: "Padding Y (rem)", type: "number", min: 0.5, max: 4, step: 0.05, group: "Card" },

  { key: "accentOpacityIdle", label: "Accent opacity (idle)", type: "number", min: 0, max: 1, step: 0.01, group: "Accent" },
  { key: "accentOpacityActive", label: "Accent opacity (active)", type: "number", min: 0, max: 1, step: 0.01, group: "Accent" },
  { key: "accentGradient", label: "Gradient ({accent})", type: "text", group: "Accent" },

  { key: "titleSizeIdle", label: "Title size (idle)", type: "number", min: 10, max: 48, step: 1, group: "Type" },
  { key: "titleSizeActive", label: "Title size (active)", type: "number", min: 12, max: 64, step: 1, group: "Type" },
  { key: "titleColor", label: "Title color", type: "text", group: "Type" },
  { key: "descColor", label: "Description color", type: "text", group: "Type" },

  { key: "pillBg", label: "Pill bg", type: "text", group: "Pills" },
  { key: "pillBorder", label: "Pill border", type: "text", group: "Pills" },
  { key: "pillColor", label: "Pill color", type: "text", group: "Pills" },

  { key: "iconSize", label: "Size (px)", type: "number", min: 32, max: 320, step: 4, group: "Icon" },
  { key: "iconShowIdle", label: "Show when idle", type: "bool", group: "Icon" },
  { key: "iconOpacityIdle", label: "Opacity (idle)", type: "number", min: 0, max: 1, step: 0.01, group: "Icon" },
  { key: "iconOpacityActive", label: "Opacity (active)", type: "number", min: 0, max: 1, step: 0.01, group: "Icon" },
  { key: "iconScaleIdle", label: "Scale (idle)", type: "number", min: 0.1, max: 2, step: 0.05, group: "Icon" },
  { key: "iconScaleActive", label: "Scale (active)", type: "number", min: 0.1, max: 2, step: 0.05, group: "Icon" },
  { key: "iconRightOffset", label: "Right offset (rem)", type: "number", min: -2, max: 6, step: 0.05, group: "Icon" },
  { key: "iconTranslateIdleX", label: "Translate-X (idle, px)", type: "number", min: -200, max: 200, step: 2, group: "Icon" },
  { key: "iconTranslateActiveX", label: "Translate-X (active, px)", type: "number", min: -200, max: 200, step: 2, group: "Icon" },
  { key: "iconRotateIdle", label: "Rotate (idle, deg)", type: "number", min: -180, max: 180, step: 1, group: "Icon" },
  { key: "iconRotateActive", label: "Rotate (active, deg)", type: "number", min: -180, max: 180, step: 1, group: "Icon" },
  { key: "iconBlurIdle", label: "Blur (idle, px)", type: "number", min: 0, max: 30, step: 0.5, group: "Icon" },
  { key: "iconBlurActive", label: "Blur (active, px)", type: "number", min: 0, max: 30, step: 0.5, group: "Icon" },
  { key: "iconBrightness", label: "Brightness", type: "number", min: 0, max: 3, step: 0.05, group: "Icon" },
  { key: "iconSaturate", label: "Saturate", type: "number", min: 0, max: 3, step: 0.05, group: "Icon" },
  { key: "iconHueRotate", label: "Hue-rotate (deg)", type: "number", min: 0, max: 360, step: 1, group: "Icon" },
  { key: "iconDropShadow", label: "Drop-shadow", type: "text", group: "Icon" },
  { key: "iconMixBlendMode", label: "Mix-blend-mode", type: "text", group: "Icon" },
];

export default function CapabilityPlayground() {
  const [theme, setTheme] = useState<BentoTheme>(DEFAULT_BENTO_THEME);

  function update<K extends keyof BentoTheme>(key: K, value: BentoTheme[K]) {
    setTheme((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setTheme(DEFAULT_BENTO_THEME);
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Control panel */}
      <aside className="w-[340px] shrink-0 border-r border-foreground/10 p-5 overflow-y-auto h-screen sticky top-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-foreground/60">
            Bento Playground
          </h2>
          <button
            onClick={reset}
            className="text-[11px] font-mono uppercase tracking-wider px-2 py-1 rounded border border-foreground/20 hover:bg-foreground/5"
          >
            Reset
          </button>
        </div>

        <div className="space-y-5">
          {Array.from(new Set(KNOBS.map((k) => k.group))).map((group) => (
            <section key={group}>
              <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-foreground/40 mb-2 pb-1 border-b border-foreground/10">
                {group}
              </h3>
              <div className="space-y-3">
                {KNOBS.filter((k) => k.group === group).map((k) => {
                  const val = theme[k.key];
                  if (k.type === "color" || k.type === "text") {
                    return (
                      <label key={k.key} className="block">
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-foreground/50 mb-1">
                          {k.label}
                        </span>
                        <div className="flex gap-2">
                          {k.type === "color" && (
                            <input
                              type="color"
                              value={typeof val === "string" && val.startsWith("#") ? val : "#000000"}
                              onChange={(e) => update(k.key, e.target.value as never)}
                              className="w-9 h-9 rounded border border-foreground/10 bg-transparent"
                            />
                          )}
                          <input
                            type="text"
                            value={String(val)}
                            onChange={(e) => update(k.key, e.target.value as never)}
                            className="flex-1 px-2 py-1 text-xs font-mono bg-foreground/5 border border-foreground/10 rounded text-foreground"
                          />
                        </div>
                      </label>
                    );
                  }
                  if (k.type === "bool") {
                    return (
                      <label key={k.key} className="flex items-center justify-between gap-2 cursor-pointer">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/50">
                          {k.label}
                        </span>
                        <input
                          type="checkbox"
                          checked={Boolean(val)}
                          onChange={(e) => update(k.key, e.target.checked as never)}
                          className="accent-foreground"
                        />
                      </label>
                    );
                  }
                  return (
                    <label key={k.key} className="block">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/50">
                          {k.label}
                        </span>
                        <span className="text-[11px] font-mono text-foreground/70">{String(val)}</span>
                      </div>
                      <input
                        type="range"
                        min={k.min}
                        max={k.max}
                        step={k.step ?? 1}
                        value={Number(val)}
                        onChange={(e) => update(k.key, Number(e.target.value) as never)}
                        className="w-full"
                      />
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <details className="mt-6">
          <summary className="text-[11px] font-mono uppercase tracking-wider text-foreground/50 cursor-pointer">
            Export JSON
          </summary>
          <pre className="mt-2 p-2 text-[10px] font-mono bg-foreground/5 border border-foreground/10 rounded overflow-auto max-h-60">
            {JSON.stringify(theme, null, 2)}
          </pre>
        </details>
      </aside>

      {/* Live preview */}
      <main className="flex-1 overflow-x-hidden">
        <FeaturesBento theme={theme} />
      </main>
    </div>
  );
}
