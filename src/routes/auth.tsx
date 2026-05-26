import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Lock, User } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — FoundOurMarket™" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  return (
    <div className="min-h-[80vh] grid place-items-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent mb-3">Account</p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {mode === "signin" ? "Sign in to continue shopping" : "Join the inner circle"}
          </p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
          {mode === "signup" && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input required placeholder="Full name" className="w-full bg-card border border-border rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input required type="email" placeholder="Email" className="w-full bg-card border border-border rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input required type="password" placeholder="Password" className="w-full bg-card border border-border rounded-full pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent" />
          </div>
          <button className="w-full bg-accent text-accent-foreground font-bold py-3 rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button className="w-full border border-border rounded-full py-3 text-xs uppercase tracking-widest font-medium hover:bg-white/5 transition-all">
          Continue with Google
        </button>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-accent hover:underline font-medium">
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
        <p className="text-center text-[10px] text-muted-foreground/60 mt-4 font-mono uppercase tracking-widest">
          Demo only — backend coming next
        </p>
        <p className="text-center mt-8">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to shop</Link>
        </p>
      </div>
    </div>
  );
}
