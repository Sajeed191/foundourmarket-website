/**
 * GPU compatibility — single source of truth.
 * ------------------------------------------
 * The boot probe in `src/routes/__root.tsx` runs a pre-paint WebGL renderer
 * check and sets `html[data-gpu-unsafe="true"]` on known GPU-unsafe Android
 * devices (Mali / PowerVR / VideoCore / Vivante / old Adreno / software
 * rasterizers, or very old Chromium/Samsung engines).
 *
 * On those devices Chromium's GPU rasterization path corrupts compositor tiles
 * (black flashes, striping, ghost textures). Firefox is unaffected and Chrome is
 * fine with GPU rasterization disabled, so this is a driver-compatibility issue,
 * not an app bug. The remedy is to REDUCE GPU workload — smaller single-URL
 * WebP images, no canvas readback, no reveal animations, no compositor-layer
 * promotion — never to change anything on normal devices.
 *
 * EVERY compatibility decision in the app reads from `isGpuUnsafe()` so the
 * logic is centralized and never scattered as inline dataset checks. No browser
 * sniffing beyond the existing boot probe; no feature flags; no URL params.
 */
export function isGpuUnsafe(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.gpuUnsafe === "true";
}
