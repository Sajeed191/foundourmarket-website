import * as React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

/* FoundOurMarket™ return & refund emails — same dark luxury shell. */

const BG = '#070a12'
const PANEL = '#0d1322'
const BORDER = '#1c2740'
const TEXT = '#e7ecf6'
const MUTED = '#8a96ad'
const ACCENT = '#ff8a3d'
const DANGER = '#ff6b6b'
const SUCCESS = '#34d399'
const SUPPORT = 'support@foundourmarket.com'

export interface ReturnEmailProps {
  orderNumber?: string
  customerName?: string
  productName?: string
  refundAmount?: string
  reason?: string
  unsubscribeUrl?: string
}

function Shell({
  preview,
  badge,
  badgeColor,
  heading,
  intro,
  details,
  note,
  unsubscribeUrl,
}: {
  preview: string
  badge: string
  badgeColor: string
  heading: string
  intro: string
  details?: Array<{ label: string; value: string }>
  note?: string
  unsubscribeUrl?: string
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta name="color-scheme" content="dark light" />
        <meta name="supported-color-schemes" content="dark light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: BG, margin: 0, padding: '32px 0', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        <Container style={{ width: '100%', maxWidth: '560px', margin: '0 auto', padding: '0 16px' }}>
          <Section style={{ textAlign: 'center', padding: '8px 0 20px' }}>
            <Text style={{ margin: 0, fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', color: ACCENT, fontWeight: 700 }}>
              FoundOurMarket™
            </Text>
            <Text style={{ margin: '6px 0 0', fontSize: '12px', color: MUTED }}>
              Everything You Need — All in One Place 🌍
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: PANEL,
              border: `1px solid ${BORDER}`,
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: '0 24px 60px -24px rgba(255,138,61,0.35)',
            }}
          >
            <Section
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(255,138,61,0.14)',
                border: `1px solid ${badgeColor}55`,
                borderRadius: '999px',
                padding: '6px 14px',
                marginBottom: '20px',
              }}
            >
              <Text style={{ margin: 0, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: badgeColor, fontWeight: 700 }}>
                {badge}
              </Text>
            </Section>

            <Heading style={{ margin: '0 0 14px', fontSize: '24px', lineHeight: '1.25', color: TEXT, fontWeight: 700 }}>
              {heading}
            </Heading>
            <Text style={{ margin: '0 0 22px', fontSize: '15px', lineHeight: '1.65', color: MUTED }}>
              {intro}
            </Text>

            {details && details.length > 0 && (
              <Section
                style={{
                  backgroundColor: 'rgba(255,138,61,0.06)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '14px',
                  padding: '18px 20px',
                }}
              >
                {details.map((d) => (
                  <Section key={d.label} style={{ marginBottom: '8px' }}>
                    <Text style={{ margin: 0, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: MUTED }}>
                      {d.label}
                    </Text>
                    <Text style={{ margin: '2px 0 0', fontSize: '15px', color: TEXT, fontWeight: 600 }}>{d.value}</Text>
                  </Section>
                ))}
              </Section>
            )}

            {note && (
              <Text style={{ margin: '18px 0 0', fontSize: '12px', lineHeight: '1.6', color: MUTED }}>
                {note}
              </Text>
            )}
          </Section>

          <Hr style={{ borderColor: BORDER, margin: '24px 0 16px' }} />
          <Section style={{ textAlign: 'center', padding: '0 0 8px' }}>
            <Text style={{ margin: 0, fontSize: '11px', color: MUTED }}>
              Need help? Reach us at{' '}
              <Link href={`mailto:${SUPPORT}`} style={{ color: ACCENT }}>
                {SUPPORT}
              </Link>
            </Text>
            <Text style={{ margin: '6px 0 0', fontSize: '11px', color: '#5a6a7d' }}>
              © {new Date().getFullYear()} FoundOurMarket™. All rights reserved.
            </Text>
            {unsubscribeUrl && (
              <Text style={{ margin: '10px 0 0', fontSize: '11px', color: '#5a6a7d' }}>
                Don't want these emails?{' '}
                <Link href={unsubscribeUrl} style={{ color: MUTED, textDecoration: 'underline' }}>
                  Unsubscribe
                </Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const greet = (name?: string) => (name ? `Hi ${name}, ` : 'Hi there, ')
const ref = (n?: string) => (n ? `#${n}` : 'your order')

function baseDetails(p: ReturnEmailProps): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = []
  if (p.orderNumber) out.push({ label: 'Order number', value: `#${p.orderNumber}` })
  if (p.productName) out.push({ label: 'Item', value: p.productName })
  if (p.reason) out.push({ label: 'Reason', value: p.reason })
  return out
}

/* ---------- Return requested ---------- */
function ReturnRequestedEmail(p: ReturnEmailProps) {
  return (
    <Shell
      unsubscribeUrl={p.unsubscribeUrl}
      preview="We've received your return request"
      badge="Return Requested"
      badgeColor={ACCENT}
      heading="Your return request was received"
      intro={`${greet(p.customerName)}we've received your return request for ${ref(p.orderNumber)}. Our team will review it and get back to you shortly.`}
      details={baseDetails(p)}
    />
  )
}

/* ---------- Return approved ---------- */
function ReturnApprovedEmail(p: ReturnEmailProps) {
  return (
    <Shell
      unsubscribeUrl={p.unsubscribeUrl}
      preview="Your return has been approved"
      badge="Return Approved"
      badgeColor={SUCCESS}
      heading="Your return has been approved"
      intro={`${greet(p.customerName)}good news — your return for ${ref(p.orderNumber)} has been approved. Please follow the return instructions to send the item back.`}
      details={baseDetails(p)}
    />
  )
}

/* ---------- Return rejected ---------- */
function ReturnRejectedEmail(p: ReturnEmailProps) {
  return (
    <Shell
      unsubscribeUrl={p.unsubscribeUrl}
      preview="Update on your return request"
      badge="Return Declined"
      badgeColor={DANGER}
      heading="Your return could not be approved"
      intro={`${greet(p.customerName)}after reviewing your return request for ${ref(p.orderNumber)}, we're unable to approve it at this time.`}
      details={baseDetails(p)}
      note="If you have questions about this decision, reply to this email or contact our support team."
    />
  )
}

/* ---------- Refund initiated ---------- */
function RefundInitiatedEmail(p: ReturnEmailProps) {
  return (
    <Shell
      unsubscribeUrl={p.unsubscribeUrl}
      preview="Your refund has been initiated"
      badge="Refund Initiated"
      badgeColor={ACCENT}
      heading="Your refund is being processed"
      intro={`${greet(p.customerName)}we've initiated your refund for ${ref(p.orderNumber)}. It's on its way back to your original payment method.`}
      details={[
        ...baseDetails(p),
        ...(p.refundAmount ? [{ label: 'Refund amount', value: p.refundAmount }] : []),
      ]}
      note="Depending on your bank, refunds typically take 5–7 business days to reflect."
    />
  )
}

export const returnRequestedTemplate = {
  component: ReturnRequestedEmail,
  subject: (d: Record<string, any>) => `Return requested${d?.orderNumber ? ` · #${d.orderNumber}` : ''} — FoundOurMarket™`,
  displayName: 'Return requested',
  previewData: { orderNumber: '8F3A21C9', customerName: 'Alex', productName: 'Wireless Earbuds', reason: 'Item not as described' },
} satisfies TemplateEntry

export const returnApprovedTemplate = {
  component: ReturnApprovedEmail,
  subject: (d: Record<string, any>) => `Return approved${d?.orderNumber ? ` · #${d.orderNumber}` : ''} — FoundOurMarket™`,
  displayName: 'Return approved',
  previewData: { orderNumber: '8F3A21C9', customerName: 'Alex', productName: 'Wireless Earbuds' },
} satisfies TemplateEntry

export const returnRejectedTemplate = {
  component: ReturnRejectedEmail,
  subject: (d: Record<string, any>) => `Return update${d?.orderNumber ? ` · #${d.orderNumber}` : ''} — FoundOurMarket™`,
  displayName: 'Return rejected',
  previewData: { orderNumber: '8F3A21C9', customerName: 'Alex', productName: 'Wireless Earbuds', reason: 'Outside return window' },
} satisfies TemplateEntry

export const refundInitiatedTemplate = {
  component: RefundInitiatedEmail,
  subject: (d: Record<string, any>) => `Refund initiated${d?.orderNumber ? ` · #${d.orderNumber}` : ''} — FoundOurMarket™`,
  displayName: 'Refund initiated',
  previewData: { orderNumber: '8F3A21C9', customerName: 'Alex', refundAmount: '₹2,499' },
} satisfies TemplateEntry
