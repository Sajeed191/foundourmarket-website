// TEMPORARY self-test harness for Email-to-Ticket verification. DELETE AFTER USE.
import { createFileRoute } from '@tanstack/react-router'

const PREFIX = 'SELFTEST'

export const Route = createFileRoute('/api/public/support/__inbound-selftest')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url)
        if (url.searchParams.get('run') !== 'go') {
          return new Response(JSON.stringify({ ok: false, error: 'disabled' }), { status: 403 })
        }
        const { processInboundEmail } = await import('@/lib/support-inbound.server')
        const stamp = Date.now()
        const guest = `selftest+${stamp}@example.com`

        // Test 1 — New ticket from a never-seen address
        const t1 = await processInboundEmail({
          from: `Self Tester <${guest}>`,
          to: 'support@foundourmarket.com',
          subject: `${PREFIX} Order issue ${stamp}`,
          text: 'My order has not arrived yet, please help.',
          messageId: `<${PREFIX}-1-${stamp}@example.com>`,
        })

        // Test 2 — Reply threading to the ticket created in test 1
        const t2 = t1.ticketNumber
          ? await processInboundEmail({
              from: `Self Tester <${guest}>`,
              to: 'support@foundourmarket.com',
              subject: `Re: [${t1.ticketNumber}] Order issue`,
              text: 'Adding more detail to my previous message.',
              messageId: `<${PREFIX}-2-${stamp}@example.com>`,
              inReplyTo: `<${PREFIX}-1-${stamp}@example.com>`,
            })
          : { ok: false, status: 'error', reason: 'no_ticket_from_test1' }

        // Test 3 — Attachments (JPG, PNG, PDF). Tiny valid-ish payloads.
        const onePxPng =
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        const onePxJpg =
          '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
        const pdf =
          Buffer.from('%PDF-1.1\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF').toString('base64')
        const t3 = t1.ticketNumber
          ? await processInboundEmail({
              from: `Self Tester <${guest}>`,
              to: 'support@foundourmarket.com',
              subject: `Re: [${t1.ticketNumber}] with files`,
              text: 'Attaching screenshots and a receipt.',
              messageId: `<${PREFIX}-3-${stamp}@example.com>`,
              attachments: [
                { filename: 'shot.png', contentType: 'image/png', contentBase64: onePxPng },
                { filename: 'photo.jpg', contentType: 'image/jpeg', contentBase64: onePxJpg },
                { filename: 'receipt.pdf', contentType: 'application/pdf', contentBase64: pdf },
                { filename: 'evil.exe', contentType: 'application/octet-stream', contentBase64: pdf },
              ],
            })
          : { ok: false, status: 'error', reason: 'no_ticket_from_test1' }

        // Test 4 — Spam protection (empty, auto-responder, mail loop)
        const t4empty = await processInboundEmail({
          from: `Empty <empty+${stamp}@example.com>`,
          to: 'support@foundourmarket.com',
          subject: '',
          text: '',
          messageId: `<${PREFIX}-4a-${stamp}@example.com>`,
        })
        const t4auto = await processInboundEmail({
          from: `Vacation <vac+${stamp}@example.com>`,
          to: 'support@foundourmarket.com',
          subject: 'Out of office: Re: anything',
          text: 'I am away until next week.',
          headers: { 'Auto-Submitted': 'auto-replied' },
          messageId: `<${PREFIX}-4b-${stamp}@example.com>`,
        })
        const t4loop = await processInboundEmail({
          from: 'support@foundourmarket.com',
          to: 'support@foundourmarket.com',
          subject: 'Loop test',
          text: 'This should be rejected as a mail loop.',
          messageId: `<${PREFIX}-4c-${stamp}@example.com>`,
        })

        // Test 5 — Guest customer flow: second email from same guest links to same person
        const guest5 = `selftest-guest+${stamp}@example.com`
        const t5a = await processInboundEmail({
          from: `Guest Five <${guest5}>`,
          to: 'support@foundourmarket.com',
          subject: `${PREFIX} Guest question ${stamp}`,
          text: 'Do you ship internationally?',
          messageId: `<${PREFIX}-5a-${stamp}@example.com>`,
        })
        const t5b = await processInboundEmail({
          from: `Guest Five <${guest5}>`,
          to: 'support@foundourmarket.com',
          subject: `${PREFIX} Another guest question ${stamp}`,
          text: 'Also, what is your return window?',
          messageId: `<${PREFIX}-5b-${stamp}@example.com>`,
        })

        return new Response(
          JSON.stringify(
            {
              ok: true,
              stamp,
              guest,
              guest5,
              t1,
              t2,
              t3,
              t4: { empty: t4empty, auto: t4auto, loop: t4loop },
              t5: { first: t5a, second: t5b },
            },
            null,
            2,
          ),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
