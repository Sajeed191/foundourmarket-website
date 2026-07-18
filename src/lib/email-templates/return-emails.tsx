import * as React from 'react'
import { EmailShell, InfoList, type Tone } from './_ui'
import type { TemplateEntry } from './registry'

export interface ReturnEmailProps {
  orderNumber?: string
  customerName?: string
  productName?: string
  refundAmount?: string
  reason?: string
  unsubscribeUrl?: string
}

const greet = (n?: string) => (n ? `Hi ${n}, ` : 'Hi there, ')
const ref = (n?: string) => (n ? `#${n}` : 'your order')

const baseItems = (p: ReturnEmailProps) => [
  { label: 'Order number', value: p.orderNumber ? `#${p.orderNumber}` : undefined },
  { label: 'Item', value: p.productName },
  { label: 'Reason', value: p.reason },
]

function ReturnRequestedEmail(p: ReturnEmailProps) {
  return (
    <EmailShell
      preview="We've received your return request"
      badge="Return Requested"
      heading="Your return request was received"
      intro={`${greet(p.customerName)}we've received your return request for ${ref(p.orderNumber)}. Our team will review it and get back to you shortly.`}
      unsubscribeUrl={p.unsubscribeUrl}
    >
      <InfoList items={baseItems(p)} />
    </EmailShell>
  )
}

function ReturnApprovedEmail(p: ReturnEmailProps) {
  return (
    <EmailShell
      preview="Your return has been approved"
      badge="Return Approved"
      badgeTone={'success' as Tone}
      heading="Your return has been approved"
      intro={`${greet(p.customerName)}good news — your return for ${ref(p.orderNumber)} has been approved. Please follow the return instructions to send the item back.`}
      unsubscribeUrl={p.unsubscribeUrl}
    >
      <InfoList items={baseItems(p)} />
    </EmailShell>
  )
}

function ReturnRejectedEmail(p: ReturnEmailProps) {
  return (
    <EmailShell
      preview="Update on your return request"
      badge="Return Declined"
      badgeTone={'danger' as Tone}
      heading="Your return could not be approved"
      intro={`${greet(p.customerName)}after reviewing your return request for ${ref(p.orderNumber)}, we're unable to approve it at this time.`}
      note="If you have questions about this decision, reply to this email or contact our support team."
      unsubscribeUrl={p.unsubscribeUrl}
    >
      <InfoList items={baseItems(p)} />
    </EmailShell>
  )
}

function RefundInitiatedEmail(p: ReturnEmailProps) {
  return (
    <EmailShell
      preview="Your refund has been initiated"
      badge="Refund Initiated"
      heading="Your refund is being processed"
      intro={`${greet(p.customerName)}we've initiated your refund for ${ref(p.orderNumber)}. It's on its way back to your original payment method.`}
      note="Depending on your bank, refunds typically take 5–7 business days to reflect."
      unsubscribeUrl={p.unsubscribeUrl}
    >
      <InfoList
        items={[
          ...baseItems(p),
          { label: 'Refund amount', value: p.refundAmount },
        ]}
      />
    </EmailShell>
  )
}

export const returnRequestedTemplate = {
  component: ReturnRequestedEmail,
  subject: (d: Record<string, any>) =>
    `Return requested${d?.orderNumber ? ` · #${d.orderNumber}` : ''} — FoundOurMarket™`,
  displayName: 'Return requested',
  previewData: {
    orderNumber: '8F3A21C9',
    customerName: 'Alex',
    productName: 'Wireless Earbuds',
    reason: 'Item not as described',
  },
} satisfies TemplateEntry

export const returnApprovedTemplate = {
  component: ReturnApprovedEmail,
  subject: (d: Record<string, any>) =>
    `Return approved${d?.orderNumber ? ` · #${d.orderNumber}` : ''} — FoundOurMarket™`,
  displayName: 'Return approved',
  previewData: {
    orderNumber: '8F3A21C9',
    customerName: 'Alex',
    productName: 'Wireless Earbuds',
  },
} satisfies TemplateEntry

export const returnRejectedTemplate = {
  component: ReturnRejectedEmail,
  subject: (d: Record<string, any>) =>
    `Return update${d?.orderNumber ? ` · #${d.orderNumber}` : ''} — FoundOurMarket™`,
  displayName: 'Return rejected',
  previewData: {
    orderNumber: '8F3A21C9',
    customerName: 'Alex',
    productName: 'Wireless Earbuds',
    reason: 'Outside return window',
  },
} satisfies TemplateEntry

export const refundInitiatedTemplate = {
  component: RefundInitiatedEmail,
  subject: (d: Record<string, any>) =>
    `Refund initiated${d?.orderNumber ? ` · #${d.orderNumber}` : ''} — FoundOurMarket™`,
  displayName: 'Refund initiated',
  previewData: { orderNumber: '8F3A21C9', customerName: 'Alex', refundAmount: '₹2,499' },
} satisfies TemplateEntry
