# Contactor Current State

Last reconstructed: 2026-09-22

## Working / substantially present in current code

- Multi-tenant public website route by tenant slug
- Draft/published website behavior and preview mode
- Embedded/customer AI chat entry
- Existing-site AI receptionist embed path
- Lead capture and lead-management code paths
- Post-lead conversation behavior
- Call/site-visit scheduling domain
- Google Calendar integration
- Google Calendar OAuth approval completed
- Tenant Knowledge Base and tenant-scoped retrieval
- Campaign creation
- Campaign-specific knowledge
- Campaign marketing assets
- QR/link routing
- Campaign/source attribution model
- Direct-to-receptionist Campaign entry behavior
- Website builder with section-level configuration
- Website services as cards with title/description/image/enabled state
- Project Gallery with one image per project and a chat CTA
- FAQ management in website settings
- Service-area settings and public service-city list
- Business-hours settings
- Account/team/notification UI
- Stripe billing/trial UI and billing routes
- Lead Copilot (workflow-aware unified generation via `runLeadCopilot`)
- Main Contactor marketing page

---

## Product entry model

Contactor supports two primary website scenarios.

### Tenant needs a website

The tenant can use the Contactor-hosted tenant website.

Current public route:

`/[tenantSlug]`

Planned direction:

`tenant.getcontactor.com`

### Tenant already has a website

The tenant can keep the existing website and install the Contactor AI receptionist using the provided JavaScript embed/snippet.

`?embed=1` serves the AI receptionist regardless of Contactor-hosted website publication status. Unpublished hosted pages still show “Website Coming Soon” for normal visits and preview (`?preview=true`) unchanged.

The admin embed snippet uses the current app origin for `/widget.js` (for example localhost in development, production host in production).

Tenants may store `deployment_mode`: `existing_site` or `hosted`. The value is explicit (nullable for legacy rows); the app must not infer deployment mode from `website_url`. Onboarding Wizard B1 collects this on the Business step.

The Contactor backend remains responsible for:

- AI receptionist behavior
- Tenant knowledge
- Campaign knowledge
- Leads
- Scheduling
- Attribution
- AI configuration
- Administrative configuration

The Contactor-hosted website is therefore an optional delivery surface.

The AI receptionist and supporting backend are the core product.

---

## Campaign state

Campaigns are implemented as contextual marketing entry points, not merely QR-code generators.

The intended customer flow is:

**Campaign QR/URL → AI Receptionist → Conversation → Lead → Appointment when appropriate**

Campaign QR visitors should not be forced through the general tenant website before reaching the receptionist.

Campaign context and campaign asset attribution should travel into the resulting conversation when available.

Current attribution concept:

**Campaign → Campaign Asset → QR/Link → Chat Session → Lead**

Campaign-specific knowledge can supplement tenant-wide knowledge for promotion-specific questions.

This pattern establishes a broader product direction:

**Entry point → context → receptionist**

Future/contextual examples include:

- Service → receptionist
- Project Gallery item → receptionist
- Campaign → receptionist
- Future external marketing source → receptionist

---

## AI receptionist stabilization baseline

The 2026-08-29 handoff records successful critical behavior for:

- Hughes General: contractor/consultation regression baseline
- Isla Cafe: lead-capture-only conversational baseline

Estimate (`bookingType === "estimate"`) was stabilized as an intentionally **non-scheduling** flow via `getBookingFlowConfig()`. Consultation behavior was not changed.

Regression testing remains required after workflow changes.

Core behavioral guardrails remain:

- Lead capture does not end the conversation.
- Scheduling should only occur when supported by tenant configuration and legitimate customer intent.
- Valid business/knowledge questions should still be answered after lead capture or booking.
- Non-appointment workflows should not produce appointment-specific closing language.
- AI must not invent booking, payment, reservation, fulfillment, estimate, availability, shipping, or order state.
- Tenant Next Step text is guidance, not deterministic operational truth.

---

## Current Booking Flow state

Production configuration still recognizes eight flow identifiers:

`consultation`, `reservation`, `direct_booking`, `phone_call`, `estimate`, `lead_capture`, `manual_followup`, `product_signup`

Current tenant-facing AI settings expose five:

`consultation`, `phone_call`, `estimate`, `lead_capture`, `product_signup`

The following legacy/internal flow identifiers are no longer intended as tenant-facing choices:

- `reservation`
- `direct_booking`
- `manual_followup`

Known inconsistency:

`OnboardingWizard.tsx` still exposes all eight.

This should be corrected during wizard simplification.

Do not perform a broad migration from `tenant.bookingType` to `TenantConfig.conversionGoal` during stabilization.

Current production authority remains:

`tenant.bookingType → getBookingFlowConfig() → chat/workflow behavior`

### Tenant Setup Readiness — C1a library (2026-09-22)

Deterministic shared evaluators live in `lib/readiness/` (`getTenantSetupReadiness()` orchestrator). Operational readiness uses **required** items only for contributing categories; recommended polish (hours, greetings, knowledge training, etc.) does not reduce category percent or `overallPercent`. Knowledge Base is applicable with `contributesToOverall: false`. Calendar applies only for tenant-facing booking types when `getBookingFlowConfig().requiresCalendar`. Website when `deployment_mode === hosted`. **C1b:** hosted Website admin shows operational **Ready / Needs attention** from `getHostedWebsiteOperationalReadiness()`; `getWebsiteBuilderProgress()` keeps the separate 8-item polish percentage. **C2:** Dashboard and onboarding Review use `loadTenantSetupReadiness()` with `TenantSetupProgress`; Finish routes to `/admin/{tenantSlug}`. Shared dependency loader: `loadTenantSetupReadinessDependencies()` (global knowledge count + primary calendar). Product rules: `docs/DECISIONS.md` **D-029**. Platform customer health score unchanged.

`getTenantConfig()` remains an emerging capability/configuration layer and is not yet the replacement authority.

### Estimate flow — current production behavior (2026-09-22)

For `bookingType === "estimate"`, `getBookingFlowConfig()` currently sets:

- `requiresAppointment: false`
- `requiresCalendar: false`
- `shouldOfferSchedulingAfterLeadCreated: false`
- `allowCustomerToChooseAppointmentType: false`
- `allowConversationAfterLead: true`
- `shouldCreateLeadAutomatically: true`

After lead capture, Estimate continues the conversation but does **not** automatically enter call/site-visit scheduling. The lead-created reply starts the estimate request and uses `tenant.nextStepMessage` when present; otherwise it uses human follow-up guidance. The previous hardcoded Estimate append about scheduling a “quick call or on-site visit” was removed.

### Post-capture customer updates — current production behavior (2026-09-22)

Explicit customer details after lead capture are persisted through deterministic workflow paths before the assistant confirms they were added:

- High-confidence `provide_extra_detail` → `add_customer_detail` uses `appendCustomerUpdateToLead()` and `lead.customer_update_added` activity events.
- When high-confidence scheduling intent (`start_scheduling`) cannot run because the Booking Flow does not require an appointment, the customer’s preference/correction is persisted as a customer update instead of falling through to free-form post-capture AI.
- Persist-before-confirm applies: the assistant must not claim information was saved, added, updated, or changed unless the durable write succeeded.
- `generatePostCaptureTurn()` includes presentation guardrails so it does not claim system persistence on its own. Broad automatic persistence of every post-capture AI `customerUpdateSummary` / `summaryText` block remains **disabled**.

**Manual regression (Christian's Trailer Rentals, Estimate):** lead capture, continued conversation, natural post-capture detail persistence, Customer Updates display, Activity Timeline events, delivery→pickup correction after the non-scheduling fallback, and post-capture knowledge Q&A were manually verified. Estimate did not enter appointment scheduling.

### Lead Copilot — current production behavior (2026-09-22)

Unified Lead Copilot (`runLeadCopilot`, `/api/ai/lead-copilot`) generates Summary, Missing Info, Suggested Next Step, and Suggested Reply from **current system truth**, not a stale browser Lead object.

Generation/regeneration path:

- API operates primarily from **`leadId`**
- Fetches the **fresh Lead row** from the database (authoritative structured fields and persisted `customer_updates`)
- Loads tenant → **`getBookingFlowConfig(tenant)`** (production Booking Flow authority; no `TenantConfig.conversionGoal` migration)
- Loads **actual calendar appointment records** when present
- Builds shared context via `lib/ai/buildLeadCopilotContext.ts` (structured lead facts, Customer Updates, Booking Flow rules, appointment facts)
- **No chat transcript** in V1 Copilot context

Appointment semantics in Copilot:

- Distinguishes **Lead Appointment Preference Field**, **calendar appointment record**, and **whether the Booking Flow requires an appointment**
- For `requiresAppointment === false` (e.g. Estimate): empty appointment fields are **not** automatically treated as missing; Copilot must not push scheduling merely because no appointment exists
- For `requiresAppointment === true` (e.g. Consultation): appointment-aware guidance remains; an existing booked appointment can satisfy the scheduling requirement

Cache behavior (accepted V1):

- Complete `ai_*` cache may still be returned until **Refresh Insights** (`forceRegenerate=true`)
- Regeneration always uses fresh DB lead data
- **Not implemented:** auto-regeneration after Customer Updates, stale flags/hashes, background jobs, chat-path OpenAI for Copilot

Unified Copilot prompts are **industry-neutral** (not contractor-only). Legacy individual AI endpoints (`/api/ai/lead-summary`, etc.) remain on their legacy context path.

**Manual regression — Christian's Trailer Rentals (Estimate):** After Refresh Insights, Copilot did not list appointment time as missing, did not push scheduling in Next Step or Suggested Reply, and reflected current delivery preference from structured/persisted context. Customer later changed from pickup to delivery; Copilot delivery preference was correct. F-150 sufficiency asked as a business question was accepted behavior (not forced into Customer Updates in this checkpoint).

**Manual regression — Hughes General (Consultation):** Booked consultation call recognized in Summary; appointment time not listed as missing when calendar appointment exists; Next Step appropriately used scheduled call; Missing Info focused on budget/scope/address; backup contact in Customer Updates appeared in summary.

**Known deferred (Lead Copilot):** Cached output may remain stale until Refresh after later Customer Updates; transcript context intentionally excluded for V1 evaluation; legacy per-endpoint Copilot helpers unchanged.

---

## Known unfinished / partial features

### Onboarding wizard

- Seven-step wizard is present.
- It exposes Booking Flow and AI Next Step concepts directly to the tenant.
- Sparkle helpers are local hardcoded generators, not actual AI assistance.
- Wizard still exposes all eight legacy Booking Flow choices.
- Needs KISS redesign.
- Needs alignment with current five tenant-facing Booking Flows.
- Needs real AI assistance rather than pseudo-AI templates.

Desired direction:

The tenant should answer understandable business questions while Contactor translates those answers into internal configuration.

---

### Tenant website customization

- Primary and accent colors can be stored/administered.
- Public website still uses many hardcoded Tailwind colors.
- Full tenant-driven theming is not complete.

Desired direction:

The tenant should be able to materially change the look and feel of the hosted website without editing code.

---

### Project Gallery

Current:

- One image per project
- Project title/description
- Generic chat CTA

Needed:

- Multiple images per project
- Better project presentation
- Clicked-project context passed into the receptionist

Desired behavior:

**Project CTA → receptionist opens with project context**

The customer should not need to explain which project they clicked.

---

### Service Area / Maps

Current:

- Service-area summary
- Address fields
- Cities
- Radius-related configuration
- Public service-city list
- Footer/location placeholder

Not implemented:

- Full Google Maps presentation
- Map-based service-area experience

---

### Reviews

Current:

- Reviews section exists visually.
- Public website uses placeholder review content.
- Admin copy anticipates future Google/Yelp/manual testimonial support.

Not implemented:

- Real review import
- Review storage/sync
- Production review display workflow

The launch experience should not present placeholder reviews as if they are real customer testimonials.

---

### Google Business Profile

Current:

- Google Business Profile URL-related fields exist.
- Some identity/service-area/settings structures were intentionally designed with GBP compatibility in mind.

Not implemented:

- Google Business Profile API integration
- Review import through GBP
- GBP management/sync
- GBP Chalk Talk/documentation

Google Business Profile is a separate future Google integration.

Google Calendar OAuth approval does not need to be revisited for GBP work.

---

### Admin AI assistant

Current:

- Customer AI receptionist exists.
- Workflow-aware Lead Copilot (Summary, Missing Info, Suggested Next Step, Suggested Reply) exists for Lead Detail.

Not implemented:

- General Admin AI operating layer across tenant admin screens

Desired long-term direction:

Admin AI should understand Contactor capabilities and eventually help with:

- How-to questions
- Configuration guidance
- Suggestions
- Content rewriting
- Business setup
- Website changes
- Knowledge Base recommendations
- Campaign creation
- Lead/campaign insights
- Approved tenant configuration actions

Product AI layers:

**Wizard AI → Admin AI → Customer AI Receptionist**

---

### Tenant subdomains

Current:

`/[tenantSlug]`

Planned:

`tenant.getcontactor.com`

No hostname/subdomain routing implementation has been confirmed in the current repository.

---

## Google Calendar state

Google Calendar integration has been implemented and tested.

Known supported behavior includes:

- Connect
- Availability
- Booking
- Rescheduling
- Cancellation
- Disconnect/reconnect behavior

Google OAuth verification/approval for the current Calendar integration is complete.

This is no longer a launch blocker.

**Calendar OAuth / onboarding (V1):** Wizard Calendar connect uses OAuth state `returnTo` of `/onboarding/{tenantSlug}?step=calendar` (validated internal paths only). Canonical callback: `GET /api/calendar/google/callback` (tenant-scoped callback delegates to the same handler). Success and Google error/cancel redirect back to the safe `returnTo` with `calendar=connected` or `calendar=error` (+ public `reason`: `cancelled`, `failed`, `session`). Login accepts safe `returnTo` (default remains first-tenant dashboard). OAuth start, callback persistence, and `calendar-connections` GET/POST/DELETE require tenant membership or platform admin. GET responses omit OAuth tokens. Same Google account may connect independently per tenant (`tenant_slug` + provider + `calendar_id` upsert); no cross-tenant row reuse.

---

## Knowledge / source-of-truth model

The intended hierarchy is:

### Business Identity

Authoritative for core business facts.

### Website Services

Authoritative for public-facing service offerings.

### Knowledge Base

Provides deeper supporting information used by the AI.

### Campaign Knowledge

Provides campaign-specific context in addition to tenant-wide knowledge.

Avoid creating duplicate admin configuration that causes these sources to contradict one another.

When an actual business conflict cannot be deterministically resolved, defer to the tenant/human rather than inventing truth.

---

## Launch-risk items requiring verification

- Admin API tenant authorization (partial: tenant PATCH and calendar-connections/OAuth start+callback now require membership or platform admin; other tenant-scoped routes still need audit)
- Direct API access to tenant-scoped routes
- Routes using admin/service-role Supabase clients
- End-to-end signup → tenant creation → onboarding → admin → website/embed → AI → lead → scheduling → billing journey
- Stripe webhook/subscription behavior in production
- Email delivery/auth-email production configuration
- Error handling and empty states for new tenants
- Build/type/lint status
- Manual regression coverage for critical AI workflows
- Placeholder/demo content that could appear as real customer/business data
- Existing-site JavaScript embed production behavior
- Website publish behavior

---

## Repository facts now confirmed

The current repository includes:

- `app/`
- `components/`
- `lib/`
- `docs/`
- `public/`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- ESLint configuration
- project-memory documentation

Package scripts currently include development/build/start/lint commands.

No broad automated application test suite has been established as the main development gate.

Use:

- build
- lint
- targeted/manual workflow regression testing

during V1 stabilization unless a dedicated testing task is approved.

---

## Configuration that may exist outside the repository

The repository itself is not the complete authority for externally hosted infrastructure.

Items such as the following may exist primarily in Supabase, Vercel, DNS, Google, Stripe, Resend, or other service configuration:

- Database schema/state
- RLS policies
- Production environment variables
- Domain/DNS configuration
- Deployment configuration
- OAuth application configuration
- External API settings
- Production webhook configuration

Do not assume absence from the repository means the production system lacks the configuration.

---

## Immediate project objective

The current goal is:

**Finish Contactor as a stable, credible, sellable V1 and launch it.**

Priority sequence remains approximately:

1. Stabilize AI/workflow behavior.
2. Fix Booking Flow UI inconsistencies.
3. Simplify onboarding.
4. Add meaningful AI assistance to onboarding — **D1 / D1.1 in code (pending review):** Wizard **tagline** and **about** AI proposals with on-behalf-of-business voice; owner About textarea is primary factual source; Customer Help copy clarifies AI receptionist choices. Services ✨ still template-only until D2. See **D-030** (D1.1 voice notes). Customer AI Receptionist runtime unchanged.
5. Make tenant website customization genuinely functional.
6. Remove misleading placeholder/demo experiences.
7. Audit tenant isolation/admin API authorization.
8. Regression-test the complete customer journey.
9. Launch.
10. Continue high-value expansion without destabilizing the core.

See `LAUNCH_PLAN.md` and `ROADMAP.md` for scope separation.