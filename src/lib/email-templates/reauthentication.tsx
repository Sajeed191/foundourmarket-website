import * as React from 'react'
import { CodeBlock, EmailShell } from './_ui'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <EmailShell
    preview="Your FoundOurMarket verification code"
    badge="Verification Code"
    heading="Confirm it's really you"
    intro="Use the verification code below to confirm your identity and complete the requested action."
    note="This code expires shortly. If you didn't request it, you can safely ignore this email."
  >
    <CodeBlock code={token} />
  </EmailShell>
)

export default ReauthenticationEmail
