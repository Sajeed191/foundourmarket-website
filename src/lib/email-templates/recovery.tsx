import * as React from 'react'
import { EmailShell } from './_ui'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <EmailShell
    preview={`Reset your password for ${siteName}`}
    badge="Password Reset"
    heading="Reset your password"
    intro={`We received a request to reset the password for your ${siteName} account. Choose a new one using the secure link below.`}
    actionUrl={confirmationUrl}
    actionLabel="Reset my password"
    showLinkFallback
    note="This link expires in 60 minutes. If you didn't request a reset, ignore this email — your password stays unchanged."
  />
)

export default RecoveryEmail
