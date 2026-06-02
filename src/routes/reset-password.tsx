import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, ShieldCheck, Check, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — FoundOurMarket™" }] }),
  component: ResetPasswordPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

function ResetPasswordPage() {
  const nav = useNavigate();
  // ready = a recovery/auth session is present so updateUser can succeed.
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Supabase fires PASSWORD_RECOVERY once it parses the recovery token in the URL.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) setReady("ok");
    });
    // Fallback: a session may already be hydrated.
    const t = setTimeout(async () => {
      if (cancelled) return;
      const { data } = await supabase.auth.getSession();
      setReady((prev) => (prev === "ok" ? prev : data.session ? "ok" : "invalid"));
    }, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
      sub.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError("Password must be at least 8 characters.");
    if (pw !== pw2) return setError("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => nav({ to: "/account" }), 1400);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 py-10 overflow-hidden" style={{ background: "#050816" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-[600px] h-[50vh] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #FF7A00 0%, transparent 70%)", filter: "blur(110px)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 backdrop-blur-xl"
      >
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] mb-2" style={{ color: "#FF9F43" }}>
          FoundOurMarket™
        </p>
        <h1 className="text-xl font-display font-semibold text-white mb-1.5">Set a new password</h1>
        <p className="text-sm text-white/55 mb-6">Choose a strong password for your account.</p>

        {ready === "checking" && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="size-4 animate-spin" /> Verifying your reset link…
          </div>
        )}

        {ready === "invalid" && (
          <div className="text-sm text-white/70">
            <div className="flex items-center gap-2 mb-3 text-amber-300">
              <AlertTriangle className="size-4" /> This reset link is invalid or has expired.
            </div>
            <Link to="/auth" className="inline-flex px-5 py-2.5 rounded-full text-sm font-semibold text-black"
              style={{ background: "linear-gradient(135deg, #FF7A00, #FF9F43)" }}>
              Back to sign in
            </Link>
          </div>
        )}

        {ready === "ok" && !done && (
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block">
              <span className="sr-only">New password</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3">
                <Lock className="size-4 text-white/40" />
                <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                  placeholder="New password" autoComplete="new-password"
                  className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/35 outline-none" />
              </div>
            </label>
            <label className="block">
              <span className="sr-only">Confirm password</span>
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3">
                <Lock className="size-4 text-white/40" />
                <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
                  placeholder="Confirm password" autoComplete="new-password"
                  className="w-full bg-transparent py-3 text-sm text-white placeholder:text-white/35 outline-none" />
              </div>
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={busy}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-black disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #FF7A00, #FF9F43)" }}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              Update password
            </button>
          </form>
        )}

        {done && (
          <div className="flex items-center gap-2 text-sm text-white">
            <span className="size-7 rounded-full grid place-items-center" style={{ background: "#FF7A00" }}>
              <Check className="size-4 text-black" strokeWidth={3} />
            </span>
            Password updated. Redirecting…
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3 text-white/40" />
          <p className="text-[10px] text-white/40 tracking-wide">Protected · Secure · Encrypted</p>
        </div>
      </motion.div>
    </div>
  );
}
