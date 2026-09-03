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

## Current tested baselines from the 2026-08-29 handoff

### Hughes General
Contractor/consultation baseline: qualification, lead capture, email collection, phone/site-visit scheduling, image upload, appointment notes, backup contacts, and conversational follow-up were reported working in the latest regression test.

### Isla Cafe
Lead-capture-only baseline: lead creation, continued conversation, knowledge Q&A, and reduced repetitive follow-up/disconnect language were reported working.

### Christian's Trailer Rentals / Estimate
The handoff identified a remaining problem where tenant-specific next-step guidance was followed by hardcoded contractor-oriented call/site-visit language. Treat Estimate/Consultation interaction semantics carefully.

### Contactor tenant
`product_signup` is a special flow and should remain isolated during stabilization.

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
