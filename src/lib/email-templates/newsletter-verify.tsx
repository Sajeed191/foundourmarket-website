import * as React from 'react'
import { EmailShell } from './_ui'
import type { TemplateEntry } from './registry'

export interface NewsletterVerifyProps {
  verifyUrl: string
  expiresInHours?: number
}

const NewsletterVerify: React.FC<NewsletterVerifyProps> = ({
  verifyUrl,
  expiresInHours = 24,
}) => (
  <EmailShell
    preview="Confirm your FoundOurMarket newsletter subscription"
    badge="Almost There"
    heading="Confirm your subscription"
    intro="Confirm you'd like updates from FoundOurMarket™ — new drops, exclusive deals, and curated finds delivered straight to your inbox."
    actionUrl={verifyUrl}
    actionLabel="Confirm subscription"
    showLinkFallback
    note={`This link expires in ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}. If you didn't request this, ignore this email.`}
  />
)

export const newsletterVerifyTemplate = {
  component: NewsletterVerify,
  subject: 'Confirm your FoundOurMarket subscription',
  displayName: 'Newsletter — Verify',
  previewData: {
    verifyUrl: 'https://foundourmarket.com/newsletter/verify?token=preview',
    expiresInHours: 24,
  },
} satisfies TemplateEntry
