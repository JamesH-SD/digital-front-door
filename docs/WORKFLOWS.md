# Contactor Workflows

## Customer conversation — current conceptual flow

```text
Visitor enters tenant website / campaign / embed
        ↓
Chat session created with source attribution
        ↓
AI conversation + tenant knowledge
        ↓
Required lead fields collected according to current workflow config
        ↓
Lead created when the flow permits/requires it
        ↓
Conversation continues
        ↓
If scheduling is allowed and legitimately triggered:
  interaction selection → availability → booking
```

## Production workflow authority

`getBookingFlowConfig(tenant)` is the current operational contract. It determines whether a flow creates leads automatically, requires a calendar/appointment, offers scheduling after lead creation, allows appointment-type choice, and which lead-created response behavior is used.

`getTenantConfig(tenant)` augments this with required field phases, broader interaction concepts, knowledge configuration, and scheduling settings. It remains transitional.

## Regression guardrails

- Lead capture does not close the conversation.
- Post-capture business/knowledge questions should be answered directly.
- Scheduling cannot hijack unrelated post-capture messages.
- Scheduling only starts when the tenant/flow allows it and the customer expresses or accepts scheduling intent.
- Non-appointment flows must not receive appointment-closing language.
- The AI cannot claim an operational result that deterministic code has not completed.
- Post-capture customer details must be durably persisted before the assistant confirms they were added (**system = truth; AI = presentation**).
- `generatePostCaptureTurn()` may acknowledge what the customer said but must not claim a durable save/update/add/note/record unless persistence was verified elsewhere in the workflow.

## Current tested baselines from the 2026-08-29 handoff

### Hughes General
Contractor/consultation baseline: qualification, lead capture, email collection, phone/site-visit scheduling, image upload, appointment notes, backup contacts, and conversational follow-up were reported working in the latest regression test.

### Isla Cafe
Lead-capture-only baseline: lead creation, continued conversation, knowledge Q&A, and reduced repetitive follow-up/disconnect language were reported working.

### Christian's Trailer Rentals / Estimate
Estimate stabilization (2026-09-22): non-scheduling Booking Flow, post-capture persist-before-confirm, and **Lead Copilot workflow awareness** manually verified. After Refresh Insights on Estimate leads: Copilot does not treat absent appointments as missing, does not push scheduling in Next Step/Suggested Reply, and uses structured lead data plus persisted Customer Updates (including final delivery preference after customer changed mind from pickup). Business questions (e.g. tow-vehicle sufficiency) may remain conversational rather than automatic Customer Updates — accepted for V1.

### Hughes General / Consultation
Consultation baseline includes scheduling when the flow requires it. Lead Copilot regression (2026-09-22): with `requiresAppointment === true` and an actual booked consultation call, Copilot recognizes the appointment, does not list appointment time as missing, and may use the scheduled call in Suggested Next Step while Missing Info focuses on legitimate qualification gaps (budget, scope, address). Post-lead backup contact persisted in Customer Updates can appear in Copilot summary. Preserve this behavior when changing Copilot.

### Contactor tenant
`product_signup` is a special flow and should remain isolated during stabilization.

## Post-capture customer update workflow (current)

```text
Lead already exists
        ↓
Customer sends additional detail or correction
        ↓
interpretMessageIntent() → decideNextAction()
        ↓
Deterministic persistence path when matched:
  - add_customer_detail (high-confidence provide_extra_detail)
  - update_contact_info / add_appointment_note (existing paths)
  - start_scheduling failed + Booking Flow does not require appointment
        → persist preference as customer update (industry-neutral fallback)
        ↓
appendCustomerUpdateToLead() + lead.customer_update_added
        ↓
Assistant confirms only after successful persistence
        ↓
Conversation continues (including generatePostCaptureTurn for other cases,
with presentation guardrails — no false save claims)
```

Broad automatic persistence of every post-capture AI summary block remains disabled.

## Lead Copilot workflow (current)

```text
Lead Detail (admin)
        ↓
leadId → POST /api/ai/lead-copilot
        ↓
Fresh DB Lead (authoritative)
        +
Persisted Customer Updates
        +
getTenantBySlug → getBookingFlowConfig()
        +
Actual appointment records (calendar)
        ↓
buildLeadCopilotContext()
        ↓
generateLeadSummary / generateLeadInsights / generateSuggestedReply
        ↓
Summary | Missing Info | Suggested Next Step | Suggested Reply
        ↓
Cached on lead until Refresh Insights (forceRegenerate)
```

Regression expectations:

- **Estimate (`requiresAppointment === false`):** no missing appointment time solely due to empty fields; no default “confirm/schedule appointment” next step.
- **Consultation (`requiresAppointment === true`) + booked appointment:** appointment satisfied; Copilot may reference the scheduled interaction appropriately.

Chat transcript is **not** part of V1 Copilot context.

## Campaign workflow

```text
Campaign
  ↓
Campaign Asset
  ↓
Permanent QR / Link
  ↓
Chat Session with campaign + asset attribution
  ↓
Lead with attribution
```

Preserve asset-level analytics and the default campaign link.

## Website contextual AI — planned

Desired pattern:

```text
Website item (service / project / campaign context)
      ↓ click CTA
Chat opens
      ↓
Structured context attached to session/message
      ↓
AI explicitly understands what the visitor clicked
```

Do not solve this by merely inserting hidden natural-language text into UI without an auditable context contract. Prefer a structured context identifier plus trusted tenant data.

## Onboarding — planned direction

Onboarding Wizard V2 Phase B1: adaptive step list with explicit `deployment_mode` (`existing_site` | `hosted`, not inferred from `websiteUrl`), services separated from a five-choice “How should Contactor help customers?” step (`bookingType` persistence unchanged; `getBookingFlowConfig()` remains authority), and Calendar shown only when `requiresCalendar` is true.

Phase B2: optional Hours, Calendar (when shown), and Training/Knowledge steps support **Skip for now** without persisting skip flags or altering existing configuration; a toast points to Admin (`/settings/hours`, `/settings/calendar`, `/knowledge`). Training step uses onboarding “Train your AI receptionist” language; Admin nav remains **Knowledge Base**.

Deployment onboarding step, shared readiness, real AI assistance, and Dashboard checklist evolution remain future work.

The prior seven-step wizard exposed legacy Booking Flow choices on the Services step; that path is being replaced incrementally.
