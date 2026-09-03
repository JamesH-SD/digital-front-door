# Contactor Durable Decisions

Use this file for decisions that should constrain future work.

Brainstorming belongs in `ROADMAP.md`, not here.

---

## D-001 — Stabilize before broad workflow migration

**Status:** Active

`getBookingFlowConfig()` remains current production workflow authority.

`TenantConfig` is the intended capability-model direction but is not yet the replacement authority.

Do not migrate:

`tenant.bookingType → TenantConfig.conversionGoal`

during stabilization unless a separate migration task is explicitly approved.

Preserve working behavior before architecture cleanup.

---

## D-002 — Lead capture does not end the conversation

**Status:** Active

After a lead is captured, the AI receptionist should remain available for valid:

- Business questions
- Service questions
- Product questions
- Knowledge questions
- Project questions
- Appointment notes
- Contact updates
- Backup contacts
- Other legitimate customer needs

Lead capture is a milestone in a conversation, not an automatic conversation-ending event.

---

## D-003 — Operational truth must be deterministic

**Status:** Active

Tenant Next Step guidance and AI language cannot be treated as proof that an operational action actually occurred.

The AI must never invent or falsely confirm:

- Estimates
- Reservations
- Orders
- Payments
- Subscriptions
- Appointments
- Availability
- Shipping
- Fulfillment
- Service completion
- Other transactional state

Application/workflow logic determines operational truth.

AI presents that truth conversationally.

Principle:

**System = truth. AI = presentation.**

---

## D-004 — Avoid platform-wide contractor assumptions

**Status:** Active

Shared AI, knowledge, workflow, and scheduling helpers should remain industry-neutral.

Contractor behavior is an important regression baseline, but it is not permission to hardcode contractor-specific language or interaction assumptions throughout the platform.

---

## D-005 — Tenant-facing Booking Flow choices are simplified

**Status:** Active owner direction as of 2026-09-02

Do not offer the following as tenant-facing Booking Flow choices:

- Reservation/Rental
- Direct Service Booking
- Manual Follow-up

Current tenant-facing choices are:

- Consultation / estimate (`consultation`)
- Phone call follow-up (`phone_call`)
- Quote / estimate request (`estimate`)
- Lead capture only (`lead_capture`)
- Product signup (`product_signup`)

Legacy identifiers may remain recognized internally while stabilization/migration work is ongoing.

Do not re-add the removed choices to tenant-facing UI without explicit approval.

---

## D-006 — KISS onboarding

**Status:** Approved direction

The onboarding wizard should become substantially simpler.

Small-business owners should not need to understand Contactor's internal terminology or architecture.

The wizard should avoid exposing concepts such as:

- Conversion goals
- Interaction types
- Workflow engines
- Prompt engineering
- Scheduling-state logic

Instead, the tenant should answer understandable business questions and Contactor should translate those answers into configuration.

AI assistance should provide real help rather than hardcoded pseudo-AI templates.

---

## D-007 — Tenant website is a real configurable website

**Status:** Approved direction

The Contactor-hosted tenant website should be a legitimate professional website, not merely a wrapper around chat.

Tenant controls should materially affect the public result.

This includes real brand-color application and meaningful control over public-facing content.

Website features should work across service-business types, not only contractors.

---

## D-008 — Contextual website-to-AI handoff

**Status:** Approved direction

When a customer enters the AI receptionist from a contextual CTA, known context should travel with the customer.

Examples:

- Project Gallery item
- Service card
- Campaign
- Future marketing source

A customer who clicks a specific project should not need to tell the receptionist which project they clicked.

Pattern:

**Entry point → context → receptionist**

---

## D-009 — Finish and launch before completing every expansion idea

**Status:** Active

The project should prioritize a stable, credible, sellable V1.

Valuable expansions should follow launch unless they are necessary to make the core customer journey safe, functional, credible, or usable.

Do not automatically promote brainstorming into V1 scope.

---

## D-010 — Existing website tenants do not need to replace their website

**Status:** Active product architecture

Contactor supports tenants that already have a website.

These tenants can install the Contactor AI receptionist on the existing website using the provided JavaScript embed/snippet.

The existing website remains the tenant's website.

Contactor continues to provide the backend experience:

- AI receptionist
- Knowledge Base
- Campaigns
- Leads
- Scheduling
- Attribution
- AI configuration
- Admin tools

Therefore:

**The hosted tenant website is optional.**

**The AI receptionist and backend capability are core.**

---

## D-011 — Campaigns are contextual direct-to-AI entry points

**Status:** Active product architecture

Campaigns are not merely QR-code or link generators.

Their purpose is to create contextual customer entry points into the AI receptionist.

Desired flow:

**Campaign QR/URL → AI Receptionist → Conversation → Lead → Appointment when appropriate**

Campaign QR scans should not be forced through the general tenant website first.

The receptionist should preserve Campaign and Campaign Asset context whenever available.

This allows the system to respond intelligently to the marketing source that created the conversation.

---

## D-012 — Campaign knowledge supplements tenant knowledge

**Status:** Active product architecture

Campaigns may contain knowledge specific to a promotion, offer, event, jobsite, marketing source, or other campaign context.

Campaign-specific knowledge should supplement—not replace—the tenant's broader business knowledge.

Examples include:

- Promotion terms
- Products/services
- Expiration dates
- Images
- PDFs
- Special instructions
- Campaign-specific customer information

---

## D-013 — Campaign attribution should connect marketing to outcomes

**Status:** Active product architecture

The current attribution model follows:

**Campaign → Campaign Asset → QR/Link → Chat Session → Lead**

Campaign Assets should allow a tenant to distinguish sources within the same Campaign.

The product direction is to increasingly help the tenant understand:

**Marketing source → Conversation → Lead → Appointment → Conversion**

The goal is useful business insight, not vanity metrics alone.

---

## D-014 — Context known by the interface should not be re-requested from the customer

**Status:** Active product principle

If Contactor already knows what triggered a customer interaction, that context should be passed into the receptionist when technically appropriate.

Examples:

- A specific service
- A specific project
- A Campaign
- A Campaign Asset
- A future advertising source

Do not force the customer to repeat information the interface already knows.

---

## D-015 — The AI receptionist must remain conversational

**Status:** Active product principle

The AI receptionist should behave like a helpful front-desk employee, not like a rigid lead form.

It should:

- Answer legitimate questions
- Gather information naturally
- Understand intent
- Capture opportunities when appropriate
- Offer scheduling only when allowed
- Continue helping after lead capture
- Continue helping after booking
- Avoid premature closing language
- Avoid forcing every conversation into a conversion immediately

Principle:

**Lead capture is an outcome, not the personality of the conversation.**

---

## D-016 — Contactor hides complexity without hiding capability

**Status:** Active product principle

Contactor can be sophisticated internally while remaining simple for the tenant.

Tenants should interact with recognizable business concepts rather than software architecture.

Principle:

**Contactor should hide complexity from the tenant without hiding capability.**

This principle applies to:

- Onboarding
- AI settings
- Website configuration
- Campaigns
- Scheduling
- Knowledge management
- Future Admin AI

---

## D-017 — Avoid competing sources of business truth

**Status:** Active product architecture

Do not create multiple admin areas that independently control the same business fact when that can create contradictory behavior.

Current intended authority hierarchy:

### Business Identity

Core business facts.

### Website Services

Public-facing service/sales truth.

### Knowledge Base

Deeper supporting knowledge.

### Campaign Knowledge

Campaign-specific supporting context.

These sources should complement each other.

Where true ambiguity remains, defer to the tenant/human rather than inventing an answer.

---

## D-018 — Product AI has three intended layers

**Status:** Approved product direction

Contactor's AI direction includes:

**Wizard AI → Admin AI → Customer AI Receptionist**

### Wizard AI

Helps tenants configure Contactor during onboarding.

### Admin AI

Helps tenants understand and operate Contactor, eventually including approved assisted actions.

### Customer AI Receptionist

Communicates with customers and represents the tenant publicly.

These layers should share product understanding but serve different roles and permissions.

---

## D-019 — Admin AI should evolve beyond a help chatbot

**Status:** Approved product direction

Future Admin AI should understand the capabilities of Contactor's admin environment.

It should eventually help with:

- How-to support
- Configuration suggestions
- Content revision
- Website guidance
- Knowledge Base recommendations
- Campaign creation
- Operational insights
- Lead/campaign analysis
- Tenant-approved configuration actions

Initially, some capabilities may remain guidance-only.

AI-assisted mutation of tenant configuration should require appropriate authorization and explicit tenant intent.

---

## D-020 — Google Calendar approval is complete

**Status:** Active factual decision/state

Google Calendar integration and its current OAuth approval process are complete.

Do not treat Google Calendar OAuth verification as an unresolved launch blocker.

Google Business Profile is a separate future integration and should be treated as separate API/approval work.

---

## D-021 — Tenant subdomains are the intended public URL direction

**Status:** Approved direction

Current tenant public routing is path-based:

`/[tenantSlug]`

The intended future public URL model is:

`tenant.getcontactor.com`

Do not assume this is already implemented.

Host/subdomain routing should be implemented as a distinct task with appropriate deployment and domain/DNS validation.

---

## D-022 — Security boundaries must exist at direct API access

**Status:** Active launch requirement

A protected admin page layout is not sufficient protection for tenant-scoped API routes.

Any admin API accepting or deriving a tenant identifier must enforce authenticated tenant authorization at the API/data boundary.

Service-role/admin Supabase access must never substitute for authorization.

Tenant isolation must be explicitly verified before launch.

---

## D-023 — Project memory lives in the repository

**Status:** Active development-process decision

Durable Contactor product and architecture knowledge should live in repository documentation rather than depend solely on long chat threads.

Repository documentation is the institutional memory layer for:

- ChatGPT
- Cursor
- Codex
- Other future AI agents
- Human development review

Relevant files include:

- `AGENTS.md`
- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/CURRENT_STATE.md`
- `docs/DECISIONS.md`
- `docs/WORKFLOWS.md`
- `docs/UI_STANDARDS.md`
- `docs/ROADMAP.md`
- `docs/LAUNCH_PLAN.md`
- `docs/CHANGELOG.md`
- `docs/SOURCES.md`

Code and materially affected project-memory documentation should be updated together when practical.