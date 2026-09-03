# Contactor Current State

Last reconstructed: 2026-09-02

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
- Lead Copilot-related summary/insight/suggested-reply code
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

The handoff also identified Estimate behavior that exposed hardcoded consultation/call/site-visit assumptions.

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

`getTenantConfig()` remains an emerging capability/configuration layer and is not yet the replacement authority.

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
- Lead Copilot-related AI features exist.

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

- Admin API tenant authorization
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
4. Add meaningful AI assistance to onboarding.
5. Make tenant website customization genuinely functional.
6. Remove misleading placeholder/demo experiences.
7. Audit tenant isolation/admin API authorization.
8. Regression-test the complete customer journey.
9. Launch.
10. Continue high-value expansion without destabilizing the core.

See `LAUNCH_PLAN.md` and `ROADMAP.md` for scope separation.