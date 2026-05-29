import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  ImagePlus,
  Loader2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Star,
  X,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Product, ProductImage } from "@/lib/products";
import { fetchProductImages } from "@/lib/products";
import { adminUpdateProduct } from "@/lib/admin-products.functions";
import { invalidateProducts } from "@/lib/use-products";

const BUCKET = "product-images";
const MAX_MB = 8;

/**
 * Admin-only gallery manager. Rendered behind a useIsProductAdmin gate.
 * Uploads go straight to the admin-gated `product-images` storage bucket and
 * the admin-gated `product_images` table (RLS enforces admin on both).
 */
export function AdminImageManager({
  product,
  images,
  onChanged,
}: {
  product: Product;
  images: ProductImage[];
  onChanged: (next: ProductImage[]) => void;
}) {
  const update = useServerFn(adminUpdateProduct);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const next = await fetchProductImages(product.slug);
    onChanged(next);
    await invalidateProducts();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      let order = images.length;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${MAX_MB}MB`);
          continue;
        }
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${product.slug}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw new Error(upErr.message);

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: insErr } = await supabase.from("product_images").insert({
          product_slug: product.slug,
          url: pub.publicUrl,
          alt: product.name,
          sort_order: order++,
        });
        if (insErr) throw new Error(insErr.message);
      }
      await refresh();
      toast.success("Images uploaded");
    } catch (e) {
      toast.error("Upload failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(img: ProductImage) {
    setBusy(true);
    try {
      const { error } = await supabase.from("product_images").delete().eq("id", img.id);
      if (error) throw new Error(error.message);
      await refresh();
      toast.success("Image removed");
    } catch (e) {
      toast.error("Remove failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= images.length) return;
    const reordered = [...images];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBusy(true);
    try {
      await Promise.all(
        reordered.map((img, i) =>
          supabase.from("product_images").update({ sort_order: i }).eq("id", img.id),
        ),
      );
      await refresh();
    } catch (e) {
      toast.error("Reorder failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function setCover(img: ProductImage) {
    setBusy(true);
    try {
      await update({ data: { slug: product.slug, image: img.url } });
      await invalidateProducts();
      toast.success("Cover image updated");
    } catch (e) {
      toast.error("Update failed", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 rounded-full border border-accent/40 bg-background/70 px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-accent backdrop-blur-xl shadow-[0_8px_30px_-8px_oklch(0.74_0.19_49/0.5)] transition-all hover:bg-accent/10"
      >
        <ImagePlus className="size-3.5" /> Edit images ({images.length})
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-accent/20 bg-background/95 p-5 backdrop-blur-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                    <ImageIcon className="size-4" />
                  </span>
                  <div>
                    <h2 className="font-display font-semibold leading-tight">Image manager</h2>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      {product.slug}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="grid size-8 place-items-center rounded-full border border-white/10 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Button
                className="mb-4 w-full"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                Upload images
              </Button>

              {images.length === 0 ? (
                <p className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-xs text-muted-foreground">
                  No gallery images yet. Upload to build the gallery.
                </p>
              ) : (
                <div className="space-y-2">
                  {images.map((img, i) => {
                    const isCover = img.url === product.image;
                    return (
                      <div
                        key={img.id}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2"
                      >
                        <img
                          src={img.url}
                          alt={img.alt || product.name}
                          className="size-14 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs text-foreground">{img.alt || "—"}</p>
                          {isCover && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-accent">
                              <Star className="size-2.5 fill-accent" /> Cover
                            </span>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <IconBtn label="Move up" disabled={busy || i === 0} onClick={() => move(i, -1)}>
                            <ArrowUp className="size-3.5" />
                          </IconBtn>
                          <IconBtn
                            label="Move down"
                            disabled={busy || i === images.length - 1}
                            onClick={() => move(i, 1)}
                          >
                            <ArrowDown className="size-3.5" />
                          </IconBtn>
                          <IconBtn
                            label="Set as cover"
                            disabled={busy || isCover}
                            onClick={() => setCover(img)}
                          >
                            <Star className={cn("size-3.5", isCover && "fill-accent text-accent")} />
                          </IconBtn>
                          <IconBtn label="Delete" disabled={busy} onClick={() => remove(img)} danger>
                            <Trash2 className="size-3.5" />
                          </IconBtn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-7 place-items-center rounded-md border border-white/10 text-muted-foreground transition-all disabled:opacity-30",
        danger ? "hover:border-destructive/50 hover:text-destructive" : "hover:border-accent/40 hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}
