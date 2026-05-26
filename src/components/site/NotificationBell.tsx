import { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useNotifications } from "@/lib/notifications";

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); return `${d}d`;
}

export function NotificationBell() {
  const { items, unread, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        className="relative size-9 rounded-full grid place-items-center hover:bg-white/5 transition-colors"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-accent text-accent-foreground text-[9px] font-bold font-mono grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-background">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-[10px] font-mono uppercase tracking-widest text-accent hover:underline inline-flex items-center gap-1">
                <Check className="size-3" /> Mark all
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">You're all caught up.</div>
          ) : (
            <ul>
              {items.map(n => {
                const inner = (
                  <div className={`px-4 py-3 border-b border-border/50 hover:bg-white/5 transition-colors ${!n.read_at ? "bg-accent/5" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{timeAgo(n.created_at)}</span>
                    </div>
                    {n.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.body}</p>}
                  </div>
                );
                return (
                  <li key={n.id} onClick={() => { if (!n.read_at) markRead(n.id); setOpen(false); }}>
                    {n.link ? <Link to={n.link}>{inner}</Link> : inner}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="px-4 py-3 border-t border-border sticky bottom-0 bg-background">
            <Link to="/account/notifications" onClick={() => setOpen(false)} className="text-[10px] font-mono uppercase tracking-widest text-accent hover:underline">
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
