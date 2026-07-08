import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGpuUnsafe } from "@/lib/gpu-compat";
import { AlertTriangle, X } from "lucide-react";

const DISMISS_KEY = "fom-compat-banner-dismissed";

/**
 * Compatibility Mode notice — shown ONCE on gpu-unsafe devices only.
 *
 * UI/UX ONLY. Detection (useGpuUnsafe) and Compatibility Mode logic are
 * untouched. This is a compact bottom sheet on mobile that never covers the
 * bottom navigation or floating support buttons, and a small bottom-right toast
 * on tablet/desktop. Swipe down or tap X to dismiss (remembered in localStorage);
 * Learn More opens the existing dialog.
 */
export function GpuCompatBanner() {
  const gpuUnsafe = useGpuUnsafe();
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const [learnMore, setLearnMore] = useState(false);

  // Swipe-to-dismiss tracking
  const dragStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (!gpuUnsafe) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* storage disabled — still show this session */
    }
    setVisible(true);
    // Trigger enter animation on next frame.
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [gpuUnsafe]);

  function dismiss() {
    setEntered(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    // Let the 180ms out-animation play before unmounting.
    window.setTimeout(() => setVisible(false), 180);
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
  }
  function onPointerMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  }
  function onPointerUp() {
    if (dragStartY.current === null) return;
    if (dragY > 40) {
      dismiss();
    } else {
      setDragY(0);
    }
    dragStartY.current = null;
  }

  if (!gpuUnsafe || !visible) return null;

  const translateY = entered ? dragY : 8;

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="gpu-compat-banner"
        style={{
          opacity: entered ? 1 : 0,
          transform: `translateY(${translateY}px)`,
          transition: dragStartY.current !== null ? "none" : "opacity 180ms ease-out, transform 180ms ease-out",
        }}
      >
        <span className="gpu-compat-banner__icon" aria-hidden="true">
          <AlertTriangle className="h-4 w-4" />
        </span>

        <div className="gpu-compat-banner__text">
          <p className="gpu-compat-banner__title">Graphics Compatibility Mode</p>
          <p className="gpu-compat-banner__desc">
            Some graphics effects have been reduced for better stability.
          </p>
        </div>

        <div className="gpu-compat-banner__actions">
          <button
            type="button"
            onClick={() => setLearnMore(true)}
            className="gpu-compat-banner__learn"
          >
            Learn More
          </button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="gpu-compat-banner__close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Dialog open={learnMore} onOpenChange={setLearnMore}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>About Compatibility Mode</DialogTitle>
            <DialogDescription>Why you&apos;re seeing this notice</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              This is a graphics rendering issue in your current browser&apos;s
              GPU engine on this device — not a problem with the website itself.
            </p>
            <p>
              Firefox is unaffected, and newer Chromium-based browser versions
              have already fixed similar rendering issues.
            </p>
            <p>
              Compatibility Mode reduces the graphics workload to improve
              stability, but it cannot fully correct a browser rendering bug.
              Updating your browser is the most reliable fix.
            </p>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setLearnMore(false);
                dismiss();
              }}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
