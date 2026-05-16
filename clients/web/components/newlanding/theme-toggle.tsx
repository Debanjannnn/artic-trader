"use client";

import { Sun, Moon } from "lucide-react";
import { useLandingTheme } from "./theme-context";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const ctx = useLandingTheme();
  if (!ctx) return null;
  const { theme, toggle } = ctx;
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-full border border-border/50 bg-background/40 text-foreground/70 hover:text-foreground hover:bg-background/60 transition-colors",
        className
      )}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
