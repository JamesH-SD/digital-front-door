# Contactor Product

## Product statement

Contactor is a multi-tenant digital front door for service businesses. Its core experience combines a tenant website with an AI receptionist that can answer questions, use tenant knowledge, capture leads, and—when the tenant's workflow supports it—help schedule customer interactions.

Current marketing code positions the product as an AI receptionist, lead capture, scheduling, and website toolkit for service businesses. Current public pricing is a single $49.99/month offer with a 7-day trial represented in the billing UI.

## Core product promise

A customer should be able to reach a service business, understand what it offers, ask questions conversationally, and move toward the correct next outcome without the business owner needing to be immediately available.

## Tenant-facing product areas visible in the reviewed code

- Dashboard/admin shell
- Business details / identity
- Service area
- Business hours
- Calendar connection and scheduling
- Leads and lead detail
- AI Receptionist settings
- Knowledge Base
- Website builder and publishing
- Campaigns, campaign knowledge, QR/link assets, and attribution
- Account/users/notification preferences
- Billing/subscription
- Onboarding wizard

## Public/customer surfaces

- Main Contactor marketing site
- Tenant public website at the current path-based route `/[tenantSlug]`
- Embedded AI chat mode
- Campaign/QR landing routes that preserve campaign attribution
- Tenant website sections including hero, Why Us, services, project gallery, service areas, about, reviews, FAQs, social links, and footer

## Product design principles

- KISS: tenants should configure business outcomes, not learn internal technical concepts.
- Industry-neutral core: do not embed contractor-only assumptions into platform-wide behavior.
- Deterministic operations: AI can converse and guide, but code must prevent false claims about bookings, payments, availability, orders, reservations, estimates, or fulfillment.
- Conversation continuity: capturing a lead does not mean the AI should stop helping.
- Tenant-specific knowledge and process should influence the conversation without replacing deterministic workflow controls.
- Tenant admins should be able to customize the public experience without needing to edit code.

## Near-term product direction

The immediate goal is a stable, credible, sellable V1 rather than completing every future idea before launch. Major future/near-launch priorities are tracked in `ROADMAP.md` and separated from true launch blockers in `LAUNCH_PLAN.md`.
