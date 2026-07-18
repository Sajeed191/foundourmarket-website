import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { trackEvent, deviceType, currentRegion } from "@/lib/visitor";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your email address.")
  .max(255, "Email is too long.")
  .email("Enter a valid email address.");

const REQUEST_TIMEOUT_MS = 12000;

type Status = "idle" | "loading" | "success";

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();
  if (lower.includes("timeout") || lower.includes("aborted")) return "Network is slow. Please try again.";
  if (lower.includes("failed to fetch") || lower.includes("network")) return "You appear to be offline.";
  if (lower.includes("permission") || lower.includes("row-level")) return "Server unavailable. Try again later.";
  return "Something went wrong. Please try again.";
}

async function insertWithTimeout(payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert(payload as never)
      .abortSignal(controller.signal);
    return { error };
  } finally {
    clearTimeout(timer);
  }
}

export function NewsletterForm({ source = "homepage" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [successPulse, setSuccessPulse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);
  const trackedRef = useRef<string | null>(null); // dedupe analytics per email

  // Live validation (debounced-lite: only after user typed something reasonable)
  useEffect(() => {
    if (!email) { setError(null); return; }
    if (email.length < 4) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success && /@/.test(email)) {
      setError(parsed.error.issues[0]?.message ?? null);
    } else {
      setError(null);
    }
  }, [email]);

  const doInsert = async (payload: Record<string, unknown>) => {
    let attempt = await insertWithTimeout(payload);
    // Retry once on network/timeout failures (not on duplicate / logical errors)
    const err = attempt.error;
    const retriable =
      !!err &&
      err.code !== "23505" &&
      /network|fetch|timeout|abort/i.test(err.message ?? "");
    if (retriable) {
      await new Promise((r) => setTimeout(r, 600));
      attempt = await insertWithTimeout(payload);
    }
    return attempt;
  };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submittingRef.current || status === "loading") return;

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid email.";
      setError(msg);
      toast.error(msg);
      inputRef.current?.focus();
      return;
    }
    const normalized = parsed.data;

    submittingRef.current = true;
    setStatus("loading");
    setError(null);

    const safeSource = source.replace(/[^a-z0-9_.:-]/gi, "_").slice(0, 80) || "site";
    const path = typeof window !== "undefined" ? window.location.pathname : null;

    try {
      const { error: insertError } = await doInsert({
        email: normalized,
        source: safeSource,
        source_page: path,
        device: deviceType(),
        country: currentRegion() === "india" ? "IN" : "INTL",
        status: "subscribed",
      });

      const isDuplicate =
        !!insertError &&
        (insertError.code === "23505" ||
          (insertError.message ?? "").toLowerCase().includes("duplicate"));

      if (insertError && !isDuplicate) {
        const msg = friendlyError(insertError.message);
        setError(msg);
        toast.error(msg);
        if (trackedRef.current !== `fail:${normalized}`) {
          trackedRef.current = `fail:${normalized}`;
          void trackEvent("newsletter_failed", {
            metadata: { source: safeSource, reason: insertError.code ?? "unknown" },
          });
        }
        setStatus("idle");
        return;
      }

      // Success (new or already-subscribed)
      setEmail("");
      setStatus("success");
      setSuccessPulse(true);
      window.setTimeout(() => setSuccessPulse(false), 1400);
      toast.success(isDuplicate ? "You're already subscribed. 🎉" : "Subscribed! Watch your inbox.");
      inputRef.current?.blur();

      const key = `ok:${normalized}:${isDuplicate ? "dup" : "new"}`;
      if (trackedRef.current !== key) {
        trackedRef.current = key;
        void trackEvent("newsletter_subscribed", {
          metadata: { source: safeSource, duplicate: isDuplicate },
        });
      }
    } catch (err) {
      const msg = friendlyError(err);
      setError(msg);
      toast.error(msg);
      setStatus("idle");
    } finally {
      submittingRef.current = false;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      (e.currentTarget as HTMLInputElement).blur();
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="max-w-md mx-auto flex items-center justify-center gap-3 px-6 py-4 rounded-full border border-accent/40 bg-accent/10 text-sm"
      >
        <Check className="size-4 text-accent shrink-0" />
        <span className="truncate">You're in. Watch your inbox.</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form
        className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full"
        onSubmit={submit}
        noValidate
      >
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          ref={inputRef}
          id="newsletter-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value.replace(/\s+/g, "").toLowerCase())}
          onKeyDown={onKeyDown}
          placeholder="Email address"
          maxLength={255}
          aria-invalid={!!error}
          aria-describedby={error ? "newsletter-error" : undefined}
          disabled={status === "loading"}
          className="flex-1 min-w-0 w-full bg-card/50 border border-border rounded-full px-5 sm:px-6 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60 truncate"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          aria-busy={status === "loading"}
          className={`bg-accent text-accent-foreground font-bold px-6 sm:px-8 py-3 rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shrink-0 ${
            successPulse ? "ring-2 ring-accent/60 scale-[1.02]" : ""
          }`}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              <span>Subscribing…</span>
            </>
          ) : (
            "Subscribe"
          )}
        </button>
      </form>
      <p
        id="newsletter-error"
        role={error ? "alert" : undefined}
        aria-live="polite"
        className={`mt-2 text-center text-xs text-destructive min-h-[1rem] ${error ? "" : "opacity-0"}`}
      >
        {error ?? " "}
      </p>
    </div>
  );
}
