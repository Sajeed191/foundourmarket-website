// FoundOurMarket™ — Email Sender Governance (server-only enforcement & audit)
//
// Wraps the client-safe policy with audit logging into `security_audit_log`.
// Import only from server code (.server.ts / *.functions.ts handlers).
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import {
  assertApprovedSender,
  isApprovedSender,
  senderTier,
  extractEmail,
} from '@/lib/email-sender-policy'

interface SenderAuditMeta {
  recipient?: string | null
  template?: string | null
  context?: string | null
  userId?: string | null
}

/** Write a row to the security audit log. Never throws. */
async function audit(
  action: string,
  category: string,
  meta: Record<string, unknown>,
  userId?: string | null,
) {
  try {
    await supabaseAdmin.from('security_audit_log').insert({
      user_id: userId ?? null,
      action,
      category,
      metadata: meta as never,
    })
  } catch (err) {
    console.error('[email-sender-policy] audit insert failed', String(err))
  }
}

/**
 * Enforce the sender policy before a send. Returns the validated `from` string.
 * On violation: logs a security audit event AND throws so the send is blocked.
 */
export async function enforceSender(from: string, meta: SenderAuditMeta = {}): Promise<string> {
  if (!isApprovedSender(from)) {
    await audit(
      'email.sender.violation',
      'security',
      {
        attempted_sender: from,
        attempted_email: extractEmail(from),
        recipient: meta.recipient ?? null,
        template: meta.template ?? null,
        context: meta.context ?? null,
        reason: 'unapproved_sender',
      },
      meta.userId,
    )
    return assertApprovedSender(from) // throws
  }
  return from
}

/** Record which approved sender (primary vs secondary) was used for a send. */
export async function recordSenderUsage(
  from: string,
  meta: SenderAuditMeta & { status?: string; fallbackReason?: string } = {},
): Promise<void> {
  const tier = senderTier(from)
  // Only log secondary/fallback usage as an audit event (primary is the norm).
  if (tier === 'secondary') {
    await audit(
      'email.sender.fallback_used',
      'email',
      {
        sender: from,
        tier,
        recipient: meta.recipient ?? null,
        template: meta.template ?? null,
        context: meta.context ?? null,
        status: meta.status ?? null,
        fallback_reason: meta.fallbackReason ?? null,
      },
      meta.userId,
    )
  }
}
