import * as React from 'react'
import { Callout, EmailShell } from './_ui'
import type { TemplateEntry } from './registry'

interface TestEmailProps {
  message?: string
  sentBy?: string
}

export function TestEmail({ message, sentBy }: TestEmailProps) {
  const body =
    message?.trim() ||
    'This is a test email from FoundOurMarket™. If it landed in your inbox, your branded sender domain is configured correctly and ready to deliver real transactional emails.'

  return (
    <EmailShell
      preview="FoundOurMarket™ — test email delivery confirmed"
      badge="Test Delivery"
      badgeTone="success"
      heading="Your email system is live."
      intro={body}
      note={sentBy ? `Triggered by ${sentBy} · Sent from FoundOurMarket™ admin` : undefined}
    >
      <Callout tone="accent" title="Authenticated">
        Delivered via your verified sender domain with SPF, DKIM &amp; DMARC managed
        automatically for high deliverability.
      </Callout>
    </EmailShell>
  )
}

export const template = {
  component: TestEmail,
  subject: 'FoundOurMarket™ — Test email delivery ✦',
  displayName: 'Admin test email',
  previewData: {
    message:
      'This is a test email from FoundOurMarket™. If it landed in your inbox, your branded sender domain is configured correctly.',
    sentBy: 'admin@foundourmarket.com',
  },
} satisfies TemplateEntry
