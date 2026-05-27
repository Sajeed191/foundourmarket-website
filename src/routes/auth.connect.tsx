import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Shield,
  Sparkles,
  Truck,
  Headphones,
  Lock,
  UserCheck,
  ArrowRight,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/connect")({
  head: () => ({ meta: [{ title: "Connect Your Account — FoundOurMarket™" }] }),
  component: ConnectPage,
});

const ease = [0.16, 1, 0.3, 1] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const BENEFITS = [
  {
    icon: Sparkles,
    label: "Personalize your shopping experience",
    description: "Tailored recommendations & curated deals",
  },
  {
    icon: Truck,
    label: "Faster order tracking & refunds",
    description: "Real-time delivery updates & seamless returns",
  },
  {
    icon: Headphones,
    label: "Secure customer support access",
    description: "Priority help with your order history at hand",
  },
  {
    icon: Lock,
    label: "Safer account recovery",
    description: "Verified identity for password resets & access",
  },
];

function ConnectPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [allowing, setAllowing] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      nav({ to: "/auth" });
    }
  }, [loading, user, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-accent"
        >
          <Sparkles className="size-8" />
        </motion.div>
      </div>
    );
  }

  const handleAllow = async () => {
    if (allowing) return;
    setAllowing(true);
    try {
      // Mark onboarding as complete (could store in user metadata or profiles table)
      await supabase.auth.updateUser({
        data: { onboarding_completed: true },
      });
      toast.success("Account connected", {
        description: "Welcome to FoundOurMarket™",
      });
      nav({ to: "/account" });
    } catch {
      nav({ to: "/account" });
    }
  };

  const handleDecline = async () => {
    if (declining) return;
    setDeclining(true);
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-5 py-12 bg-background overflow-hidden">
      {/* Ambient background orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[90vw] max-w-[700px] h-[50vh] rounded-full opacity-30"
          style={{ background: "var(--gradient-ember-soft)", filter: "blur(100px)" }}
        />
        <div
          className="absolute bottom-[5%] right-[10%] w-[40vw] max-w-[400px] h-[30vh] rounded-full opacity-20"
          style={{ background: "var(--gradient-violet)", filter: "blur(80px)" }}
        />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative w-full max-w-md mx-auto"
      >
        {/* Close / skip */}
        <motion.div variants={itemVariants} className="absolute -top-2 right-0">
          <button
            onClick={handleDecline}
            className="size-9 grid place-items-center rounded-full glass hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Logo & Brand */}
        <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="size-20 sm:size-24 rounded-3xl overflow-hidden ring-1 ring-white/10 shadow-[var(--shadow-float)] bg-card grid place-items-center">
              <img
                src="/logo.jpeg"
                alt="FoundOurMarket"
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 20 }}
              className="absolute -bottom-1 -right-1 size-7 rounded-full bg-accent flex items-center justify-center shadow-[0_0_12px_oklch(0.74_0.19_49/0.5)]"
            >
              <Check className="size-4 text-accent-foreground" strokeWidth={3} />
            </motion.div>
          </div>
          <h2 className="text-[11px] font-mono uppercase tracking-[0.35em] text-accent mb-1.5">
            FoundOurMarket™
          </h2>
          <p className="text-[10px] text-muted-foreground tracking-wide opacity-70">
            Find It. Shop It. Love It.
          </p>
        </motion.div>

        {/* Title */}
        <motion.div variants={itemVariants} className="text-center mb-6">
          <h1 className="text-2xl sm:text-[28px] font-display font-semibold tracking-tight mb-2.5">
            Connect Your Account
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            Securely connect your account to personalize shopping, faster order tracking, refunds, and customer support.
          </p>
        </motion.div>

        {/* Benefits */}
        <motion.div variants={itemVariants} className="mb-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-3.5 text-center">
            FoundOurMarket uses this to
          </p>
          <div className="space-y-2.5">
            {BENEFITS.map(({ icon: Icon, label, description }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1, duration: 0.4, ease }}
                className="flex items-start gap-3 p-3 rounded-2xl glass group hover:border-accent/20 transition-colors"
              >
                <div className="shrink-0 size-8 rounded-xl bg-accent/10 text-accent grid place-items-center mt-0.5">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">{label}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex gap-3 mb-6">
          <button
            onClick={handleDecline}
            disabled={declining || allowing}
            className="flex-1 py-3.5 px-5 rounded-full glass border border-white/10 text-sm font-medium hover:bg-white/5 transition-all disabled:opacity-50"
          >
            {declining ? "Signing out…" : "Not now"}
          </button>
          <motion.button
            onClick={handleAllow}
            disabled={allowing || declining}
            whileTap={{ scale: 0.96 }}
            className="flex-[1.3] py-3.5 px-5 rounded-full bg-accent text-accent-foreground text-sm font-semibold shadow-[var(--shadow-ember)] hover:shadow-[0_0_30px_oklch(0.74_0.19_49/0.5)] hover:brightness-110 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {allowing ? (
              <>
                <span className="size-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                Connecting…
              </>
            ) : (
              <>
                Allow
                <ArrowRight className="size-4" />
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Trust reassurance */}
        <motion.div variants={itemVariants} className="flex items-center justify-center gap-2 mb-6">
          <Shield className="size-3 text-muted-foreground/60" />
          <span className="text-[10px] sm:text-[11px] text-muted-foreground/70 tracking-wide">
            Protected account · Secure sign in · Trusted support
          </span>
        </motion.div>

        {/* Signed-in account card */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 p-3.5 rounded-2xl glass border border-white/[0.06]">
            <div className="size-9 rounded-xl bg-secondary grid place-items-center shrink-0">
              <UserCheck className="size-4 text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
                Signed in as
              </p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <BadgeCheck />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer link */}
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <Link
            to="/help"
            className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-accent transition-colors"
          >
            Learn more about account security
            <ArrowRight className="size-3" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

function BadgeCheck() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[9px] font-mono uppercase tracking-wider ring-1 ring-emerald-500/30">
      <Check className="size-2.5" strokeWidth={3} />
      Verified
    </span>
  );
}
