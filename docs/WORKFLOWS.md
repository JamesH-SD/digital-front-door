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
Estimate stabilization (2026-09-22): `bookingType === "estimate"` is intentionally non-scheduling via `getBookingFlowConfig()`. After lead capture, conversation continues; scheduling is not auto-offered. Post-capture customer details and scheduling-adjacent corrections on non-scheduling flows persist to `customer_updates` before confirmation. Manual regression on this tenant verified lead capture, continued conversation, persisted updates (including delivery→pickup correction), knowledge Q&A after capture, and no Estimate appointment scheduling. Consultation semantics elsewhere (e.g. Hughes General) remain unchanged.

**Next workflow stabilization:** Lead Copilot workflow awareness for Estimate and other Booking Flows (not fixed in this checkpoint).

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

The current seven-step wizard is functional but too technical. Future onboarding should collect only what is necessary to get a business operational, use AI to assist with content/configuration, and defer advanced settings to admin screens.
