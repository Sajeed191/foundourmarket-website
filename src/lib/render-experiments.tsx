/**
 * TEMPORARY — Controlled renderer experiments for the intermittent Android
 * Chrome first-paint compositor corruption investigation.
 *
 * ALL experiments are OFF by default. Enable per-experiment via URL query:
 *   ?exp=1            -> experiment 1
 *   ?exp=1,3          -> experiments 1 and 3
 *   ?exp3=1           -> experiment 3
 *
 * Experiments:
 *   1  Disable ONLY the floating chat orb animation until 2s after first paint.
 *   2  Disable ONLY the flame pulse animation until 2s after first paint.
 *   3  Disable BOTH animations (orb + flame) until 2s after first paint.
 *   4  Disable ALL CSS animations/transitions in the first viewport until first paint.
 *   5  Remove horizontal carousel momentum/accelerated scrolling during first paint, then restore.
 *   6  Delay presenting floating UI (chat orb, badges, overlays) until 2s after first paint.
 *
 * This module injects experiment-gated <style> rules at runtime and removes
 * them after first paint (+ delay). It does NOT modify any component, CSS file,
 * layout, image pipeline, virtualization, or skeleton rendering. Deleting this
 * file and its single mount in __root.tsx fully reverts the experiment harness.
 */
import { useEffect } from "react";

const DELAY_MS = 2000;

function parseExps(): Set<number> {
  if (typeof window === "undefined") return new Set();
  const s = new Set<number>();
  const q = new URLSearchParams(window.location.search);
  const combined = q.get("exp");
  if (combined) {
    for (const part of combined.split(",")) {
      const n = parseInt(part.trim(), 10);
      if (n >= 1 && n <= 6) s.add(n);
    }
  }
  for (let i = 1; i <= 6; i++) {
    const v = q.get(`exp${i}`);
    if (v === "1" || v === "on" || v === "true") s.add(i);
  }
  return s;
}

function injectStyle(id: string, css: string): HTMLStyleElement {
  const el = document.createElement("style");
  el.id = id;
  el.setAttribute("data-render-experiment", "true");
  el.textContent = css;
  document.head.appendChild(el);
  return el;
}

/**
 * Runs the active experiments. Mount once, high in the tree.
 * Renders nothing.
 */
export function RenderExperiments() {
  useEffect(() => {
    const exps = parseExps();
    if (exps.size === 0) return;

    const injected: HTMLStyleElement[] = [];
    const timers: number[] = [];
    let raf1 = 0;
    let raf2 = 0;

    // --- Rules active immediately, removed 2s AFTER first paint ---
    const delayedCss: string[] = [];
    if (exps.has(1) || exps.has(3)) {
      delayedCss.push(`.animate-orb-breathe{animation:none !important;}`);
    }
    if (exps.has(2) || exps.has(3)) {
      delayedCss.push(`.animate-flame-pulse{animation:none !important;}`);
    }
    if (exps.has(6)) {
      // Delay presenting floating UI: remove from layout/paint entirely.
      delayedCss.push(
        `[data-floating-control],[data-floating-ui]{display:none !important;}`,
      );
    }
    if (delayedCss.length) {
      injected.push(injectStyle("exp-delayed", delayedCss.join("\n")));
    }

    // --- Rules active only through first paint (removed on 2x rAF) ---
    const firstPaintCss: string[] = [];
    if (exps.has(4)) {
      // Freeze every animation/transition until first paint.
      firstPaintCss.push(
        `*,*::before,*::after{animation-play-state:paused !important;transition:none !important;}`,
      );
    }
    if (exps.has(5)) {
      // Drop accelerated/momentum horizontal scrolling on carousels during
      // first paint (targets the shared carousel utility signature).
      firstPaintCss.push(
        `.snap-x{overflow-x:hidden !important;-webkit-overflow-scrolling:auto !important;}`,
      );
    }
    if (firstPaintCss.length) {
      injected.push(injectStyle("exp-firstpaint", firstPaintCss.join("\n")));
    }

    // Remove first-paint-only rules right after the first composited frame.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const fp = document.getElementById("exp-firstpaint");
        fp?.remove();

        // Remove delayed rules 2s after first paint.
        const t = window.setTimeout(() => {
          document.getElementById("exp-delayed")?.remove();
        }, DELAY_MS);
        timers.push(t);
      });
    });

    // eslint-disable-next-line no-console
    console.info("[render-experiments] active:", [...exps].sort());

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      timers.forEach(clearTimeout);
      injected.forEach((el) => el.remove());
    };
  }, []);

  return null;
}
