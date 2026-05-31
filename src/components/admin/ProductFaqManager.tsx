import { useEffect, useState } from "react";
import { GripVertical, Loader2, Plus, Trash2, Eye, EyeOff, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  setFaqActive,
  reorderFaqs,
  type ProductFaq,
} from "@/lib/product-faqs";

/**
 * Admin-only FAQ manager embedded in the product editor. Lets staff add,
 * edit, delete, reorder (drag-and-drop) and toggle visibility of a product's
 * FAQs. Every write is enforced server-side by RLS (admin/super_admin/manager).
 */
export function ProductFaqManager({ productSlug }: { productSlug: string }) {
  const [faqs, setFaqs] = useState<ProductFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editA, setEditA] = useState("");

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setFaqs(await fetchAllFaqs(productSlug));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load FAQs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

  async function handleAdd() {
    const q = newQ.trim();
    const a = newA.trim();
    if (!q) return toast.error("Question is required.");
    if (!a) return toast.error("Answer is required.");
    if (faqs.some((f) => f.question.trim().toLowerCase() === q.toLowerCase())) {
      return toast.error("This product already has that question.");
    }
    setBusy(true);
    try {
      const created = await createFaq({
        productSlug,
        question: q,
        answer: a,
        sortOrder: faqs.length,
      });
      setFaqs((prev) => [...prev, created]);
      setNewQ("");
      setNewA("");
      toast.success("FAQ added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add FAQ.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(f: ProductFaq) {
    setEditId(f.id);
    setEditQ(f.question);
    setEditA(f.answer);
  }

  async function saveEdit(id: string) {
    const q = editQ.trim();
    const a = editA.trim();
    if (!q) return toast.error("Question is required.");
    if (!a) return toast.error("Answer is required.");
    if (faqs.some((f) => f.id !== id && f.question.trim().toLowerCase() === q.toLowerCase())) {
      return toast.error("This product already has that question.");
    }
    setBusy(true);
    try {
      await updateFaq(id, { question: q, answer: a });
      setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, question: q, answer: a } : f)));
      setEditId(null);
      toast.success("FAQ updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update FAQ.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(f: ProductFaq) {
    setBusy(true);
    const next = !f.isActive;
    setFaqs((prev) => prev.map((x) => (x.id === f.id ? { ...x, isActive: next } : x)));
    try {
      await setFaqActive(f.id, next);
      toast.success(next ? "FAQ visible to customers" : "FAQ hidden");
    } catch (e) {
      setFaqs((prev) => prev.map((x) => (x.id === f.id ? { ...x, isActive: f.isActive } : x)));
      toast.error(e instanceof Error ? e.message : "Failed to update visibility.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    const prev = faqs;
    setFaqs((p) => p.filter((f) => f.id !== id));
    try {
      await deleteFaq(id);
      toast.success("FAQ deleted");
    } catch (e) {
      setFaqs(prev);
      toast.error(e instanceof Error ? e.message : "Failed to delete FAQ.");
    } finally {
      setBusy(false);
    }
  }

  async function commitOrder(next: ProductFaq[]) {
    const prev = faqs;
    setFaqs(next);
    try {
      await reorderFaqs(next.map((f) => f.id));
    } catch (e) {
      setFaqs(prev);
      toast.error(e instanceof Error ? e.message : "Failed to reorder FAQs.");
    }
  }

  function onDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...faqs];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    setDragIndex(null);
    void commitOrder(next);
  }

  const inputCls =
    "w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/40";

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" /> Loading FAQs…
        </p>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
          <button type="button" onClick={() => void load()} className="ml-2 underline">
            Retry
          </button>
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No FAQs yet — add the first one below.</p>
      ) : (
        <ul className="space-y-2">
          {faqs.map((f, i) => (
            <li
              key={f.id}
              draggable={editId === null}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className={`rounded-xl border p-3 ${dragIndex === i ? "border-accent/50 bg-accent/[0.04]" : "border-white/10 bg-white/[0.02]"}`}
            >
              {editId === f.id ? (
                <div className="space-y-2">
                  <input value={editQ} onChange={(e) => setEditQ(e.target.value)} placeholder="Question" className={inputCls} />
                  <textarea value={editA} onChange={(e) => setEditA(e.target.value)} placeholder="Answer" rows={3} className={inputCls} />
                  <div className="flex gap-2">
                    <button type="button" disabled={busy} onClick={() => void saveEdit(f.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-xs disabled:opacity-50">
                      <Check className="size-3.5" /> Save
                    </button>
                    <button type="button" onClick={() => setEditId(null)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                      <X className="size-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 cursor-grab text-muted-foreground/60" title="Drag to reorder">
                    <GripVertical className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium break-words ${f.isActive ? "" : "text-muted-foreground line-through"}`}>{f.question}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">{f.answer}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" disabled={busy} onClick={() => void toggleActive(f)} title={f.isActive ? "Hide from customers" : "Show to customers"} className="size-7 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-accent disabled:opacity-50">
                      {f.isActive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    </button>
                    <button type="button" onClick={() => startEdit(f)} title="Edit" className="size-7 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-accent">
                      <Pencil className="size-3.5" />
                    </button>
                    <button type="button" disabled={busy} onClick={() => void remove(f.id)} title="Delete" className="size-7 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground hover:text-destructive disabled:opacity-50">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
        <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Add FAQ</p>
        <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Question" className={inputCls} />
        <textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="Answer" rows={3} className={inputCls} />
        <button type="button" disabled={busy} onClick={() => void handleAdd()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-accent to-primary text-accent-foreground text-xs font-medium disabled:opacity-50">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add FAQ
        </button>
      </div>
    </div>
  );
}
