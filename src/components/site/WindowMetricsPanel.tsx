import { useEffect, useRef, useState } from "react";
import {
  getWindowMetrics,
  isWindowExperimentActive,
  subscribeWindowMetrics,
  type WindowGridMetrics,
} from "@/lib/window-metrics";

/**
 * Live A/B metrics overlay for the windowed-virtualization experiment.
 *
 * Renders ONLY when the `?ff-window` param is present (value `on` = windowed,
 * anything else e.g. `?ff-window=off` = default IncrementalGrid). This keeps it
 * completely out of the pure production build (no param) while letting you read
 * identical live metrics for both A/B arms on the same device.
 *
 * DOM samples (mounted cards, <img>, node count, scrollY) come from a self-owned
 * rAF loop; grid-internal numbers (window size, spacers, rows) come from the
 * shared store WindowedGrid publishes to.
 */
export function WindowMetricsPanel() {
  const [active, setActive] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [grid, setGrid] = useState<WindowGridMetrics>(() => getWindowMetrics());
  const [dom, setDom] = useState({ cards: 0, imgs: 0, nodes: 0, scrollY: 0, peakCards: 0, peakImgs: 0 });
  const peakRef = useRef({ cards: 0, imgs: 0 });

  useEffect(() => {
    setActive(isWindowExperimentActive());
  }, []);

  useEffect(() => subscribeWindowMetrics(() => setGrid(getWindowMetrics())), []);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 250) return; // sample ~4x/sec, cheap
      last = t;
      const cards = document.querySelectorAll("[data-product-card-frame]").length;
      const imgs = document.querySelectorAll("[data-product-card-frame] img").length;
      const nodes = document.getElementsByTagName("*").length;
      peakRef.current.cards = Math.max(peakRef.current.cards, cards);
      peakRef.current.imgs = Math.max(peakRef.current.imgs, imgs);
      setDom({
        cards,
        imgs,
        nodes,
        scrollY: Math.round(window.scrollY || 0),
        peakCards: peakRef.current.cards,
        peakImgs: peakRef.current.imgs,
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;

  const modeLabel = grid.mode === "windowed" ? "WINDOWED (ff-window=on)" : "DEFAULT (append-only)";

  const rows: [string, string | number][] = [
    ["Mode", modeLabel],
    ["Mounted cards", dom.cards],
    ["Mounted <img>", dom.imgs],
    ["Peak cards", dom.peakCards],
    ["Peak <img>", dom.peakImgs],
    ["DOM nodes", dom.nodes.toLocaleString()],
    ["Scroll Y", `${dom.scrollY}px`],
    ["Window size", grid.windowSize],
    ["Overscan rows", grid.overscanRows],
    ["Visible rows", grid.visibleRows],
    ["Rows [start..end]", `${grid.startRow}..${grid.endRow} / ${grid.totalRows}`],
    ["Columns", grid.colCount],
    ["Row stride", `${Math.round(grid.rowStride)}px`],
    ["Top spacer", `${Math.round(grid.topSpacer)}px`],
    ["Bottom spacer", `${Math.round(grid.bottomSpacer)}px`],
  ];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 8,
        left: 8,
        zIndex: 2147483000,
        width: collapsed ? "auto" : 232,
        maxWidth: "calc(100vw - 16px)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 11,
        lineHeight: 1.35,
        color: "#e6f0ff",
        background: "rgba(6,10,20,0.92)",
        border: "1px solid rgba(120,150,255,0.35)",
        borderRadius: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
        backdropFilter: "none",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "6px 10px",
          background: grid.mode === "windowed" ? "rgba(255,150,60,0.22)" : "rgba(80,110,255,0.22)",
          border: "none",
          color: "inherit",
          font: "inherit",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        <span>A/B · {grid.mode === "windowed" ? "WINDOW" : "DEFAULT"}</span>
        <span>{collapsed ? "▲" : "▼"}</span>
      </button>
      {!collapsed && (
        <div style={{ padding: "6px 10px 8px" }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span style={{ opacity: 0.7 }}>{k}</span>
              <span style={{ fontWeight: 600, textAlign: "right" }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
