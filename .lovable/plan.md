# FoundOurMarket™ Enterprise Support Platform — Phased Build

This is a large, multi-system upgrade. Building it as one change is not safe to review or test. I propose 6 phases, each independently shippable and testable, reusing the existing support schema (`support_tickets`, `support_messages`, `support_ticket_events`, `notifications`, etc.) and the premium dark aesthetic already in memory.

I'll start Phase 1 once you approve. Tell me if you want to reprioritize.

---

## Phase 1 — Notification Center + Bell + Tab Badge

The highest-value, lowest-risk layer. The `notifications` table already exists.

- `useNotifications` hook: realtime subscription (channel torn down on unmount), unread count, mark read / mark all read / delete, pagination (infinite scroll).
- Notification bell component with `99+` badge → added to desktop navbar, mobile navbar, customer dashboard, admin dashboard.
- Bell dropdown: icon, title, description, timestamp, read state, quick actions, "View All".
- Routes: `/account/notifications` and admin notifications view (full history, states: unread/read/archived).
- Browser tab badge: dynamic `document.title` → `FoundOurMarket™ (n)` / `(99+)`, driven by unread count.
- Deep linking map: support→ticket, order→order, return→return, refund→refund, dispute→dispute. Deep-link target validated before navigation.

## Phase 2 — Marketplace / Order Integration

- Order details page: Contact Support / Create Ticket / View Existing Ticket, with status, assigned agent, priority.
- Auto-linking: tickets capture `order_id`, `customer_id`, `shipment_id`, `return_id`, `refund_id`, `dispute_id` when created from those contexts (columns added as needed).
- Ticket header: ticket number, order number, status, priority, assigned staff, created, last activity.
- Customer timeline inside order details, sourced from `support_ticket_events`.

## Phase 3 — Satisfaction Ratings + Trust Metrics

- New table `support_ticket_ratings` (rating, comment, customer_id, ticket_id, timestamps) with RLS + GRANTs.
- Rating prompt (★1–5 + optional feedback) when ticket → Resolved/Closed.
- Admin analytics: average rating, monthly rating, resolution satisfaction, negative-feedback queue, recent reviews.
- Trust metrics: CSAT, first response time, resolution time (computed from events).

## Phase 4 — Secure Attachments

- New table `support_attachments` + private storage bucket, RLS, signed URLs.
- Drag & drop, multi-file, mobile camera, progress, validation (type/size), preview + download.
- Permission validation: only ticket participants + admins can read.

## Phase 5 — Realtime Presence + Typing + Email-to-Ticket

- Typing indicators via Realtime broadcast (ephemeral, auto-hide on inactivity).
- Online presence (🟢/🟡/🔴) from recent activity with configurable timeout, shown in support header, ticket view, admin dashboard.
- Email-to-ticket: public webhook route (`/api/public/...`) using the connected Gmail mailbox to create tickets from inbound mail, append replies to existing tickets by ticket number, preserve attachments, match customer by email, basic spam filtering.

## Phase 6 — Omnichannel + Advanced Analytics + Automation Foundation

- Channel columns on tickets (`channel`, `source`, `first_contact`) + channel badge (Website/Email/WhatsApp/future). WhatsApp left as schema-ready stubs (no live API yet).
- Analytics dashboard: open/resolved, avg first response, avg resolution, CSAT, agent performance, by category/priority/channel, with daily/weekly/monthly/custom range charts.
- Automation foundation: schema scaffolding for AI assistant, suggested replies, auto-categorization, escalation rules, SLA automation (tables/columns + audit logging, no live AI yet).

---

## Technical notes

- Every new `public` table: CREATE → GRANT → ENABLE RLS → POLICY in one migration; policies scoped to `auth.uid()` / `has_role(...)`.
- Realtime: subscribe inside `useEffect`, remove channel on unmount, RLS-scoped.
- Data access via `createServerFn` where elevated reads are needed; public webhook only under `/api/public/`.
- Attachments bucket private; access via signed URLs only.
- All UI uses existing semantic tokens (oklch) — no hardcoded colors.

## Scope flags (need a quick decision)

- WhatsApp: live integration needs a provider (Twilio/Meta Cloud API). I'll build schema + admin UI as "ready" and wire the live API later. OK?
- Email-to-ticket: uses the already-connected Gmail mailbox for inbound polling/webhook. OK to use that mailbox?

I'll begin with Phase 1 on approval.

I approve the phased approach.

For FoundOurMarket™, this is significantly safer than attempting all 6 phases in one deployment.

### My Decisions

#### ✅ Phase Order Approved

Proceed exactly in this order:

1. Notification Center + Bell + Tab Badge
2. Marketplace / Order Integration
3. Satisfaction Ratings + Trust Metrics
4. Secure Attachments
5. Realtime Presence + Typing + Email-to-Ticket
6. Omnichannel + Analytics + Automation Foundation

---

### WhatsApp Decision

✅ YES

Build:

- channel field
- source field
- channel badges
- WhatsApp-ready architecture
- admin UI placeholders

Do NOT integrate Meta Cloud API or Twilio yet.

Reason:

- Adds complexity
- Requires business verification
- Requires ongoing maintenance
- No immediate revenue impact

Prepare the foundation now.

Implement the API later.

---

### Email-to-Ticket Decision

⚠️ Modify slightly

Do NOT use:

[foundourmarket@gmail.com](mailto:foundourmarket@gmail.com)

for long-term ticket ingestion.

Use:

[support@foundourmarket.com](mailto:support@foundourmarket.com)

as the primary support address.

The Gmail address should remain fallback only.

Recommended flow:

[support@foundourmarket.com](mailto:support@foundourmarket.com) ↓ Mailgun / forwarding ↓ Email-to-Ticket processor ↓ support_tickets

This aligns with your enterprise marketplace direction.

---

## Additional Requirements For Phase 1

Add:

### Notification Preferences

Account → Notification Settings

Allow:

- Support Replies
- Order Updates
- Shipment Updates
- Refund Updates
- Returns
- Marketing Updates

Future-proof now.

---

### Notification Categories

Store:

- support
- order
- shipment
- refund
- return
- dispute
- system
- marketing

This will help analytics later.

---

### Notification Expiration

Auto archive:

- Read notifications older than 30 days

Keep database clean.

---

## Additional Requirements For Phase 2

When customer opens:

Order Details

Show:

### Support Card

Status: Open

Assigned: Support Team

Priority: Normal

Last Reply: 2 hours ago

Button: View Conversation

This creates strong trust signals.

---

## Additional Requirements For Phase 3

After a customer submits a rating:

Show:

"Thank you for your feedback."

Do not repeatedly prompt.

Store:

rated_at

to prevent duplicate prompts.

---

## Additional Requirements For Phase 4

Attachments should support:

### Images

- JPG
- PNG
- WEBP

### Documents

- PDF

Only allow:

Maximum 10 MB per file initially.

Avoid DOCX, ZIP, and other formats for now.

Reduce abuse risk.

---

## Additional Requirements For Phase 6

Analytics Dashboard should include:

### Support Health

- Open Tickets
- Pending Tickets
- Resolved Tickets
- Avg First Response
- Avg Resolution Time
- CSAT Score

### Agent Performance

- Tickets Handled
- Avg Response Time
- Satisfaction Rating

### Marketplace Support Trends

- Orders Creating Tickets
- Return Related Tickets
- Refund Related Tickets
- Top Support Categories

These metrics will become valuable once order volume grows.

---

# Final Approval

✅ Approved to begin Phase 1

Approved Scope:

- Notification Center
- Notification Bell
- Realtime Badge
- Browser Tab Badge
- Deep Linking
- Notification Preferences
- Notification Categories
- Notification History

After Phase 1 is deployed and tested, move to Phase 2.

This rollout strategy fits FoundOurMarket™'s current stage and keeps the support platform stable while steadily evolving toward a true enterprise marketplace support system.

&nbsp;