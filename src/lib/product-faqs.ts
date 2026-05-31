import { supabase } from "@/integrations/supabase/client";

/**
 * Product FAQ data access. Reads are usable by anyone (RLS exposes only
 * active FAQs to non-admins); writes are admin-gated server-side by RLS
 * (admin / super_admin / manager). All failures are logged with the raw
 * Postgres error so production issues are diagnosable.
 */
export type ProductFaq = {
  id: string;
  productSlug: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
};

type Row = {
  id: string;
  product_slug: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const COLS = "id,product_slug,question,answer,sort_order,is_active";

const toFaq = (r: Row): ProductFaq => ({
  id: r.id,
  productSlug: r.product_slug,
  question: r.question,
  answer: r.answer,
  sortOrder: r.sort_order,
  isActive: r.is_active,
});

/** Customer-facing: only active FAQs for one product, in admin-defined order. */
export async function fetchActiveFaqs(slug: string): Promise<ProductFaq[]> {
  const { data, error } = await supabase
    .from("product_faqs")
    .select(COLS)
    .eq("product_slug", slug)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[product-faqs] fetchActiveFaqs failed", error);
    throw new Error(error.message);
  }
  return ((data as Row[] | null) ?? []).map(toFaq);
}

/** Admin: every FAQ (active + inactive) for one product, in display order. */
export async function fetchAllFaqs(slug: string): Promise<ProductFaq[]> {
  const { data, error } = await supabase
    .from("product_faqs")
    .select(COLS)
    .eq("product_slug", slug)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[product-faqs] fetchAllFaqs failed", error);
    throw new Error(error.message);
  }
  return ((data as Row[] | null) ?? []).map(toFaq);
}

function friendly(error: { code?: string; message: string }): Error {
  if (error.code === "23505") {
    return new Error("This product already has a FAQ with that question.");
  }
  return new Error(error.message);
}

/** Create a FAQ for a product. sort_order defaults to the end of the list. */
export async function createFaq(input: {
  productSlug: string;
  question: string;
  answer: string;
  sortOrder: number;
  isActive?: boolean;
}): Promise<ProductFaq> {
  const question = input.question.trim();
  const answer = input.answer.trim();
  if (!question) throw new Error("Question is required.");
  if (!answer) throw new Error("Answer is required.");

  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("product_faqs")
    .insert({
      product_slug: input.productSlug,
      question,
      answer,
      sort_order: input.sortOrder,
      is_active: input.isActive ?? true,
      created_by: userData.user?.id ?? null,
    })
    .select(COLS)
    .single();
  if (error) {
    console.error("[product-faqs] createFaq failed", error);
    throw friendly(error);
  }
  return toFaq(data as Row);
}

/** Update question/answer/active for one FAQ. */
export async function updateFaq(
  id: string,
  patch: { question?: string; answer?: string; isActive?: boolean },
): Promise<void> {
  const update: { question?: string; answer?: string; is_active?: boolean } = {};
  if (patch.question !== undefined) {
    const q = patch.question.trim();
    if (!q) throw new Error("Question is required.");
    update.question = q;
  }
  if (patch.answer !== undefined) {
    const a = patch.answer.trim();
    if (!a) throw new Error("Answer is required.");
    update.answer = a;
  }
  if (patch.isActive !== undefined) update.is_active = patch.isActive;
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase.from("product_faqs").update(update).eq("id", id);
  if (error) {
    console.error("[product-faqs] updateFaq failed", error);
    throw friendly(error);
  }
}

/** Activate / deactivate a FAQ (controls customer-side visibility). */
export async function setFaqActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("product_faqs").update({ is_active: isActive }).eq("id", id);
  if (error) {
    console.error("[product-faqs] setFaqActive failed", error);
    throw new Error(error.message);
  }
}

/** Delete a FAQ. */
export async function deleteFaq(id: string): Promise<void> {
  const { error } = await supabase.from("product_faqs").delete().eq("id", id);
  if (error) {
    console.error("[product-faqs] deleteFaq failed", error);
    throw new Error(error.message);
  }
}

/** Persist a new display order. Writes each row's sort_order sequentially. */
export async function reorderFaqs(orderedIds: string[]): Promise<void> {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("product_faqs").update({ sort_order: index }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[product-faqs] reorderFaqs failed", failed.error);
    throw new Error(failed.error.message);
  }
}
