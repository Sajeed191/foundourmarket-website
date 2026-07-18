import * as React from 'react'
import { EmailShell } from './_ui'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  confirmationUrl,
}: InviteEmailProps) => (
  <EmailShell
    preview={`You've been invited to join ${siteName}`}
    badge="You're Invited"
    heading={`You've been invited to ${siteName}`}
    intro={`Accept the invitation to create your account and unlock access to curated products, exclusive drops, and members-only pricing.`}
    actionUrl={confirmationUrl}
    actionLabel="Accept invitation"
    showLinkFallback
    note="If you weren't expecting this invitation, you can safely ignore this email."
  />
)

export default InviteEmail
