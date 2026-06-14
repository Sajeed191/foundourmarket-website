## FoundOurMarket™ Email Infrastructure — Completion Plan

The backbone already exists: a retry-capable queue (5 attempts, DLQ, TTL), suppression list, branded sender `FoundOurMarket Support <support@foundourmarket.com>` on the now-configured `notify.foundourmarket.com` domain, five admin email dashboards (health, ops, delivery, queue, identity/DNS), audit logging, in-app notifications, and Customer-360 timeline. This plan closes the concrete gaps rather than rebuilding what works.

### Scope being delivered

**1. Missing transactional + security templates**
Add branded React Email templates (dark luxury header, personalization, Privacy/Terms/Contact footer) and register them:

- Security: `password-changed`, `account-recovery`, `login-new-device` (covers "login alert" + "new device login"), `account-locked`, `suspicious-activity`
- Order: `payment-failed`, `order-processing`, `order-packed`, `order-cancelled`
- Return/Refund: `return-requested`, `return-approved`, `return-rejected`, `refund-initiated` (existing `refund-processed` stays as "completed")
- Support: `ticket-escalated`

**2. Missing account-management lifecycle events**
Extend the `LifecycleEvent` union + `fireLifecycleEvent` + templates for the "removal/restore" side currently absent: `account-reactivated`, `ban-removed`, `ordering-unblocked`, `reviews-restored`. Wire each to its admin action so applying AND lifting every restriction sends email + notification + timeline event + audit log.

**3. Customer-360 timeline blind spot (high value)**
Order and support emails write only to `email_send_log`, so they never appear in the customer timeline (which reads `email_logs`). Fix by also writing an `email_logs` row (with `user_id`) whenever an order/support email is enqueued, so every email a customer receives shows in their timeline and Email History — closing "no untracked communications".

**4. Reliability hardening**
Ensure every new send path follows the existing resilient pattern: log attempt before render, never throw, record `failed`/`suppressed`/`sent`. Confirm retry schedule is documented; the queue already retries via pgmq visibility timeout up to 5 attempts then DLQ.

### Technical notes

- Templates: new `.tsx` files in `src/lib/email-templates/`, each `satisfies TemplateEntry`, registered in `registry.ts`. Reuse the shared dark-luxury layout already used by `lifecycle-emails.tsx`/`order-emails.tsx`.
- Lifecycle: edit `src/lib/customer-lifecycle.server.ts` (add events to union + `NOTIFY_COPY`) and the call sites in `src/lib/customer-admin.functions.ts` so flag-lift actions fire events.
- Timeline fix: add an `email_logs` insert helper used by `order-emails.server.ts` and `support-emails.server.ts`, resolving `user_id` from the order/ticket.
- No DB schema changes are required; `email_logs` and `email_send_log` already exist with the needed columns.

### Platform limits — being upfront (not building)

- **Bulk marketing emails** (promotions, flash deals, recommendations, wishlist price drops, back-in-stock, newsletter): the Lovable email pipeline is for transactional, one-recipient-per-event sends and does not support bulk/marketing campaigns. These should go through a dedicated marketing-email service. I will NOT build these into the transactional queue. (Single triggered emails like a back-in-stock alert to one specific user who opted in can be added later as transactional if you want.)
- **Open-rate / click-rate tracking**: the current pipeline tracks queued → sent → delivered → failed → bounced → complained, but does not ingest open/click events (no tracking pixel / click-wrap webhook). The admin dashboards will continue to show delivery/bounce/complaint/failure rates. Adding opens/clicks would require an external ESP webhook integration — flagged as a separate follow-up.

### Out of scope / already done

- Domain + DNS (SPF/DKIM/DMARC) — handled by the `notify.foundourmarket.com` setup; verifies in Cloud → Emails.
- Deletion/ban force-logout + session revocation — already implemented.
- Admin Email Center dashboards — already exist across five routes.

### Verification

After implementation: typecheck/build passes; send a test through the existing test-email widget; trigger one restriction + one lift and confirm email row in `email_logs`, notification row, timeline entry, and audit log; confirm an order email now appears in the customer timeline.

&nbsp;

FINAL EMAIL INFRASTRUCTURE HARDENING

Before considering the FoundOurMarket email system complete, implement the following enterprise-grade additions.

EMAIL PREFERENCE CENTER

Allow customers to manage optional email preferences.

Mandatory:

- Security Emails
- Order Emails
- Payment Emails
- Shipment Emails

Optional:

- Marketing Emails
- Price Drop Alerts
- Wishlist Alerts
- Back In Stock Alerts

━━━━━━━━━━━━━━━━━━

EMAIL TEMPLATE MANAGEMENT

Create Email Templates admin module.

Features:

- Preview Template
- Send Test Email
- Template Version History
- Last Modified By
- Last Modified Date

━━━━━━━━━━━━━━━━━━

CUSTOMER EMAIL HISTORY

Inside Customer Profile display:

- Sent
- Delivered
- Failed
- Bounced
- Complained

Allow searching and filtering.

━━━━━━━━━━━━━━━━━━

EMAIL FAILURE ALERTING

If delivery repeatedly fails:

- Notify Admin
- Create Audit Log
- Create Dashboard Alert

No silent failures.

━━━━━━━━━━━━━━━━━━

ADMIN ACTIVITY NOTIFICATIONS

Generate internal notifications for:

- Customer Ban
- Customer Restore
- Customer Delete
- Password Reset Trigger
- Ordering Restriction
- Restriction Removal

━━━━━━━━━━━━━━━━━━

FINAL GOAL

Every customer email must be:

Tracked Audited Visible Recoverable Deliverable

Every lifecycle action must produce:

Database Update Audit Log Notification Timeline Event Email Delivery

FoundOurMarket email infrastructure should operate at enterprise ecommerce standards.