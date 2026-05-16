"use client";

import { useEffect, useRef } from "react";

type Snowflake = {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  drift: number;
  driftSpeed: number;
  opacity: number;
};

export function ArcticScene() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let snowflakes: Snowflake[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((width * height) / 9000);
      snowflakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.6 + Math.random() * 2.2,
        vy: 0.2 + Math.random() * 0.8,
        vx: 0,
        drift: Math.random() * Math.PI * 2,
        driftSpeed: 0.002 + Math.random() * 0.006,
        opacity: 0.3 + Math.random() * 0.7,
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const drawAurora = (t: number) => {
      const bands = [
        { hue: 175, alpha: 0.18, yOffset: 0, speed: 0.00015, amp: 30 },
        { hue: 195, alpha: 0.14, yOffset: 40, speed: 0.0002, amp: 40 },
        { hue: 155, alpha: 0.1, yOffset: 80, speed: 0.00012, amp: 25 },
      ];
      bands.forEach((b, i) => {
        const grad = ctx.createLinearGradient(0, 0, 0, height * 0.55);
        grad.addColorStop(0, `hsla(${b.hue}, 70%, 60%, 0)`);
        grad.addColorStop(0.5, `hsla(${b.hue}, 70%, 60%, ${b.alpha})`);
        grad.addColorStop(1, `hsla(${b.hue}, 70%, 60%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        const phase = t * b.speed + i * 1.3;
        const baseY = b.yOffset + height * 0.05;
        ctx.moveTo(0, baseY);
        for (let x = 0; x <= width; x += 8) {
          const y =
            baseY +
            Math.sin(x * 0.004 + phase) * b.amp +
            Math.sin(x * 0.012 + phase * 1.7) * (b.amp * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height * 0.5);
        ctx.lineTo(0, height * 0.5);
        ctx.closePath();
        ctx.fill();
      });
    };

    const drawMoon = () => {
      const cx = width * 0.82;
      const cy = height * 0.18;
      const r = Math.min(width, height) * 0.04;

      const halo = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 8);
      halo.addColorStop(0, "rgba(220, 235, 255, 0.35)");
      halo.addColorStop(0.4, "rgba(180, 210, 240, 0.08)");
      halo.addColorStop(1, "rgba(180, 210, 240, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 8, 0, Math.PI * 2);
      ctx.fill();

      const body = ctx.createRadialGradient(
        cx - r * 0.3,
        cy - r * 0.3,
        r * 0.1,
        cx,
        cy,
        r
      );
      body.addColorStop(0, "rgba(245, 250, 255, 1)");
      body.addColorStop(1, "rgba(200, 220, 240, 0.85)");
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawGround = () => {
      const grad = ctx.createLinearGradient(0, height * 0.7, 0, height);
      grad.addColorStop(0, "rgba(200, 220, 240, 0)");
      grad.addColorStop(0.4, "rgba(180, 205, 235, 0.18)");
      grad.addColorStop(1, "rgba(220, 235, 250, 0.45)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.78);
      for (let x = 0; x <= width; x += 30) {
        const y = height * 0.78 + Math.sin(x * 0.01) * 8;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      ctx.fill();
    };

    const drawTree = (t: number) => {
      const baseX = width * 0.72;
      const baseY = height * 0.82;
      const treeH = Math.min(height * 0.62, 480);
      const sway = Math.sin(t * 0.0008) * 0.015;

      ctx.save();
      ctx.translate(baseX, baseY);

      ctx.strokeStyle = "rgba(20, 30, 40, 0.95)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(sway * 40, -treeH * 0.5, sway * 80, -treeH);
      ctx.stroke();

      const layers = 6;
      for (let i = 0; i < layers; i++) {
        const yTop = -treeH * (0.25 + (i / layers) * 0.75);
        const yBot = -treeH * (0.18 + (i / layers) * 0.75);
        const widthAtLayer = treeH * (0.32 - i * 0.04);
        const layerSway = sway * (1 - i / layers) * 60;

        ctx.fillStyle = `rgba(${15 + i * 4}, ${25 + i * 5}, ${35 + i * 5}, 0.96)`;
        ctx.beginPath();
        ctx.moveTo(layerSway - widthAtLayer * 0.5, yBot);
        ctx.quadraticCurveTo(
          layerSway,
          yTop - 10,
          layerSway + widthAtLayer * 0.5,
          yBot
        );
        ctx.quadraticCurveTo(layerSway, yBot - 6, layerSway - widthAtLayer * 0.5, yBot);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "rgba(220, 235, 250, 0.85)";
        ctx.beginPath();
        ctx.moveTo(layerSway - widthAtLayer * 0.5, yBot);
        ctx.quadraticCurveTo(
          layerSway,
          yBot - 4,
          layerSway + widthAtLayer * 0.5,
          yBot
        );
        ctx.quadraticCurveTo(
          layerSway,
          yBot + 2,
          layerSway - widthAtLayer * 0.5,
          yBot
        );
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    };

    const drawFox = (t: number) => {
      const cx = width * 0.62;
      const cy = height * 0.85;
      const scale = Math.min(width, height) * 0.00045;
      const breath = 1 + Math.sin(t * 0.002) * 0.02;
      const tailWag = Math.sin(t * 0.0015) * 0.15;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale * 100, scale * 100 * breath);

      ctx.fillStyle = "rgba(240, 248, 255, 0.95)";
      ctx.strokeStyle = "rgba(140, 170, 200, 0.6)";
      ctx.lineWidth = 0.04;

      ctx.beginPath();
      ctx.ellipse(0, 0, 1.6, 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-1.2, -0.6, 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-1.4, -1.0);
      ctx.lineTo(-1.2, -1.4);
      ctx.lineTo(-1.0, -0.95);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-0.95, -1.0);
      ctx.lineTo(-0.75, -1.35);
      ctx.lineTo(-0.6, -0.85);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(20, 30, 40, 0.85)";
      ctx.beginPath();
      ctx.arc(-1.45, -0.65, 0.05, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(240, 248, 255, 0.95)";
      ctx.beginPath();
      ctx.moveTo(0.5, 0.6);
      ctx.lineTo(0.5, 0.95);
      ctx.lineTo(0.7, 0.95);
      ctx.lineTo(0.7, 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-0.6, 0.6);
      ctx.lineTo(-0.6, 0.95);
      ctx.lineTo(-0.4, 0.95);
      ctx.lineTo(-0.4, 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.translate(1.4, -0.1);
      ctx.rotate(tailWag);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(0.7, -0.5, 1.1, -0.9);
      ctx.quadraticCurveTo(0.9, -0.2, 0.3, 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 1)";
      ctx.beginPath();
      ctx.arc(1.1, -0.9, 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
    };

    const drawSnow = () => {
      ctx.fillStyle = "rgba(255, 255, 255, 1)";
      snowflakes.forEach((s) => {
        s.drift += s.driftSpeed;
        s.x += Math.sin(s.drift) * 0.4;
        s.y += s.vy;
        if (s.y > height + 5) {
          s.y = -5;
          s.x = Math.random() * width;
        }
        if (s.x > width + 5) s.x = -5;
        if (s.x < -5) s.x = width + 5;
        ctx.globalAlpha = s.opacity;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };

    const drawBackground = () => {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#05080d");
      grad.addColorStop(0.5, "#0a1018");
      grad.addColorStop(1, "#0E141A");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(
        width * 0.3,
        height * 0.5,
        width * 0.1,
        width * 0.3,
        height * 0.5,
        width * 0.7
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    };

    const tick = (t: number) => {
      drawBackground();
      drawAurora(t);
      drawMoon();
      drawGround();
      drawTree(t);
      drawFox(t);
      drawSnow();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden
    />
  );
}
