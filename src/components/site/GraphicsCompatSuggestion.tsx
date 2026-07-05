import { useEffect } from "react";
import { toast } from "sonner";
import {
  shouldSuggestGraphicsCompat,
  dismissGraphicsCompatSuggestion,
  setGraphicsCompatPref,
} from "@/lib/graphics-compat";

/**
 * Non-forced, dismissible suggestion for Graphics Compatibility Mode.
 * Renders nothing; on Android Chromium (and only when the user has not already
 * chosen or dismissed) it shows a single persistent toast offering to enable
 * the compatibility rendering path. Enabling applies live — no reload.
 */
export function GraphicsCompatSuggestion() {
  useEffect(() => {
    if (!shouldSuggestGraphicsCompat()) return;
    // Wait a few seconds so it never competes with first paint / hydration.
    const t = setTimeout(() => {
      if (!shouldSuggestGraphicsCompat()) return;
      toast("Seeing display glitches while scrolling?", {
        description:
          "Turn on Graphics Compatibility Mode for smoother rendering on this device. You can change it anytime in Preferences.",
        duration: Infinity,
        action: {
          label: "Enable",
          onClick: () => {
            setGraphicsCompatPref("on");
            dismissGraphicsCompatSuggestion();
            toast.success("Graphics Compatibility Mode enabled");
          },
        },
        cancel: {
          label: "Not now",
          onClick: () => dismissGraphicsCompatSuggestion(),
        },
        onDismiss: () => dismissGraphicsCompatSuggestion(),
      });
    }, 4500);
    return () => clearTimeout(t);
  }, []);

  return null;
}
