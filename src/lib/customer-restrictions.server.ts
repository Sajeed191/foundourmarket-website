import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Operation = "order" | "cart" | "wishlist" | "review" | "account" | "payment";

export async function customerRestrictionMessage(userId: string, operation: Operation): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("account_status,ordering_blocked,reviews_disabled")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error("Could not verify account status.");
  if (!data) return null;

  if (data.account_status === "suspended") return "Your account is temporarily suspended. Please contact support.";
  if (data.account_status === "banned" || data.account_status === "deleted") return "Your account has been restricted. Contact support for assistance.";
  if (["order", "cart", "payment"].includes(operation) && data.ordering_blocked) return "Ordering is currently disabled for your account. Please contact support.";
  if (operation === "review" && data.reviews_disabled) return "Review functionality is disabled for your account.";
  return null;
}

export async function assertCustomerAllowed(userId: string, operation: Operation): Promise<void> {
  const message = await customerRestrictionMessage(userId, operation);
  if (message) throw new Error(message);
}