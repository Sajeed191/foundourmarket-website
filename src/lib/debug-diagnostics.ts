/**
 * TEMPORARY DEBUG DIAGNOSTICS — collects the hardware/runtime signals needed
 * to attribute the Android rendering corruption to a specific subsystem.
 *
 * Captured:
 *   - GPU renderer / vendor (WebGL UNMASKED_RENDERER_WEBGL)
 *   - JS heap usage (performance.memory, Chrome only)
 *   - Approx. compositor layer count (elements with promoted-layer CSS)
 *   - Image decode failures (img error events + decode() rejections)
 *   - Canvas failures (getContext / readback errors)
 *   - requestAnimationFrame FPS (rolling)
 *   - Long Tasks (PerformanceObserver longtask)
 *   - WebGL context loss events (the smoking gun for texture corruption)
 *
 * React-side counters (remounts / unexpected rerenders / hydration mismatches)
 * are fed in via recordReactEvent().
 */

import { isDebugEnabled } from "@/lib/debug-flags";
import { getPaletteExtractionCount } from "@/lib/image-palette";



export type Diagnostics = {
  gpuRenderer: string;
  gpuVendor: string;
  webglSupported: boolean;
  deviceMemoryGb: number | null;
  hardwareConcurrency: number | null;
  jsHeapUsedMb: number | null;
  jsHeapLimitMb: number | null;
  compositorLayers: number;
  imageDecodeFailures: number;
  canvasFailures: number;
  fps: number;
  longTasks: number;
  longTaskMaxMs: number;
  glContextLost: number;
  glContextRestored: number;
  reactRemounts: number;
  unexpectedRerenders: number;
  hydrationMismatches: number;
  userAgent: string;
  androidVersion: string;
  chromeVersion: string;
  deviceModel: string;
  domNodeCount: number;
  productCardCount: number;
  imageCount: number;
  decodedImageCount: number;
  paintCount: number;
  layoutShiftCount: number;
  createImageBitmapFailures: number;
};

const d: Diagnostics = {
  gpuRenderer: "unknown",
  gpuVendor: "unknown",
  webglSupported: false,
  deviceMemoryGb: null,
  hardwareConcurrency: null,
  jsHeapUsedMb: null,
  jsHeapLimitMb: null,
  compositorLayers: 0,
  imageDecodeFailures: 0,
  canvasFailures: 0,
  fps: 0,
  longTasks: 0,
  longTaskMaxMs: 0,
  glContextLost: 0,
  glContextRestored: 0,
  reactRemounts: 0,
  unexpectedRerenders: 0,
  hydrationMismatches: 0,
  userAgent: "",
  androidVersion: "n/a",
  chromeVersion: "n/a",
  deviceModel: "n/a",
  domNodeCount: 0,
  productCardCount: 0,
  imageCount: 0,
  decodedImageCount: 0,
  paintCount: 0,
  layoutShiftCount: 0,
  createImageBitmapFailures: 0,
};


const listeners = new Set<() => void>();
let installed = false;

function notify() {
  listeners.forEach((l) => l());
}

export function getDiagnostics(): Diagnostics {
  return { ...d };
}

export function subscribeDiagnostics(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function recordReactEvent(
  kind: "remount" | "rerender" | "hydration-mismatch",
) {
  if (kind === "remount") d.reactRemounts += 1;
  else if (kind === "rerender") d.unexpectedRerenders += 1;
  else d.hydrationMismatches += 1;
}

function readGpu() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      (canvas.getContext("webgl") as WebGLRenderingContext | null) ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) {
      d.canvasFailures += 1;
      return;
    }
    d.webglSupported = true;
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (dbg) {
      d.gpuRenderer = String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL));
      d.gpuVendor = String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL));
    } else {
      d.gpuRenderer = String(gl.getParameter(gl.RENDERER));
      d.gpuVendor = String(gl.getParameter(gl.VENDOR));
    }
    canvas.addEventListener("webglcontextlost", () => {
      d.glContextLost += 1;
      notify();
    });
    canvas.addEventListener("webglcontextrestored", () => {
      d.glContextRestored += 1;
      notify();
    });
  } catch {
    d.canvasFailures += 1;
  }

}

const LAYER_PROPS = [
  "transform",
  "filter",
  "backdrop-filter",
  "perspective",
  "mix-blend-mode",
  "will-change",
];

/** Rough count of elements that would be promoted to their own compositor
 *  layer. Not exact (Chrome's heuristics are internal) but a strong proxy. */
function countCompositorLayers(): number {
  let count = 0;
  const els = document.querySelectorAll("*");
  // Cap traversal to avoid its own long task.
  const limit = Math.min(els.length, 4000);
  for (let i = 0; i < limit; i++) {
    const cs = getComputedStyle(els[i] as Element);
    for (const prop of LAYER_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v && v !== "none" && v !== "auto" && v !== "normal") {
        count += 1;
        break;
      }
    }
  }
  return count;
}

function readMemory() {
  const perf = performance as Performance & {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  };
  if (perf.memory) {
    d.jsHeapUsedMb = Math.round(perf.memory.usedJSHeapSize / 1048576);
    d.jsHeapLimitMb = Math.round(perf.memory.jsHeapSizeLimit / 1048576);
  }
}

export function installDebugDiagnostics() {
  if (installed || typeof window === "undefined") return;
  if (document.documentElement.dataset.androidGpuSafeMode === "true" && !isDebugEnabled()) return;
  installed = true;

  d.userAgent = navigator.userAgent;
  d.deviceMemoryGb =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null;
  d.hardwareConcurrency = navigator.hardwareConcurrency ?? null;
  parseUserAgent(navigator.userAgent);

  readGpu();
  patchCreateImageBitmap();

  // Cumulative Layout Shift counter (CLS-style entries).
  try {
    const lspo = new PerformanceObserver((list) => {
      d.layoutShiftCount += list.getEntries().length;
      notify();
    });
    lspo.observe({ entryTypes: ["layout-shift"] });
  } catch {
    /* layout-shift unsupported */
  }

  // Paint timing entries (first-paint / first-contentful-paint + any reported).
  try {
    const ppo = new PerformanceObserver((list) => {
      d.paintCount += list.getEntries().length;
      notify();
    });
    ppo.observe({ entryTypes: ["paint"] });
  } catch {
    /* paint unsupported */
  }



  // Global image decode failure capture.
  window.addEventListener(
    "error",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "IMG") {
        d.imageDecodeFailures += 1;
        notify();
      }
    },
    true,
  );

  // Long tasks.
  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        d.longTasks += 1;
        if (entry.duration > d.longTaskMaxMs) d.longTaskMaxMs = entry.duration;
      }
      notify();
    });
    po.observe({ entryTypes: ["longtask"] });
  } catch {
    /* longtask unsupported */
  }

  // FPS via rAF.
  let frames = 0;
  let last = performance.now();
  const tick = () => {
    frames += 1;
    const now = performance.now();
    if (now - last >= 1000) {
      d.fps = Math.round((frames * 1000) / (now - last));
      frames = 0;
      last = now;
      readMemory();
      notify();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Periodic compositor layer + memory + DOM census sampling (every 2s).
  const sample = () => {
    try {
      d.compositorLayers = countCompositorLayers();
      d.domNodeCount = document.getElementsByTagName("*").length;
      d.productCardCount = document.querySelectorAll("[data-product-card]").length;
      const imgs = document.getElementsByTagName("img");
      d.imageCount = imgs.length;
      let decoded = 0;
      for (let i = 0; i < imgs.length; i++) {
        if (imgs[i].complete && imgs[i].naturalWidth > 0) decoded += 1;
      }
      d.decodedImageCount = decoded;
      readMemory();
      notify();
    } catch {
      /* ignore */
    }
  };
  setInterval(sample, 2000);
  setTimeout(sample, 500);
}

/** Extract Android version, Chrome version and device model from the UA. */
function parseUserAgent(ua: string) {
  const android = ua.match(/Android\s+([\d.]+)/i);
  if (android) d.androidVersion = android[1];
  const chrome = ua.match(/Chrome\/([\d.]+)/i);
  if (chrome) d.chromeVersion = chrome[1];
  // Device model sits between the Android build token and ") AppleWebKit".
  const model = ua.match(/;\s*([^;)]+)\s+Build\//i);
  if (model) d.deviceModel = model[1].trim();
}

/** Wrap createImageBitmap to count failures (a known Mali corruption path). */
function patchCreateImageBitmap() {
  if (typeof window === "undefined" || typeof window.createImageBitmap !== "function") return;
  const w = window as Window & { __cibPatched?: boolean };
  if (w.__cibPatched) return;
  w.__cibPatched = true;
  const orig = window.createImageBitmap.bind(window);
  window.createImageBitmap = ((...args: Parameters<typeof orig>) =>
    orig(...args).catch((err: unknown) => {
      d.createImageBitmapFailures += 1;
      notify();
      throw err;
    })) as typeof window.createImageBitmap;
}


/** Wrap original Image.prototype.decode to count rejections. */
export function patchImageDecode() {
  if (typeof window === "undefined") return;
  if (document.documentElement.dataset.androidGpuSafeMode === "true" && !isDebugEnabled()) return;
  const proto = HTMLImageElement.prototype as HTMLImageElement & {
    __decodePatched?: boolean;
  };
  if (proto.__decodePatched) return;
  proto.__decodePatched = true;
  const orig = proto.decode;
  proto.decode = function patched(this: HTMLImageElement) {
    return orig.call(this).catch((err: unknown) => {
      d.imageDecodeFailures += 1;
      notify();
      throw err;
    });
  };
}

/* ------------------------------------------------------------------ *
 * TEMPORARY RUNTIME RECORDER — evidence-only investigation.
 *
 * Records a time-series of the live diagnostics so growth curves (memory,
 * DOM, retained cards/images, palette extractions, FPS, long tasks) can be
 * correlated against user-marked corruption events. Runs entirely on the
 * device; export the JSON/CSV to build the report. Remove with the harness.
 * ------------------------------------------------------------------ */

export type RecorderSample = {
  t: number; // ms since recording start
  scrollY: number;
  fps: number;
  longTasks: number;
  longTaskMaxMs: number;
  jsHeapUsedMb: number | null;
  domNodeCount: number;
  productCardCount: number;
  cardFrameCount: number;
  imageCount: number;
  decodedImageCount: number;
  paletteExtractions: number;
  compositorLayers: number;
  glContextLost: number;
  imageDecodeFailures: number;
  createImageBitmapFailures: number;
  layoutShiftCount: number;
  estImageMemoryMb: number; // decoded imgs × natural WxH × 4 bytes
  corruption: boolean; // true on the sample where the user marked corruption
};

let recording = false;
let recStart = 0;
let recTimer: ReturnType<typeof setInterval> | null = null;
let recBuffer: RecorderSample[] = [];
let corruptionPending = false;
const recListeners = new Set<() => void>();

function recNotify() {
  recListeners.forEach((l) => l());
}

export function subscribeRecorder(cb: () => void): () => void {
  recListeners.add(cb);
  return () => recListeners.delete(cb);
}

export function isRecording(): boolean {
  return recording;
}

export function getRecordingCount(): number {
  return recBuffer.length;
}

export function getRecording(): RecorderSample[] {
  return [...recBuffer];
}

/** Estimate decoded bitmap memory: sum of naturalW×naturalH×4 over loaded imgs. */
function estimateImageMemoryMb(): number {
  const imgs = document.getElementsByTagName("img");
  let bytes = 0;
  const limit = Math.min(imgs.length, 5000);
  for (let i = 0; i < limit; i++) {
    const im = imgs[i];
    if (im.complete && im.naturalWidth > 0) {
      bytes += im.naturalWidth * im.naturalHeight * 4;
    }
  }
  return Math.round(bytes / 1048576);
}

function takeRecorderSample() {
  const snap = getDiagnostics();
  recBuffer.push({
    t: Math.round(performance.now() - recStart),
    scrollY: Math.round(window.scrollY),
    fps: snap.fps,
    longTasks: snap.longTasks,
    longTaskMaxMs: Math.round(snap.longTaskMaxMs),
    jsHeapUsedMb: snap.jsHeapUsedMb,
    domNodeCount: document.getElementsByTagName("*").length,
    productCardCount: document.querySelectorAll("[data-product-card]").length,
    cardFrameCount: document.querySelectorAll("[data-product-card-frame]").length,
    imageCount: document.getElementsByTagName("img").length,
    decodedImageCount: snap.decodedImageCount,
    paletteExtractions: getPaletteExtractionCount(),
    compositorLayers: snap.compositorLayers,
    glContextLost: snap.glContextLost,
    imageDecodeFailures: snap.imageDecodeFailures,
    createImageBitmapFailures: snap.createImageBitmapFailures,
    layoutShiftCount: snap.layoutShiftCount,
    estImageMemoryMb: estimateImageMemoryMb(),
    corruption: corruptionPending,
  });
  corruptionPending = false;
  // Bound the buffer so a very long session never OOMs the device itself.
  if (recBuffer.length > 3600) recBuffer.shift();
  recNotify();
}

export function startRecording(intervalMs = 1000) {
  if (recording || typeof window === "undefined") return;
  recording = true;
  recStart = performance.now();
  recBuffer = [];
  corruptionPending = false;
  takeRecorderSample();
  recTimer = setInterval(takeRecorderSample, intervalMs);
  recNotify();
}

export function stopRecording() {
  recording = false;
  if (recTimer) {
    clearInterval(recTimer);
    recTimer = null;
  }
  recNotify();
}

/** Mark that visual corruption is happening right now (flagged on next sample,
 *  and also immediately captured so the exact moment is never missed). */
export function markCorruption() {
  corruptionPending = true;
  if (recording) takeRecorderSample();
  recNotify();
}

export function clearRecording() {
  recBuffer = [];
  recNotify();
}

export function recordingToCsv(): string {
  const cols: (keyof RecorderSample)[] = [
    "t", "scrollY", "fps", "longTasks", "longTaskMaxMs", "jsHeapUsedMb",
    "domNodeCount", "productCardCount", "cardFrameCount", "imageCount",
    "decodedImageCount", "paletteExtractions", "compositorLayers",
    "glContextLost", "imageDecodeFailures", "createImageBitmapFailures",
    "layoutShiftCount", "estImageMemoryMb", "corruption",
  ];
  const header = cols.join(",");
  const rows = recBuffer.map((s) => cols.map((c) => String(s[c] ?? "")).join(","));
  return [header, ...rows].join("\n");
}

export function recordingToJson(): string {
  return JSON.stringify(
    { device: getDiagnostics(), samples: recBuffer },
    null,
    2,
  );
}

