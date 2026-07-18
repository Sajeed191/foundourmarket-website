import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from '@react-email/components'

/* ─────────────────────────────────────────────────────────────────────────────
   FoundOurMarket™ — Premium Email Design System (v2)
   Shared primitives used by every transactional template. Zero backend logic.
   Dark luxury shell, mobile-first (600px), dark/light-mode aware,
   inline styles only, table-safe for Gmail / Outlook / Apple Mail / Yahoo.
   ───────────────────────────────────────────────────────────────────────────── */

export const TOKENS = {
  bg: '#050810',
  panel: '#0d1322',
  panelSoft: '#111a2e',
  border: '#1c2740',
  borderSoft: '#141c30',
  text: '#f0f3fa',
  textDim: '#c9d2e3',
  muted: '#8a96ad',
  mutedDeep: '#5a6a7d',
  accent: '#ff8a3d',
  accentDeep: '#f26a1c',
  accentSoft: 'rgba(255,138,61,0.14)',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#ff6b6b',
  info: '#60a5fa',
  glow: '0 24px 60px -24px rgba(255,138,61,0.35)',
  radius: 20,
  radiusSm: 14,
  radiusPill: 999,
  fontFamily:
    "'Inter', 'Helvetica Neue', Helvetica, Arial, 'Segoe UI', Roboto, sans-serif",
  monoFamily:
    "'JetBrains Mono', 'SFMono-Regular', ui-monospace, Menlo, Consolas, monospace",
} as const

export const SUPPORT = 'support@foundourmarket.com'
export const SITE = 'https://foundourmarket.com'

export type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const toneColor = (t: Tone = 'accent') =>
  t === 'success'
    ? TOKENS.success
    : t === 'warning'
      ? TOKENS.warning
      : t === 'danger'
        ? TOKENS.danger
        : t === 'info'
          ? TOKENS.info
          : t === 'neutral'
            ? TOKENS.muted
            : TOKENS.accent

/* ────────────── Brand header ────────────── */

function BrandHeader() {
  return (
    <Section style={{ textAlign: 'center', padding: '4px 0 22px' }}>
      <Text
        style={{
          margin: 0,
          fontSize: '11px',
          letterSpacing: '5px',
          textTransform: 'uppercase',
          color: TOKENS.accent,
          fontWeight: 800,
        }}
      >
        FoundOurMarket™
      </Text>
      <Text
        style={{
          margin: '6px 0 0',
          fontSize: '11px',
          color: TOKENS.muted,
          letterSpacing: '0.4px',
        }}
      >
        Everything You Need — All in One Place 🌍
      </Text>
    </Section>
  )
}

/* ────────────── Status chip / badge ────────────── */

export function StatusChip({
  label,
  tone = 'accent',
}: {
  label: string
  tone?: Tone
}) {
  const color = toneColor(tone)
  return (
    <Section
      style={{
        display: 'inline-block',
        backgroundColor: `${color}1F`,
        border: `1px solid ${color}66`,
        borderRadius: TOKENS.radiusPill,
        padding: '6px 14px',
        marginBottom: '22px',
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: '10px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color,
          fontWeight: 800,
        }}
      >
        {label}
      </Text>
    </Section>
  )
}

/* ────────────── CTA button ────────────── */

export function CTAButton({
  href,
  label,
  tone = 'accent',
  variant = 'primary',
}: {
  href: string
  label: string
  tone?: Tone
  variant?: 'primary' | 'secondary'
}) {
  const color = toneColor(tone)
  if (variant === 'secondary') {
    return (
      <Button
        href={href}
        style={{
          backgroundColor: 'transparent',
          color: TOKENS.text,
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.4px',
          textDecoration: 'none',
          padding: '13px 26px',
          borderRadius: TOKENS.radiusPill,
          display: 'inline-block',
          border: `1px solid ${TOKENS.border}`,
        }}
      >
        {label}
      </Button>
    )
  }
  return (
    <Button
      href={href}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${TOKENS.accentDeep} 100%)`,
        backgroundColor: color,
        color: '#0a0a0a',
        fontSize: '14px',
        fontWeight: 800,
        letterSpacing: '0.5px',
        textDecoration: 'none',
        padding: '15px 34px',
        borderRadius: TOKENS.radiusPill,
        display: 'inline-block',
        boxShadow: `0 10px 30px -10px ${color}80`,
      }}
    >
      {label}
    </Button>
  )
}

/* ────────────── Info card + rows ────────────── */

export function InfoCard({
  children,
  style,
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <Section
      style={{
        backgroundColor: 'rgba(255,138,61,0.05)',
        border: `1px solid ${TOKENS.border}`,
        borderRadius: TOKENS.radiusSm,
        padding: '18px 20px',
        ...style,
      }}
    >
      {children}
    </Section>
  )
}

export function InfoRow({
  label,
  value,
  last,
}: {
  label: string
  value: React.ReactNode
  last?: boolean
}) {
  return (
    <Row style={{ marginBottom: last ? 0 : 12 }}>
      <Column>
        <Text
          style={{
            margin: 0,
            fontSize: '10px',
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: TOKENS.muted,
            fontWeight: 600,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            margin: '3px 0 0',
            fontSize: '15px',
            color: TOKENS.text,
            fontWeight: 600,
            lineHeight: '1.45',
          }}
        >
          {value}
        </Text>
      </Column>
    </Row>
  )
}

export function InfoList({
  items,
}: {
  items: Array<{ label: string; value?: React.ReactNode }>
}) {
  const rows = items.filter(
    (i) => i.value !== undefined && i.value !== null && i.value !== '',
  )
  if (!rows.length) return null
  return (
    <InfoCard>
      {rows.map((r, i) => (
        <InfoRow
          key={r.label}
          label={r.label}
          value={r.value}
          last={i === rows.length - 1}
        />
      ))}
    </InfoCard>
  )
}

/* ────────────── Quote / callout / code ────────────── */

export function Quote({ text }: { text: string }) {
  return (
    <Section
      style={{
        backgroundColor: 'rgba(255,138,61,0.05)',
        border: `1px solid ${TOKENS.border}`,
        borderLeft: `3px solid ${TOKENS.accent}`,
        borderRadius: TOKENS.radiusSm,
        padding: '14px 18px',
        marginTop: 8,
      }}
    >
      <Text
        style={{
          margin: 0,
          fontSize: '14px',
          lineHeight: '1.6',
          color: TOKENS.textDim,
          fontStyle: 'italic',
        }}
      >
        &ldquo;{text}&rdquo;
      </Text>
    </Section>
  )
}

export function Callout({
  tone = 'accent',
  title,
  children,
}: {
  tone?: Tone
  title?: string
  children: React.ReactNode
}) {
  const color = toneColor(tone)
  return (
    <Section
      style={{
        backgroundColor: `${color}12`,
        border: `1px solid ${color}44`,
        borderRadius: TOKENS.radiusSm,
        padding: '14px 16px',
        marginTop: 16,
      }}
    >
      {title && (
        <Text
          style={{
            margin: '0 0 4px',
            fontSize: '11px',
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color,
            fontWeight: 800,
          }}
        >
          {title}
        </Text>
      )}
      <Text
        style={{
          margin: 0,
          fontSize: '13px',
          lineHeight: '1.6',
          color: TOKENS.textDim,
        }}
      >
        {children}
      </Text>
    </Section>
  )
}

export function CodeBlock({ code }: { code: string }) {
  return (
    <Section
      style={{
        backgroundColor: TOKENS.panelSoft,
        border: `1px solid ${TOKENS.border}`,
        borderRadius: TOKENS.radiusSm,
        padding: '20px 12px',
        margin: '20px 0',
        textAlign: 'center',
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: TOKENS.monoFamily,
          fontSize: '28px',
          letterSpacing: '10px',
          fontWeight: 800,
          color: TOKENS.text,
        }}
      >
        {code}
      </Text>
    </Section>
  )
}

/* ────────────── Link fallback (button + paste-link block) ────────────── */

function LinkFallback({ url }: { url: string }) {
  return (
    <Section
      style={{
        marginTop: 18,
        backgroundColor: 'rgba(255,138,61,0.05)',
        border: `1px solid ${TOKENS.border}`,
        borderRadius: TOKENS.radiusSm,
        padding: '12px 14px',
      }}
    >
      <Text
        style={{
          margin: '0 0 4px',
          fontSize: '10px',
          letterSpacing: '1.4px',
          textTransform: 'uppercase',
          color: TOKENS.muted,
          fontWeight: 700,
        }}
      >
        Or paste this link
      </Text>
      <Link
        href={url}
        style={{
          fontSize: '12px',
          color: TOKENS.accent,
          wordBreak: 'break-all',
        }}
      >
        {url}
      </Link>
    </Section>
  )
}

/* ────────────── Footer ────────────── */

function EmailFooter({
  unsubscribeUrl,
  preferencesUrl,
}: {
  unsubscribeUrl?: string
  preferencesUrl?: string
}) {
  const linkStyle: React.CSSProperties = {
    color: TOKENS.muted,
    fontSize: '11px',
    textDecoration: 'none',
  }
  return (
    <>
      <Hr style={{ borderColor: TOKENS.border, margin: '26px 0 18px' }} />
      <Section style={{ textAlign: 'center', padding: '0 0 8px' }}>
        <Text style={{ margin: 0, fontSize: '11px', color: TOKENS.muted, lineHeight: '1.6' }}>
          Need help? Reach us at{' '}
          <Link href={`mailto:${SUPPORT}`} style={{ color: TOKENS.accent }}>
            {SUPPORT}
          </Link>
        </Text>
        <Section style={{ margin: '10px 0 0' }}>
          <Link href={`${SITE}/help`} style={linkStyle}>
            Help
          </Link>
          <span style={{ color: TOKENS.mutedDeep, margin: '0 8px', fontSize: '11px' }}>·</span>
          <Link href={`${SITE}/privacy`} style={linkStyle}>
            Privacy
          </Link>
          <span style={{ color: TOKENS.mutedDeep, margin: '0 8px', fontSize: '11px' }}>·</span>
          <Link href={`${SITE}/terms`} style={linkStyle}>
            Terms
          </Link>
          <span style={{ color: TOKENS.mutedDeep, margin: '0 8px', fontSize: '11px' }}>·</span>
          <Link href={SITE} style={linkStyle}>
            Visit site
          </Link>
        </Section>
        <Text style={{ margin: '12px 0 0', fontSize: '11px', color: TOKENS.mutedDeep }}>
          © {new Date().getFullYear()} FoundOurMarket™. All rights reserved.
        </Text>
        {(unsubscribeUrl || preferencesUrl) && (
          <Text style={{ margin: '10px 0 0', fontSize: '11px', color: TOKENS.mutedDeep }}>
            {preferencesUrl && (
              <>
                <Link href={preferencesUrl} style={linkStyle}>
                  Email preferences
                </Link>
                {unsubscribeUrl && (
                  <span style={{ color: TOKENS.mutedDeep, margin: '0 8px' }}>·</span>
                )}
              </>
            )}
            {unsubscribeUrl && (
              <Link href={unsubscribeUrl} style={linkStyle}>
                Unsubscribe
              </Link>
            )}
          </Text>
        )}
      </Section>
    </>
  )
}

/* ────────────── The Shell ────────────── */

export interface EmailShellProps {
  preview: string
  badge?: string
  badgeTone?: Tone
  heading: string
  intro?: string
  actionUrl?: string
  actionLabel?: string
  actionTone?: Tone
  secondaryUrl?: string
  secondaryLabel?: string
  showLinkFallback?: boolean
  note?: string
  unsubscribeUrl?: string
  preferencesUrl?: string
  children?: React.ReactNode
}

export function EmailShell({
  preview,
  badge,
  badgeTone = 'accent',
  heading,
  intro,
  actionUrl,
  actionLabel,
  actionTone = 'accent',
  secondaryUrl,
  secondaryLabel,
  showLinkFallback,
  note,
  unsubscribeUrl,
  preferencesUrl,
  children,
}: EmailShellProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: TOKENS.bg,
          margin: 0,
          padding: '36px 0',
          fontFamily: TOKENS.fontFamily,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <Container
          style={{
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0 18px',
          }}
        >
          <BrandHeader />

          <Section
            style={{
              backgroundColor: TOKENS.panel,
              backgroundImage: `linear-gradient(180deg, ${TOKENS.panel} 0%, ${TOKENS.panelSoft} 100%)`,
              border: `1px solid ${TOKENS.border}`,
              borderRadius: TOKENS.radius,
              padding: '38px 34px',
              boxShadow: TOKENS.glow,
            }}
          >
            {badge && <StatusChip label={badge} tone={badgeTone} />}

            <Heading
              as="h1"
              style={{
                margin: '0 0 14px',
                fontSize: '26px',
                lineHeight: '1.22',
                color: TOKENS.text,
                fontWeight: 700,
                letterSpacing: '-0.3px',
              }}
            >
              {heading}
            </Heading>

            {intro && (
              <Text
                style={{
                  margin: '0 0 24px',
                  fontSize: '15px',
                  lineHeight: '1.65',
                  color: TOKENS.textDim,
                }}
              >
                {intro}
              </Text>
            )}

            {actionUrl && actionLabel && (
              <Section style={{ textAlign: 'center', margin: '4px 0 20px' }}>
                <CTAButton href={actionUrl} label={actionLabel} tone={actionTone} />
                {secondaryUrl && secondaryLabel && (
                  <Text style={{ margin: '12px 0 0' }}>
                    <CTAButton
                      href={secondaryUrl}
                      label={secondaryLabel}
                      variant="secondary"
                    />
                  </Text>
                )}
              </Section>
            )}

            {actionUrl && showLinkFallback && <LinkFallback url={actionUrl} />}

            {children}

            {note && (
              <Text
                style={{
                  margin: '22px 0 0',
                  fontSize: '12px',
                  lineHeight: '1.6',
                  color: TOKENS.muted,
                }}
              >
                {note}
              </Text>
            )}
          </Section>

          <EmailFooter
            unsubscribeUrl={unsubscribeUrl}
            preferencesUrl={preferencesUrl}
          />
        </Container>
      </Body>
    </Html>
  )
}

/* Convenience greetings */
export const greet = (name?: string) => (name ? `Hi ${name}, ` : 'Hi there, ')
export const orderRef = (n?: string) => (n ? `#${n}` : 'your order')
