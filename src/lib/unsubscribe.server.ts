// Server-only: manages one-click unsubscribe tokens for email footers.
// Never import from client code (uses the service-role admin client).
import { randomBytes } from 'node:crypto'
import { supabaseAdmin } from '@/integrations/supabase/client.server'

// Public base used to build unsubscribe links inside emails.
const PUBLIC_BASE = 'https://foundourmarket.com'

function generateToken(): string {
  return randomBytes(24).toString('base64url')
}

/**
 * Return a stable unsubscribe token for an email address, creating one if
 * needed. There is at most one token per address (the table is keyed on email).
 */
export async function getOrCreateUnsubscribeToken(
  rawEmail: string,
): Promise<string | null> {
  const email = rawEmail.trim().toLowerCase()
  if (!email) return null

  // Reuse an existing token when present.
  const { data: existing } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .select('token')
    .eq('email', email)
    .maybeSingle()

  if (existing?.token) return existing.token

  const token = generateToken()
  const { error } = await supabaseAdmin
    .from('email_unsubscribe_tokens')
    .insert({ email, token })

  if (error) {
    // A concurrent insert may have created the token first — re-read.
    const { data: retry } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', email)
      .maybeSingle()
    return retry?.token ?? null
  }

  return token
}

export interface UnsubscribeLinks {
  /** Friendly browser-facing page the footer link points to. */
  pageUrl: string
  /** RFC 8058 one-click POST endpoint for the List-Unsubscribe header. */
  oneClickUrl: string
}

/**
 * Build the unsubscribe links for an email recipient. Returns null when a
 * token can't be issued (the email should still send, just without a link).
 */
export async function buildUnsubscribeLinks(
  email: string,
): Promise<UnsubscribeLinks | null> {
  const token = await getOrCreateUnsubscribeToken(email)
  if (!token) return null
  const q = encodeURIComponent(token)
  return {
    pageUrl: `${PUBLIC_BASE}/unsubscribe?token=${q}`,
    oneClickUrl: `${PUBLIC_BASE}/email/unsubscribe?token=${q}`,
  }
}
