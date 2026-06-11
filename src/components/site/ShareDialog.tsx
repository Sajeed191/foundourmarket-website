import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Send, Facebook, Mail, Link2, Twitter, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { onOpenShareDialog, copyToClipboard, type ShareData } from "@/lib/share";

type Channel = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: (d: ShareData) => string;
};

const CHANNELS: Channel[] = [
  {
    label: "WhatsApp",
    icon: MessageCircle,
    href: (d) =>
      `https://wa.me/?text=${encodeURIComponent(`${d.title ? d.title + " — " : ""}${d.url}`)}`,
  },
  {
    label: "Telegram",
    icon: Send,
    href: (d) =>
      `https://t.me/share/url?url=${encodeURIComponent(d.url)}&text=${encodeURIComponent(d.title ?? "")}`,
  },
  {
    label: "Facebook",
    icon: Facebook,
    href: (d) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(d.url)}`,
  },
  {
    label: "X",
    icon: Twitter,
    href: (d) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(d.url)}&text=${encodeURIComponent(d.title ?? "")}`,
  },
  {
    label: "Email",
    icon: Mail,
    href: (d) =>
      `mailto:?subject=${encodeURIComponent(d.title ?? "Check this out")}&body=${encodeURIComponent(`${d.text ? d.text + "\n\n" : ""}${d.url}`)}`,
  },
];

export function ShareDialog() {
  const [data, setData] = useState<ShareData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => onOpenShareDialog((d) => {
    setCopied(false);
    setData(d);
  }), []);

  const open = data !== null;

  const handleCopy = async () => {
    if (!data) return;
    const ok = await copyToClipboard(data.url);
    if (ok) {
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setData(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
          <DialogDescription className="truncate">
            {data?.title ?? "Share this link"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-2">
          {data &&
            CHANNELS.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.label}
                  href={c.href(data)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setData(null)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card/40 py-3 transition-colors hover:bg-accent/10 hover:border-accent/40"
                >
                  <Icon className="size-5 text-accent" />
                  <span className="text-[11px] font-medium text-muted-foreground">{c.label}</span>
                </a>
              );
            })}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 p-2">
          <span className="flex-1 truncate px-2 text-xs text-muted-foreground">{data?.url}</span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-opacity hover:opacity-90"
          >
            {copied ? <Check className="size-3.5" /> : <Link2 className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
