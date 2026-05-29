import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware'
import { supabaseAdmin } from '@/integrations/supabase/client.server'
import { enqueueOrderEmail, type OrderEmailEvent } from '@/lib/order-emails.server'

const STAFF_ROLES = ['admin', 'super_admin', 'manager', 'warehouse_staff', 'support']

async function assertStaff(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
  if (error) throw new Error('Could not verify permissions.')
  const roles = (data ?? []).map((r) => r.role as string)
  if (!roles.some((r) => STAFF_ROLES.includes(r))) {
    throw new Error('You are not authorised to trigger order emails.')
  }
}

const inputSchema = z.object({
  orderId: z.string().uuid(),
  event: z.enum(['order-shipped', 'out-for-delivery', 'order-delivered']),
})

/** Admin/staff — send a shipment-stage order email for a real fulfilment event. */
export const sendOrderEventEmail = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string }
    await assertStaff(userId)
    return enqueueOrderEmail(data.orderId, data.event as OrderEmailEvent)
  })
