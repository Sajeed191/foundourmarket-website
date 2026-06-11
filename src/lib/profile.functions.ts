import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  parsePhoneNumberFromString,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Validate a phone number (E.164 or empty) server-side. Mirrors the
 * client-side rule in account_.profile.tsx so invalid numbers are rejected
 * on the API even if the client check is bypassed.
 */
function validE164(value: string | null, cc: CountryCode | null): boolean {
  if (!value) return true; // optional
  const parsed = parsePhoneNumberFromString(value);
  if (parsed) return parsed.isValid();
  // Fallback when no country context is parseable from the value itself.
  if (cc) {
    const withCc = parsePhoneNumberFromString(value, cc);
    return !!withCc && withCc.isValid();
  }
  return false;
}

const ProfileSchema = z.object({
  full_name: z.string().trim().max(120).nullable(),
  phone: z.string().trim().max(20).nullable(),
  alt_phone: z.string().trim().max(20).nullable(),
  gender: z.string().trim().max(40).nullable(),
  birth_date: z.string().trim().max(10).nullable(),
  country: z.string().trim().max(80).nullable(),
  country_code: z.string().trim().length(2).nullable(),
  language: z.string().trim().max(40).nullable(),
  timezone: z.string().trim().max(60).nullable(),
  avatar_url: z.string().trim().max(2048).nullable(),
});

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => ProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const cc = (data.country_code?.toUpperCase() ?? null) as CountryCode | null;

    // Server-side phone validation — reject invalid numbers.
    if (!validE164(data.phone, cc)) {
      throw new Error("Enter a valid phone number");
    }
    if (!validE164(data.alt_phone, cc)) {
      throw new Error("Enter a valid alternate phone number");
    }

    // Re-derive country name from the validated country code to keep data clean.
    const country =
      cc && getCountryCallingCode(cc) ? data.country ?? null : data.country ?? null;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: userId,
        full_name: data.full_name,
        phone: data.phone,
        alt_phone: data.alt_phone,
        gender: data.gender,
        birth_date: data.birth_date,
        country,
        country_code: cc,
        language: data.language,
        timezone: data.timezone,
        avatar_url: data.avatar_url,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error(error.message);

    return { ok: true as const };
  });
