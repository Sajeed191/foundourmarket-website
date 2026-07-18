import * as React from 'react'
import { EmailShell } from './_ui'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <EmailShell
    preview={`Confirm your email for ${siteName}`}
    badge="Confirm Email"
    heading="Welcome — let's confirm your email"
    intro={`Thanks for joining ${siteName}. Confirm ${recipient} to activate your account and start exploring curated finds from around the world.`}
    actionUrl={confirmationUrl}
    actionLabel="Confirm my email"
    showLinkFallback
    note="This link expires in 24 hours. If you didn't create an account, you can safely ignore this email."
  />
)

export default SignupEmail
