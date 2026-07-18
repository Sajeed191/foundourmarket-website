import * as React from 'react'
import { EmailShell } from './_ui'
import type { TemplateEntry } from './registry'

export interface AccountEmailProps {
  name?: string
  actionUrl?: string
  expiresIn?: string
}

const greet = (name?: string) => (name ? `Hi ${name}, ` : 'Hi there, ')

function WelcomeEmail({ name, actionUrl }: AccountEmailProps) {
  return (
    <EmailShell
      preview="Welcome to FoundOurMarket™ — your global marketplace awaits"
      badge="Welcome"
      heading="Welcome to FoundOurMarket™"
      intro={`${greet(name)}your account is ready. Discover curated products from around the world — all in one place, delivered to your door.`}
      actionUrl={actionUrl}
      actionLabel={actionUrl ? 'Start exploring' : undefined}
      note="You're receiving this because you created an account with FoundOurMarket™."
    />
  )
}

function AccountVerificationEmail({ name, actionUrl, expiresIn }: AccountEmailProps) {
  return (
    <EmailShell
      preview="Verify your FoundOurMarket™ account"
      badge="Verify Account"
      heading="Confirm your email address"
      intro={`${greet(name)}please verify your email to activate your FoundOurMarket™ account and keep it secure.`}
      actionUrl={actionUrl}
      actionLabel="Verify my account"
      showLinkFallback
      note={`This verification link expires in ${expiresIn || '24 hours'}. If you didn't create an account, you can safely ignore this email.`}
    />
  )
}

function PasswordResetEmail({ name, actionUrl, expiresIn }: AccountEmailProps) {
  return (
    <EmailShell
      preview="Reset your FoundOurMarket™ password"
      badge="Password Reset"
      heading="Reset your password"
      intro={`${greet(name)}we received a request to reset your FoundOurMarket™ password. Tap the button below to choose a new one.`}
      actionUrl={actionUrl}
      actionLabel="Reset password"
      showLinkFallback
      note={`This link expires in ${expiresIn || '60 minutes'}. If you didn't request a password reset, ignore this email — your password won't change.`}
    />
  )
}

export const welcomeTemplate = {
  component: WelcomeEmail,
  subject: 'Welcome to FoundOurMarket™ 🌍',
  displayName: 'Welcome',
  previewData: { name: 'Alex', actionUrl: 'https://foundourmarket.com' },
} satisfies TemplateEntry

export const accountVerificationTemplate = {
  component: AccountVerificationEmail,
  subject: 'Verify your FoundOurMarket™ account',
  displayName: 'Account verification',
  previewData: {
    name: 'Alex',
    actionUrl: 'https://foundourmarket.com/verify?token=sample',
    expiresIn: '24 hours',
  },
} satisfies TemplateEntry

export const passwordResetTemplate = {
  component: PasswordResetEmail,
  subject: 'Reset your FoundOurMarket™ password',
  displayName: 'Password reset',
  previewData: {
    name: 'Alex',
    actionUrl: 'https://foundourmarket.com/reset?token=sample',
    expiresIn: '60 minutes',
  },
} satisfies TemplateEntry
