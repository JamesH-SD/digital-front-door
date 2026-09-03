# Contactor V1 Launch Plan

Goal: get Contactor to a stable, credible, sellable V1 without delaying launch for every future enhancement.

## Phase 0 — Freeze and protect

**Objective:** avoid creating new regressions while finishing.

- Use `AGENTS.md` for every Cursor/AI task.
- Create a Git branch for each focused change.
- Keep code and project-memory updates together.
- Do not perform broad TenantConfig/workflow migrations during stabilization.

## Phase 1 — Finish AI workflow stabilization

**Exit criteria:** supported tenant flows behave deterministically and regression tenants still work.

Tasks:
- Re-audit current five tenant-facing flow behaviors against production config.
- Confirm Estimate/Consultation no longer produces inappropriate double next-step or contractor-only assumptions.
- Audit Lead Copilot for workflow/appointment awareness.
- Regression-test Hughes General, Isla Cafe, Estimate scenario, and Contactor `product_signup`.

## Phase 2 — Simplify onboarding

**Exit criteria:** a new service-business tenant can get through setup without understanding internal Contactor architecture.

Tasks:
- Remove legacy tenant-facing Reservation, Direct Booking, and Manual Follow-up choices from onboarding.
- Reassess whether Booking Flow and Next Step should be shown directly at all.
- Reduce required inputs to the true launch essentials.
- Preserve ability to skip advanced items and finish them in admin.
- Replace hardcoded sparkle generators with either real AI assistance or remove them until AI assistance is ready.
- Verify onboarding saves safely and lands the tenant in a usable admin state.

## Phase 3 — Tenant website V1 quality

**Exit criteria:** a tenant can publish a website that looks intentionally branded and contains no obvious placeholder experience.

Tasks:
- Make `primaryColor` / `accentColor` drive public brand tokens consistently.
- Verify service cards, FAQs, gallery, service areas, social links, and publishing behavior.
- Decide how to handle Reviews for launch: real data/import, manual tenant entries, or hide the section by default. Do not ship fake/sample testimonials as if real.
- Replace or intentionally hide the footer map placeholder until Maps is implemented.
- Test responsive/mobile behavior.

## Phase 4 — Security and tenant isolation audit

**Exit criteria:** direct API requests cannot mutate/read another tenant without authorization.

Tasks:
- Enumerate every `/api/admin/tenants/[tenantSlug]/...` route.
- Verify signed-in user + tenant membership/platform support authorization at the route or an equivalent trusted layer.
- Pay special attention to routes using `createAdminClient()`.
- Verify Supabase RLS/service-role boundaries using the actual database policies/migrations.
- Verify upload file type/size/storage paths and tenant isolation.
- Verify platform-admin/support-mode behavior cannot leak tenant data.

## Phase 5 — Full production journey test

**Exit criteria:** a real new customer can go from discovery to paid/usable tenant without developer intervention.

Test sequence:
1. Marketing site → Get Started
2. Signup / email confirmation
3. Tenant creation
4. Onboarding
5. Admin settings
6. Knowledge upload/manual entry
7. Website configuration + publish
8. Public visitor chat
9. Lead capture
10. Scheduling where enabled
11. Lead visible/admin actions
12. Campaign QR/link attribution
13. Trial/subscription checkout
14. Billing portal/cancel/reactivate as applicable
15. Auth email/reset flows

## Phase 6 — Launch

- Production domain/DNS verification
- Production env-secret verification
- Stripe live-mode/webhook verification
- Google OAuth production verification
- Email sending/auth-template verification
- Analytics/logging/error-monitoring check
- Smoke test at least two representative tenants

## Post-launch sequence

Recommended order after core V1 is live:
1. AI-assisted onboarding
2. Project Gallery multi-image + contextual AI handoff
3. Google Maps service-area/footer experience
4. Tenant subdomains
5. Real reviews import/display
6. Google Business Profile integration + Chalk Talk
7. Cross-admin AI assistant

## Scope limitation

This plan was produced from an uploaded partial code snapshot. Before declaring launch-ready, repeat the audit against the complete GitHub repository, database schema/migrations, production configuration, and deployment environment.
