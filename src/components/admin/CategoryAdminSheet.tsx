import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  X,
  Loader2,
  ArrowUp,
  ArrowDown,
  ImagePlus,
  Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/components/admin/AdminShell";
import { invalidateCategories, type Category } from "@/lib/use-categories";
import { cn } from "@/lib/utils";

type Row = Category;

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const blank = (): Partial<Row> => ({
  name: "",
  slug: "",
  description: null,
  image: null,
  sort_order: 0,
});

/**
 * Inline category CMS for admins — create / rename / re-image / reorder /
 * delete categories live. Image uploads go to the public `product-images`
 * bucket under a `categories/` prefix. All writes are RLS + admin-role gated.
 */
export function CategoryAdminSheet({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Partial<Row> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data, error } = await supabase
      .from("categories")
      .select("id,slug,name,description,image,sort_order")
      .order("sort_order");
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data as Row[]) ?? []);
  }
  useEffect(() => {
    void load();
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editing) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `categories/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "31536000", upsert: false });
    if (upErr) {
      setUploading(false);
      toast.error(upErr.message);
      return;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setEditing({ ...editing, image: data.publicUrl });
    setUploading(false);
    toast.success("Image uploaded");
  }

  async function save() {
    if (!editing?.name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const slug = editing.slug?.trim() || slugify(editing.name);
    const payload = {
      name: editing.name.trim(),
      slug,
      description: editing.description?.trim() || null,
      image: editing.image || null,
      sort_order: Number(editing.sort_order) || 0,
    };
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing.id ? "Category updated" : "Category created");
    logActivity(editing.id ? "category_update" : "category_create", "category", editing.id, { slug });
    setEditing(null);
    await load();
    invalidateCategories();
    onChanged();
  }

  async function reorder(row: Row, direction: "up" | "down") {
    const i = rows.findIndex((r) => r.id === row.id);
    const j = direction === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= rows.length) return;
    const other = rows[j];
    // optimistic
    setRows((prev) => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    const [a, b] = await Promise.all([
      supabase.from("categories").update({ sort_order: other.sort_order }).eq("id", row.id),
      supabase.from("categories").update({ sort_order: row.sort_order }).eq("id", other.id),
    ]);
    if (a.error || b.error) toast.error(a.error?.message ?? b.error?.message ?? "Reorder failed");
    await load();
    invalidateCategories();
    onChanged();
  }

  async function del(id: string) {
    if (!confirm("Delete this category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    logActivity("category_delete", "category", id);
    toast.success("Deleted");
    await load();
    invalidateCategories();
    onChanged();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 32, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border-t border-accent/20 bg-background/95 p-5 backdrop-blur-2xl sm:inset-y-0 sm:right-0 sm:left-auto sm:w-full sm:max-w-md sm:max-h-none sm:rounded-none sm:rounded-l-3xl sm:border-l sm:border-t-0"
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold leading-tight">Category CMS</h2>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Live · drag-free reorder · admin-only
              </p>
            </div>
            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          {!editing && (
            <>
              <button
                onClick={() => setEditing(blank())}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-accent-foreground"
              >
                <Plus className="size-3.5" /> New category
              </button>
              <ul className="space-y-2">
                {rows.map((r, i) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2.5"
                  >
                    <div className="flex shrink-0 flex-col">
                      <button
                        onClick={() => reorder(r, "up")}
                        disabled={i === 0}
                        className="grid size-5 place-items-center rounded text-muted-foreground/60 hover:text-accent disabled:opacity-20"
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        onClick={() => reorder(r, "down")}
                        disabled={i === rows.length - 1}
                        className="grid size-5 place-items-center rounded text-muted-foreground/60 hover:text-accent disabled:opacity-20"
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                    </div>
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
                      {r.image ? (
                        <img src={r.image} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="grid size-full place-items-center text-muted-foreground/40">
                          <Tag className="size-4" />
                        </div>
                      )}
                    </div>
                    <button onClick={() => setEditing(r)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm">{r.name}</p>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                        /{r.slug}
                      </p>
                    </button>
                    <button
                      onClick={() => del(r.id)}
                      className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 text-red-400 hover:bg-red-500/10"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
                {rows.length === 0 && (
                  <li className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                    No categories yet.
                  </li>
                )}
              </ul>
            </>
          )}

          {editing && (
            <div className="space-y-4">
              <div>
                <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Image
                </span>
                <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
                  {editing.image ? (
                    <img src={editing.image} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center text-muted-foreground/40">
                      <ImagePlus className="size-5" />
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 grid place-items-center bg-black/50">
                      <Loader2 className="size-5 animate-spin text-accent" />
                    </div>
                  )}
                  {editing.image && !uploading && (
                    <button
                      onClick={() => setEditing({ ...editing, image: null })}
                      className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-red-500/70"
                      aria-label="Remove image"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="mt-1.5 w-full rounded-lg border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:border-accent/40 hover:text-accent disabled:opacity-50"
                >
                  {editing.image ? "Replace image" : "Upload image"}
                </button>
              </div>

              <Field label="Name">
                <input
                  value={editing.name ?? ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      name: e.target.value,
                      // auto-fill slug only for new categories with empty slug
                      slug: !editing.id && !editing.slug ? slugify(e.target.value) : editing.slug,
                    })
                  }
                  className={input}
                  placeholder="Electronics"
                />
              </Field>

              <Field label="Slug (URL)">
                <input
                  value={editing.slug ?? ""}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                  className={input}
                  placeholder="electronics"
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                  className={input}
                  placeholder="Premium gadgets and gear"
                />
              </Field>

              <Field label="Sort order (lower = first)">
                <input
                  type="number"
                  value={editing.sort_order ?? 0}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                  className={input}
                />
              </Field>

              <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-white/10 bg-background/95 px-5 py-3">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-accent-foreground disabled:opacity-50"
                >
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {editing.id ? "Save changes" : "Create"}
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-full border border-white/10 px-4 py-2.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const input =
  "w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
