import * as React from 'react'
import { EmailShell, InfoList, type Tone } from './_ui'
import type { TemplateEntry } from './registry'

export interface SecurityEmailProps {
  name?: string
  actionUrl?: string
  timestamp?: string
  device?: string
  location?: string
  ipAddress?: string
}

const greet = (n?: string) => (n ? `Hi ${n}, ` : 'Hi there, ')

function sessionItems(p: SecurityEmailProps) {
  return [
    { label: 'Device', value: p.device },
    { label: 'Location', value: p.location },
    { label: 'IP address', value: p.ipAddress },
    { label: 'When', value: p.timestamp },
  ]
}

function make(
  preview: string,
  badge: string,
  tone: Tone,
  heading: string,
  intro: (p: SecurityEmailProps) => string,
  actionLabel: string | null,
  note: string,
) {
  return function Email(p: SecurityEmailProps) {
    return (
      <EmailShell
        preview={preview}
        badge={badge}
        badgeTone={tone}
        heading={heading}
        intro={intro(p)}
        actionUrl={p.actionUrl}
        actionLabel={actionLabel && p.actionUrl ? actionLabel : undefined}
        actionTone={tone}
        note={note}
      >
        <InfoList items={sessionItems(p)} />
      </EmailShell>
    )
  }
}

const PasswordChangedEmail = make(
  'Your FoundOurMarket™ password was changed',
  'Password Changed',
  'success',
  'Your password was changed',
  (p) => `${greet(p.name)}this confirms the password on your FoundOurMarket™ account was just changed.`,
  null,
  "If you didn't make this change, reset your password immediately and contact support — your account may be at risk.",
)

const AccountRecoveryEmail = make(
  'Recover access to your FoundOurMarket™ account',
  'Account Recovery',
  'accent',
  'Recover your account',
  (p) => `${greet(p.name)}we received a request to recover access to your FoundOurMarket™ account. Use the secure link below to continue.`,
  'Recover my account',
  "If you didn't request account recovery, you can safely ignore this email — no changes have been made.",
)

const LoginNewDeviceEmail = make(
  'New sign-in to your FoundOurMarket™ account',
  'New Device Login',
  'accent',
  'New sign-in detected',
  (p) => `${greet(p.name)}your FoundOurMarket™ account was just signed in to from a new device or location.`,
  'Review account activity',
  "If this was you, no action is needed. If you don't recognise this activity, change your password right away.",
)

const AccountLockedEmail = make(
  'Your FoundOurMarket™ account has been locked',
  'Account Locked',
  'danger',
  'Your account has been locked',
  (p) => `${greet(p.name)}for your protection, we've temporarily locked your FoundOurMarket™ account after unusual sign-in activity.`,
  'Unlock my account',
  "If this wasn't you, please reset your password and contact support to secure your account.",
)

const SuspiciousActivityEmail = make(
  'Suspicious activity on your FoundOurMarket™ account',
  'Security Alert',
  'danger',
  'Suspicious activity detected',
  (p) => `${greet(p.name)}we noticed activity on your FoundOurMarket™ account that looks unusual. Please review it to make sure it was you.`,
  'Secure my account',
  "If you don't recognise this activity, change your password immediately and contact support.",
)

export const passwordChangedTemplate = {
  component: PasswordChangedEmail,
  subject: 'Your FoundOurMarket™ password was changed',
  displayName: 'Password changed',
  previewData: { name: 'Alex', timestamp: 'June 14, 2026, 10:00 AM', device: 'Chrome on macOS' },
} satisfies TemplateEntry

export const accountRecoveryTemplate = {
  component: AccountRecoveryEmail,
  subject: 'Recover your FoundOurMarket™ account',
  displayName: 'Account recovery',
  previewData: { name: 'Alex', actionUrl: 'https://foundourmarket.com/recover?token=sample' },
} satisfies TemplateEntry

export const loginNewDeviceTemplate = {
  component: LoginNewDeviceEmail,
  subject: 'New sign-in to your FoundOurMarket™ account',
  displayName: 'Login from new device',
  previewData: {
    name: 'Alex',
    device: 'Safari on iPhone',
    location: 'Mumbai, IN',
    ipAddress: '203.0.113.7',
    timestamp: 'June 14, 2026, 10:00 AM',
  },
} satisfies TemplateEntry

export const accountLockedTemplate = {
  component: AccountLockedEmail,
  subject: 'Your FoundOurMarket™ account has been locked',
  displayName: 'Account locked',
  previewData: { name: 'Alex', timestamp: 'June 14, 2026, 10:00 AM', ipAddress: '203.0.113.7' },
} satisfies TemplateEntry

export const suspiciousActivityTemplate = {
  component: SuspiciousActivityEmail,
  subject: '⚠ Suspicious activity on your FoundOurMarket™ account',
  displayName: 'Suspicious activity',
  previewData: {
    name: 'Alex',
    device: 'Unknown device',
    location: 'Unknown',
    timestamp: 'June 14, 2026, 10:00 AM',
  },
} satisfies TemplateEntry
