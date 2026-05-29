import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { enqueueSupportEmail, type SupportEvent } from '@/lib/support-emails.server'

const STAFF_ROLES = ['admin', 'super_admin', 'manager', 'support']

const inputSchema = z.object({
  ticketId: z.string().uuid(),
  event: z.enum(['created', 'customer_reply', 'staff_reply', 'resolved', 'closed']),
})

/**
 * Trigger branded transactional support emails for a real ticket event.
 * Authorisation is enforced server-side: customers may only trigger events
 * for their own tickets; staff-only events require a staff role.
 */
export const notifySupportEvent = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string }

    const { data: ticket, error } = await supabaseAdmin
      .from('support_tickets')
      .select('id, user_id')
      .eq('id', data.ticketId)
      .maybeSingle()
    if (error || !ticket) throw new Error('Ticket not found.')

    const isOwner = ticket.user_id === userId
    let isStaff = false
    if (!isOwner) {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
      isStaff = (roles ?? []).some((r) => STAFF_ROLES.includes(r.role as string))
    } else {
      const { data: roles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
      isStaff = (roles ?? []).some((r) => STAFF_ROLES.includes(r.role as string))
    }

    const ev = data.event as SupportEvent
    // Customer may trigger created + customer_reply on their own ticket.
    const customerEvents = ['created', 'customer_reply']
    // Staff may trigger staff_reply, resolved, closed.
    const staffEvents = ['staff_reply', 'resolved', 'closed']

    if (customerEvents.includes(ev) && !isOwner && !isStaff) {
      throw new Error('Not authorised for this ticket.')
    }
    if (staffEvents.includes(ev) && !isStaff) {
      throw new Error('Staff access required.')
    }

    return enqueueSupportEmail(data.ticketId, ev)
  })
