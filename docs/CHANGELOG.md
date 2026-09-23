# Contactor Project Memory Changelog

This is a lightweight context changelog, not a substitute for Git history.

## 2026-09-22 — Estimate flow and post-capture customer update stabilization

- Stabilized `bookingType === "estimate"` as intentionally non-scheduling via `getBookingFlowConfig()` (no auto call/site-visit scheduling path; tenant Next Step / human follow-up lead-created reply).
- Wired high-confidence `add_customer_detail` post-capture persistence with persist-before-confirm and activity timeline events.
- Added non-scheduling fallback when `start_scheduling` cannot run (`requiresAppointment === false`): persist customer preference/correction as `customer_updates` instead of false AI confirmation.
- Added `generatePostCaptureTurn()` presentation guardrails (acknowledge customer wording without claiming durable persistence).
- Manually regression-tested Christian's Trailer Rentals (Estimate): lead capture, continued conversation, persisted updates including delivery→pickup correction, knowledge Q&A after capture.
- Recorded Lead Copilot Booking Flow / transcript awareness as the next stabilization item (not fixed in this checkpoint).
- Documented D-024 (Estimate non-scheduling) and D-025 (post-capture persist-before-confirm).

## 2026-09-02 — Project memory bootstrap

- Created durable AI/project context structure.
- Recorded `getBookingFlowConfig()` as current stabilization authority.
- Recorded TenantConfig/Workflow Engine as future architecture direction, not current migration authorization.
- Recorded current five tenant-facing Booking Flow choices and onboarding inconsistency.
- Recorded launch-first strategy.
- Added known upcoming work: onboarding simplification/AI, real website theming, Maps, multi-image/contextual Project Gallery, reviews, Google Business Profile, Admin AI assistant, and tenant subdomains.
- Added launch-readiness authorization/security audit requirement.

## 2026-08-29 — AI receptionist stabilization handoff (source snapshot)

- Hughes General regression behavior reported restored.
- Isla Cafe lead-capture-only post-capture conversation behavior reported improved.
- Campaign asset-level attribution recorded as implemented.
- Google Calendar connect/booking/reschedule/cancel/disconnect reported tested.
- Estimate/Consultation workflow semantics and Lead Copilot workflow-awareness identified as next audit areas.
