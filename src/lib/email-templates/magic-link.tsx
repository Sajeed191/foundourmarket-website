import * as React from 'react'
import { EmailShell } from './_ui'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <EmailShell
    preview={`Your login link for ${siteName}`}
    badge="Sign In"
    heading="Your secure sign-in link"
    intro={`Tap the button below to sign in to ${siteName}. For your protection, this link is single-use and expires shortly.`}
    actionUrl={confirmationUrl}
    actionLabel="Sign in securely"
    showLinkFallback
    note="If you didn't request this link, you can safely ignore this email — no changes will be made."
  />
)

export default MagicLinkEmail
