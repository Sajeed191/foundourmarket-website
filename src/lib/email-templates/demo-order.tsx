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
import type { OrderEmailProps } from './order-emails'

/* FoundOurMarket™ Global Beta — demo order acknowledgement email. */

const BG = '#070a12'
const PANEL = '#0d1322'
const BORDER = '#1c2740'
const TEXT = '#e7ecf6'
const MUTED = '#8a96ad'
const ACCENT = '#ff8a3d'
const BLUE = '#5b9dff'

const greet = (name?: string) => (name ? `Hi ${name}, ` : '')

function DemoOrderEmail({ orderNumber, customerName, amount, unsubscribeUrl }: OrderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your demo order has been recorded — FoundOurMarket™ Global Beta</Preview>
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
              boxShadow: '0 24px 60px -24px rgba(91,157,255,0.35)',
            }}
          >
            <Section
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(91,157,255,0.14)',
                border: '1px solid rgba(91,157,255,0.35)',
                borderRadius: '999px',
                padding: '6px 14px',
                marginBottom: '20px',
              }}
            >
              <Text style={{ margin: 0, fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: BLUE, fontWeight: 700 }}>
                ✦ Global Beta · Demo Order
              </Text>
            </Section>

            <Heading style={{ margin: '0 0 14px', fontSize: '24px', lineHeight: '1.25', color: TEXT, fontWeight: 700 }}>
              Demo Order Received
            </Heading>
            <Text style={{ margin: '0 0 18px', fontSize: '15px', lineHeight: '1.65', color: MUTED }}>
              {greet(customerName)}thank you for your interest in FoundOurMarket.
            </Text>
            <Text style={{ margin: '0 0 22px', fontSize: '15px', lineHeight: '1.65', color: MUTED }}>
              Your demo order has been recorded while international payment support is being finalized.
              We will notify you when global payments become available.
            </Text>

            <Section
              style={{
                backgroundColor: 'rgba(91,157,255,0.06)',
                border: `1px solid ${BORDER}`,
                borderRadius: '14px',
                padding: '18px 20px',
              }}
            >
              {orderNumber && (
                <Section style={{ marginBottom: '8px' }}>
                  <Text style={{ margin: 0, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: MUTED }}>Order number</Text>
                  <Text style={{ margin: '2px 0 0', fontSize: '15px', color: TEXT, fontWeight: 600 }}>{`#${orderNumber}`}</Text>
                </Section>
              )}
              {amount && (
                <Section style={{ marginBottom: '8px' }}>
                  <Text style={{ margin: 0, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: MUTED }}>Order total</Text>
                  <Text style={{ margin: '2px 0 0', fontSize: '15px', color: TEXT, fontWeight: 600 }}>{amount}</Text>
                </Section>
              )}
              <Section>
                <Text style={{ margin: 0, fontSize: '11px', letterSpacing: '1px', textTransform: 'uppercase', color: MUTED }}>Payment</Text>
                <Text style={{ margin: '2px 0 0', fontSize: '15px', color: BLUE, fontWeight: 600 }}>Demo Payment · Global Beta</Text>
              </Section>
            </Section>
          </Section>

          <Hr style={{ borderColor: BORDER, margin: '24px 0 16px' }} />
          <Section style={{ textAlign: 'center', padding: '0 0 8px' }}>
            <Text style={{ margin: 0, fontSize: '11px', color: MUTED }}>
              Need help? Reach us at support@foundourmarket.com
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

export const demoOrderReceivedTemplate = {
  component: DemoOrderEmail,
  subject: 'Demo Order Received — FoundOurMarket™',
  displayName: 'Demo order received',
  previewData: { orderNumber: '8F3A21C9', customerName: 'Alex', amount: '$49.00' },
} satisfies TemplateEntry
