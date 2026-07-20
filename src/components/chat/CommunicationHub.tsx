// Communication Hub — the single premium chooser between AI Shopping and
// Customer Support. Mounted alongside LiveChat in __root. Opens either when
// the user triggers `openHub()` (LiveChat orb tap without a remembered
// choice), or programmatically from a "Switch to..." button.
import { useEffect, useState } from "react";
import { Sparkles, Headset, X, ChevronRight } from "lucide-react";
import { onHubOpen, openAiAssistant, setLastHubChoice } from "@/lib/ai-shopping/events";
import { openCrispChat } from "@/lib/crisp";

export function CommunicationHub() {
  const [open, setOpen] = useState(false);

  useEffect(() => onHubOpen(() => setOpen(true)), []);

  // Body lock while sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const pickAi = () => {
    setLastHubChoice("ai");
    setOpen(false);
    openAiAssistant();
  };
  const pickSupport = () => {
    setLastHubChoice("support");
    setOpen(false);
    openCrispChat();
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="How can we help you today?"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 bg-card/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-bottom duration-300"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
      >
        {/* grabber */}
        <div className="mx-auto mt-2.5 mb-4 h-1 w-10 rounded-full bg-white/15" aria-hidden />

        <div className="flex items-start justify-between gap-3 px-5">
          <div className="min-w-0">
            <p className="font-display text-lg font-semibold leading-tight text-foreground">
              FoundOurMarket<span className="text-primary">™</span>
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">How can we help you today?</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-white/10 active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-2.5 px-4">
          <HubCard
            onClick={pickAi}
            icon={Sparkles}
            title="AI Shopping Assistant"
            subtitle="Find products, compare, get recommendations"
            cta="Start shopping"
            tone="primary"
          />
          <HubCard
            onClick={pickSupport}
            icon={Headset}
            title="Customer Support"
            subtitle="Orders, returns, refunds, delivery, account help"
            cta="Contact support"
            tone="neutral"
          />
        </div>

        <p className="mt-5 px-6 text-center text-[10px] uppercase tracking-widest text-muted-foreground/70">
          Secure · Private · Human when you need it
        </p>
      </div>
    </div>
  );
}

function HubCard({
  onClick,
  icon: Icon,
  title,
  subtitle,
  cta,
  tone,
}: {
  onClick: () => void;
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
  cta: string;
  tone: "primary" | "neutral";
}) {
  const iconWrap =
    tone === "primary"
      ? "bg-gradient-to-br from-primary/25 to-primary/10 text-primary ring-1 ring-primary/25"
      : "bg-white/[0.06] text-foreground/85 ring-1 ring-white/10";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-border/60 bg-card/60 p-4 text-left transition-all hover:border-primary/50 hover:bg-card active:scale-[0.99]"
    >
      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${iconWrap}`}>
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-tight text-foreground">{title}</span>
        <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">{subtitle}</span>
        <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-primary">
          {cta} <ChevronRight className="h-3 w-3" />
        </span>
      </span>
    </button>
  );
}
