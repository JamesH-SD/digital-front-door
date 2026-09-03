# Contactor Durable Decisions

Use this file for decisions that should constrain future work. Brainstorming belongs in `ROADMAP.md`, not here.

## D-001 — Stabilize before broad workflow migration

**Status:** Active

`getBookingFlowConfig()` remains current production workflow authority. `TenantConfig` is the intended capability-model direction but is not yet the replacement authority.

Do not migrate `tenant.bookingType` to `TenantConfig.conversionGoal` during stabilization.

## D-002 — Lead capture does not end the conversation

**Status:** Active

After a lead is captured, the AI receptionist should remain available for valid business, project, product, knowledge, appointment-note, and related customer questions.

## D-003 — Operational truth must be deterministic

**Status:** Active

Tenant Next Step guidance and AI language cannot be treated as proof that an estimate, reservation, order, payment, subscription, appointment, or other operational action has actually occurred.

## D-004 — Avoid platform-wide contractor assumptions

**Status:** Active

Shared AI/knowledge/workflow helpers should remain industry-neutral. Contractor behavior is a regression baseline, not a justification for hardcoding contractor language across all tenants.

## D-005 — Tenant-facing Booking Flow choices are simplified

**Status:** Active owner direction as of 2026-09-02

Do not offer Reservation/Rental, Direct Service Booking, or Manual Follow-up as tenant-facing Booking Flow choices.

The current AI settings UI exposes:
- Consultation / estimate
- Phone call follow-up
- Quote / estimate request
- Lead capture only
- Product signup

Legacy flow identifiers may remain in internal configuration while stabilization/migration work is ongoing.

## D-006 — KISS onboarding

**Status:** Approved direction

The onboarding wizard should become simpler and should not require a small-business owner to understand Contactor's internal workflow terminology. AI assistance should help create/configure content and choices rather than relying on hardcoded pseudo-AI templates.

## D-007 — Tenant website is a real configurable website

**Status:** Approved direction

Tenant website controls should materially affect the public result, including real brand-color application. Website features should be useful across service-business types, not just contractors.

## D-008 — Contextual website-to-AI handoff

**Status:** Approved direction

When a visitor clicks a contextual CTA such as a project-gallery “Learn More/Ask About This” action, the AI receptionist should know which project/item was clicked and use that context in the conversation.

## D-009 — Finish and launch before completing every expansion idea

**Status:** Active

The project should prioritize a stable, credible, sellable V1. Valuable expansions can follow launch unless they are necessary to make the core customer journey safe and usable.
