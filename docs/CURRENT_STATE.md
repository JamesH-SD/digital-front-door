# Contactor Current State

Last reconstructed: 2026-09-02

## Working / substantially present in reviewed code

- Multi-tenant public website route by tenant slug
- Draft/published website behavior and preview mode
- Embedded/customer AI chat entry
- Lead capture and lead-management code paths
- Post-lead conversation behavior
- Call/site-visit scheduling domain and Google Calendar integration
- Tenant Knowledge Base and tenant-scoped retrieval
- Campaign creation, campaign-specific knowledge, marketing assets, QR/link routing, and attribution model
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

## AI receptionist stabilization baseline

The 2026-08-29 handoff records successful critical behavior for:
- Hughes General: contractor/consultation regression baseline
- Isla Cafe: lead-capture-only conversational baseline

It also records the Estimate flow as exposing hardcoded consultation/call/site-visit assumptions that required cleanup. Regression testing remains required after workflow changes.

## Current Booking Flow state

Production config still recognizes eight flow identifiers:
`consultation`, `reservation`, `direct_booking`, `phone_call`, `estimate`, `lead_capture`, `manual_followup`, `product_signup`.

Current tenant-facing AI settings expose five:
`consultation`, `phone_call`, `estimate`, `lead_capture`, `product_signup`.

Known inconsistency: `OnboardingWizard.tsx` still exposes all eight. Fix this during wizard simplification.

## Known unfinished / partial features

### Onboarding wizard
- Seven-step wizard is present.
- It exposes Booking Flow and AI Next Step concepts directly to the tenant.
- Sparkle helpers are local hardcoded generators, not actual AI assistance.
- Needs KISS redesign and alignment with currently supported tenant-facing flows.

### Tenant website customization
- Primary and accent colors can be stored/administered.
- Public website still uses many hardcoded orange/emerald/gray/stone Tailwind classes.
- Full tenant-driven theming is not complete.

### Project Gallery
- One image per project today.
- CTA opens generic chat.
- Needs multiple images per project.
- Needs clicked-project context passed into the AI receptionist.

### Service Area / Maps
- Service area summary, address fields, cities, and related settings exist.
- Public site renders service cities as a list.
- Footer contains a map/location placeholder.
- Google Maps experience is not implemented in this snapshot.

### Reviews
- Reviews section exists visually.
- Public site currently uses placeholder review content.
- Admin copy explicitly anticipates later Google/Yelp/manual review support.
- Real import/storage/display flow is not present in this snapshot.

### Google Business Profile
- Business/profile-related tenant fields exist, including Google Business Profile URL.
- Several business identity/service-area/settings comments are structured with GBP compatibility in mind.
- Actual Google Business Profile API integration is not present in the reviewed snapshot.
- Implementation Chalk Talk/documentation remains planned.

### Admin AI assistant
- Customer AI receptionist and Lead Copilot exist.
- No general cross-admin assistant for how-to help, configuration suggestions, recommendations, and tenant support was found in the reviewed snapshot.

### Tenant subdomains
- Current public route is `/[tenantSlug]`.
- `tenant.getcontactor.com` host/subdomain routing was not found in the reviewed snapshot.

## Launch-risk items requiring verification

- Admin API tenant authorization, especially routes using admin/service-role Supabase access or no obvious membership check
- End-to-end signup → tenant creation → onboarding → admin → website publish → AI → lead → scheduling → billing journey
- Stripe webhook/subscription behavior in production
- Google OAuth production state/verification
- Email delivery/auth-email production configuration
- Error handling and empty states for new tenants
- Build/type/lint/test status against the complete repository

## Unknown because files were not included

- Database schema/migrations and RLS policies
- Middleware/hostname rewrite configuration
- Complete package scripts/dependency versions
- CI/CD configuration
- Full automated test coverage
- Vercel/domain/DNS configuration
