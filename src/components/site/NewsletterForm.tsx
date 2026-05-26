import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check } from "lucide-react";

export function NewsletterForm({ source = "homepage" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.length > 255) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    setStatus("loading");
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: trimmed, source });
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
      return;
    }
    setStatus("done");
    setMessage("You're in. Watch your inbox.");
    setEmail("");
  };

  if (status === "done") {
    return (
      <div className="max-w-md mx-auto flex items-center justify-center gap-3 px-6 py-4 rounded-full border border-accent/40 bg-accent/10 text-sm">
        <Check className="size-4 text-accent" /> {message}
      </div>
    );
  }

  return (
    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={submit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        maxLength={255}
        className="flex-1 bg-black/40 border border-border rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-accent text-accent-foreground font-bold px-8 py-3 rounded-full text-xs uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2"
      >
        {status === "loading" ? <Loader2 className="size-4 animate-spin" /> : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="sm:absolute sm:-bottom-7 sm:left-0 sm:right-0 text-center text-xs text-destructive">{message}</p>
      )}
    </form>
  );
}
