import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

type ProfileMap = Record<string, { full_name: string | null; avatar_url: string | null }>;

export function ProductReviews({ productSlug, onAggregateChange }: { productSlug: string; onAggregateChange?: () => void }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("product_reviews")
      .select("id, user_id, rating, title, body, created_at")
      .eq("product_slug", productSlug)
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Review[];
    setReviews(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", ids);
      const map: ProfileMap = {};
      (profs ?? []).forEach((p: any) => { map[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url }; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

  const existing = user ? reviews.find((r) => r.user_id === user.id) : null;

  useEffect(() => {
    if (existing) {
      setRating(existing.rating);
      setTitle(existing.title ?? "");
      setBody(existing.body ?? "");
    }
  }, [existing?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      product_slug: productSlug,
      user_id: user.id,
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
    };
    const { error: err } = await supabase
      .from("product_reviews")
      .upsert(payload, { onConflict: "product_slug,user_id" });
    setSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    await load();
    onAggregateChange?.();
  };

  const remove = async () => {
    if (!existing) return;
    setSubmitting(true);
    const { error: err } = await supabase.from("product_reviews").delete().eq("id", existing.id);
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setTitle(""); setBody(""); setRating(5);
    await load();
    onAggregateChange?.();
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 border-t border-border">
      <h2 className="text-2xl font-display tracking-tight mb-8">Customer Reviews</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1">
          {user ? (
            <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-display mb-4">{existing ? "Update your review" : "Write a review"}</h3>
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  const active = (hoverRating || rating) >= value;
                  return (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                      className="p-1"
                    >
                      <Star className={`size-5 ${active ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                placeholder="Title (optional)"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-accent"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Share your thoughts…"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:border-accent"
              />
              {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 rounded-full text-xs uppercase tracking-widest font-bold bg-accent text-accent-foreground hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : existing ? "Update" : "Submit"}
                </button>
                {existing && (
                  <button
                    type="button"
                    onClick={remove}
                    disabled={submitting}
                    className="px-4 py-2 rounded-full text-xs uppercase tracking-widest border border-border hover:bg-white/5"
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="text-sm text-muted-foreground mb-4">Sign in to leave a review.</p>
              <Link to="/auth" className="inline-block px-5 py-2 rounded-full text-xs uppercase tracking-widest font-bold bg-accent text-accent-foreground hover:brightness-110">
                Sign in
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="grid place-items-center py-16"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience.</p>
          ) : (
            <ul className="space-y-6">
              {reviews.map((r) => {
                const prof = profiles[r.user_id];
                const name = prof?.full_name || "Anonymous";
                return (
                  <li key={r.id} className="border-b border-border pb-6 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-8 rounded-full bg-muted overflow-hidden grid place-items-center text-xs font-mono">
                        {prof?.avatar_url ? <img src={prof.avatar_url} alt="" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-display">{name}</p>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                      ))}
                    </div>
                    {r.title && <p className="text-sm font-display mb-1">{r.title}</p>}
                    {r.body && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{r.body}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
