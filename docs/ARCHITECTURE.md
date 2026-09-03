# Contactor Architecture

## Status

Contactor is a Next.js App Router application with tenant-scoped routes, Supabase-backed data access, OpenAI-powered conversational/lead features, Google Calendar integration, Stripe billing, and optional notification integrations visible in the reviewed code.

This document describes the reviewed code snapshot, not an idealized target architecture.

## Current workflow authority

Current production chain:

```text
tenant.bookingType
      ↓
getBookingFlowConfig(tenant)
      ↓
lib/db/chat.ts orchestration
      ↓
AI / lead capture / scheduling
```

`getBookingFlowConfig()` currently defines operational properties including lead creation, appointment requirements, scheduling offers, default appointment type, post-lead conversation allowance, follow-up language, and lead-created reply behavior.

`getTenantConfig()` calls `getBookingFlowConfig()` and introduces a broader capability model: required fields, conversion goal, interaction types, scheduling configuration, successful outcomes, and knowledge sources. It is transitional and not yet the replacement authority.

## Intended future direction

```text
Tenant settings
      ↓
TenantConfig
      ↓
Workflow Engine
      ↓
AI / Scheduling / Lead Capture
```

The future design should separate concerns currently overloaded into Booking Flow:
- conversion outcome
- allowed interaction types
- required data and collection phase
- scheduling capability/provider/rules
- tenant-specific process guidance

Do not perform that migration as part of ordinary stabilization fixes.

## Scheduling model

The reviewed scheduling domain still centers on legacy appointment types `call | site_visit`. `TenantConfig` anticipates a broader interaction model, but the production scheduler is not yet generalized to every conceptual interaction.

## Tenant public website

Current public tenant routing is path-based through `app/[tenantSlug]/page.tsx`.

The public route:
- loads the tenant by slug
- enforces website publication unless preview mode is used
- supports embedded chat
- passes source/campaign/campaign-asset attribution to the chat experience
- renders `TenantWebsite` for the normal public page

A future `tenant.getcontactor.com` subdomain model is planned but is not implemented in the reviewed code snapshot.

## Website settings

`TenantWebsiteSettings` stores brand/content controls such as logo, favicon, primary/accent colors, hero content, services, project gallery, section visibility, social/profile links, FAQ entries, and related copy.

The admin builder already exposes primary/accent color fields, but the public website still contains many hardcoded Tailwind colors. Full theme propagation remains unfinished.

Project gallery entries currently model one `imageUrl` per project. Multi-image projects require a data-model/UI evolution.

Reviews are currently presentation placeholders rather than an imported review data model in the reviewed snapshot.

## Knowledge and campaigns

Tenant-scoped knowledge retrieval is implemented. Campaigns extend this with campaign-specific content and a hierarchy that supports Campaign → Campaign Asset → QR/Link → Chat Session → Lead attribution.

The handoff identifies future semantic/embedding-based RAG as a planned improvement; it is not treated as current production architecture here.

## Authentication and tenant access

The admin tenant layout verifies a signed-in user and then checks tenant membership or platform-admin access before rendering the tenant admin.

However, direct API authorization must be treated separately. Several reviewed admin routes do not visibly perform a route-level membership check, and some use an admin/service-role Supabase client. A complete route authorization audit is a launch requirement. The reviewed code alone is not enough to conclude whether external middleware or database policy closes every gap.

## Billing

Billing UI and Stripe integration routes are present. The admin UI represents trial/subscription state and a 7-day free trial. End-to-end production billing/webhook behavior still belongs in launch verification.

## External integrations visible in the snapshot

- OpenAI: customer conversation and Lead Copilot-related functions
- Supabase: auth/data/storage
- Google Calendar/OAuth: calendar connection and appointment flow
- Stripe: subscription billing
- Twilio/SMS notification support in library code
- Resend/email configuration is referenced by project environment/deployment material but full production verification is outside this code-only snapshot

## Source-set limitation

The uploaded snapshot contained `app`, `components`, `lib`, and `docs`. It did not include the database schema/migrations, full repository root, package manifest, middleware, deployment config, or automated test suite. Re-check this architecture after the full GitHub repository is connected or supplied.
