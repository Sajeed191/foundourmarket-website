/** Client-side Razorpay Checkout script loader + types. */

export type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string; backdrop_color?: string };
  method?: Record<string, boolean>;
  customer_id?: string;
  save?: 0 | 1;

  /**
   * Checkout display configuration. Lets us reorder payment blocks and
   * prioritize UPI (Intent + Collect/VPA + QR) above the default blocks.
   * See https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/customize/checkout-display/
   */
  config?: {
    display?: {
      blocks?: Record<
        string,
        {
          name: string;
          instruments: Array<{
            method: string;
            flows?: string[];
            apps?: string[];
            issuers?: string[];
            banks?: string[];
            wallets?: string[];
            types?: string[];
          }>;
        }
      >;
      sequence?: string[];
      preferences?: { show_default_blocks?: boolean };
    };
  };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void; escape?: boolean; backdropclose?: boolean };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, cb: (resp: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loadPromise: Promise<void> | null = null;

/** Inject the Razorpay script once and resolve when window.Razorpay exists. */
function injectScript(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    // Reuse an in-flight/previous tag if present and already evaluated.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SRC}"]`);
    if (existing) {
      if (window.Razorpay) return resolve();
      existing.addEventListener("load", () => (window.Razorpay ? resolve() : reject(new Error("Failed to load Razorpay"))));
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay. Check your network.")));
      return;
    }
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    // Guard against a slow/blocked network leaving the promise hanging forever.
    const timeout = setTimeout(() => reject(new Error("Failed to load Razorpay. Check your network.")), 12000);
    script.onload = () => {
      clearTimeout(timeout);
      window.Razorpay ? resolve() : reject(new Error("Failed to load Razorpay"));
    };
    script.onerror = () => {
      clearTimeout(timeout);
      // Remove the failed tag so the retry can inject a clean one.
      script.remove();
      reject(new Error("Failed to load Razorpay. Check your network."));
    };
    document.body.appendChild(script);
  });
}

/**
 * Load the Razorpay Checkout SDK. Retries ONCE on failure (covers flaky mobile
 * networks and transient CDN errors). A hard failure after the retry usually
 * means an ad-blocker or offline device — surfaced as a readable error upstream.
 */
export function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = injectScript()
    .catch(async () => {
      // Single retry after a short backoff.
      await new Promise((r) => setTimeout(r, 600));
      return injectScript();
    })
    .catch((err) => {
      // Allow a future attempt to start fresh.
      loadPromise = null;
      throw err;
    });
  return loadPromise;
}

export function openRazorpay(options: RazorpayOptions): RazorpayInstance {
  if (!window.Razorpay) throw new Error("Razorpay not loaded");
  const rzp = new window.Razorpay(options);
  return rzp;
}
