# AGENTS.md — Contactor AI Development Rules

These rules apply to ChatGPT, Cursor, Codex, and any other AI coding agent working in this repository.

## 1. Read before changing

Before implementation, read:
- `docs/CURRENT_STATE.md`
- `docs/DECISIONS.md`
- `docs/ARCHITECTURE.md`
- the task-relevant source files

For AI receptionist, lead capture, or scheduling changes, also read `docs/WORKFLOWS.md`.

## 2. Current production authority

During stabilization, `getBookingFlowConfig()` remains the production authority for booking/conversion workflow behavior. `getTenantConfig()` is an emerging capability model and currently calls `getBookingFlowConfig()`; it is **not** yet the replacement authority.

Do not migrate `tenant.bookingType` to `TenantConfig.conversionGoal` unless a separate migration task is explicitly approved.

## 3. Make the smallest safe change

- Do not perform broad refactors while fixing a focused bug.
- Do not replace working production behavior solely because a cleaner architecture is possible.
- Trace behavior end-to-end before changing shared workflow code.
- Do not hardcode contractor-specific assumptions into platform-neutral AI helpers.

## 4. Preserve AI receptionist guardrails

- Lead capture does not end the conversation.
- Continue answering valid business/knowledge questions after lead capture or booking.
- Scheduling should only activate when allowed and when the customer expresses scheduling intent or accepts a legitimate offer.
- Do not use appointment-specific closing language for non-appointment flows.
- Tenant Next Step text is guidance; it is not proof that an estimate, reservation, appointment, payment, order, or other outcome occurred.
- Never invent fulfillment, payment, shipping, availability, reservation, or appointment state.
- Preserve the special `product_signup` behavior for the Contactor tenant during stabilization.

## 5. Booking Flow UI rule

The tenant-facing AI settings currently expose five supported choices:
- Consultation / estimate (`consultation`)
- Phone call follow-up (`phone_call`)
- Quote / estimate request (`estimate`)
- Lead capture only (`lead_capture`)
- Product signup (`product_signup`)

`reservation`, `direct_booking`, and `manual_followup` remain recognized in legacy/config code but are no longer intended as tenant-facing Booking Flow choices. Do not re-add them to UI without approval.

The onboarding wizard is currently inconsistent and still exposes all eight; this is a known item to fix.

## 6. Tenant isolation and authorization

Any admin API that accepts a `tenantSlug` must be reviewed for authenticated tenant authorization before launch. Do not assume a protected page layout automatically protects a direct API request.

Service-role/admin Supabase clients must never be used as a substitute for authorization checks.

## 7. Documentation rule

Before completing a task, decide whether the implementation changes:
- current behavior/status → update `docs/CURRENT_STATE.md`
- architecture → update `docs/ARCHITECTURE.md`
- a durable decision → update `docs/DECISIONS.md`
- AI/customer workflow → update `docs/WORKFLOWS.md`
- visual/admin conventions → update `docs/UI_STANDARDS.md`
- priorities → update `docs/ROADMAP.md` or `docs/LAUNCH_PLAN.md`
- a material shipped milestone → append `docs/CHANGELOG.md`

Do not promote brainstorming into an approved decision.

## 8. Completion checklist

Before presenting a task as complete:
1. List files changed and why.
2. Run available type/build/lint/tests relevant to the change.
3. Report failures rather than hiding or bypassing them.
4. Regression-test affected workflow paths.
5. Update project-memory docs when materially affected.
6. Keep code and documentation changes in the same commit when practical.
