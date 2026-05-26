import { createFileRoute, Link } from "@tanstack/react-router";
import { useNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/account/notifications")({
  head: () => ({ meta: [{ title: "Notifications — FoundOurMarket™" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { items, unread, markRead, markAllRead, loading } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent">Account</p>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold mt-1">Notifications</h1>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs font-mono uppercase tracking-widest text-accent hover:underline">
            Mark all read
          </button>
        )}
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
          {items.map(n => {
            const body = (
              <div className={`p-4 hover:bg-white/5 transition-colors ${!n.read_at ? "bg-accent/5" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium">{n.title}</p>
                  <span className="text-[10px] font-mono text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                </div>
                {n.body && <p className="text-sm text-muted-foreground mt-1">{n.body}</p>}
              </div>
            );
            return (
              <li key={n.id} onClick={() => !n.read_at && markRead(n.id)}>
                {n.link ? <Link to={n.link}>{body}</Link> : body}
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-6">
        <Link to="/account" className="text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">← Back to account</Link>
      </div>
    </div>
  );
}
