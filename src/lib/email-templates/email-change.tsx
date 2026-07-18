import * as React from 'react'
import { EmailShell, InfoList } from './_ui'

interface EmailChangeEmailProps {
  siteName: string
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <EmailShell
    preview={`Confirm your email change for ${siteName}`}
    badge="Confirm Change"
    heading="Confirm your new email address"
    intro={`We received a request to change the email address on your ${siteName} account. Confirm the change to complete it.`}
    actionUrl={confirmationUrl}
    actionLabel="Confirm email change"
    showLinkFallback
    note="If you didn't request this change, please reset your password immediately and contact support to secure your account."
  >
    <InfoList
      items={[
        { label: 'Current email', value: oldEmail },
        { label: 'New email', value: newEmail },
      ]}
    />
  </EmailShell>
)

export default EmailChangeEmail
