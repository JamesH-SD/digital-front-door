# Contactor Product

## Product statement

Contactor is a multi-tenant digital front door for service businesses, initially focused on contractors and similar small businesses that need help capturing and converting customer opportunities.

The product combines:

- A professional tenant website for businesses that need one
- An embeddable AI receptionist for businesses that already have a website
- Tenant-specific business knowledge
- Campaign-specific contextual knowledge
- Lead capture
- Scheduling when appropriate
- Customer conversation history and attribution
- Administrative tools that help the business configure and operate the experience

Contactor is not intended to feel like a lead form with a chatbot attached.

The AI receptionist should feel like a helpful front-desk employee who understands the business, answers questions conversationally, recognizes customer intent, captures useful information naturally, and moves the customer toward the correct next step when appropriate.

Current public pricing is a single $49.99/month offer with a 7-day trial represented in the billing UI.

---

## Core product promise

A customer should be able to reach a service business, understand what it offers, ask questions conversationally, and move toward the correct next outcome without the business owner needing to be immediately available.

The experience should feel:

- Professional
- Trustworthy
- Helpful
- Conversational
- Easy for the customer
- Easy for the tenant to operate

Lead capture is an outcome of a good conversation, not the personality of the conversation.

Capturing a lead does not end the conversation.

---

## The Digital Front Door concept

Contactor should provide multiple intelligent entry points into the same business.

A customer may enter through:

- A Contactor-hosted tenant website
- An existing business website using the Contactor JavaScript embed
- A Campaign QR code
- A Campaign URL
- A service CTA
- A project/gallery CTA
- A future advertising or marketing source
- A future Google Business Profile integration

These are different doors into the business, but they should lead into the same intelligent receptionist experience.

The receptionist should preserve useful context about which door the customer entered through whenever that context is available.

---

## Businesses that already have a website

Contactor does not require a tenant to replace an existing website.

If the business already has a website, Contactor provides a JavaScript snippet that can be added to the website, typically in the footer/site template, to load the Contactor AI receptionist.

The existing website remains the business's public website.

Contactor continues to provide the backend capabilities, including:

- AI receptionist
- Knowledge Base
- Campaigns
- Leads
- Scheduling
- AI settings
- Attribution
- Administrative configuration

If the business does not already have an appropriate website, it can use the Contactor-hosted tenant website.

Therefore:

**Contactor-hosted website = optional**

**Contactor AI receptionist = core product**

---

## Campaigns

Campaigns were created to make the AI receptionist itself a contextual marketing destination.

The intent is not merely to generate QR codes or links.

A Campaign can represent a promotion, event, advertising source, physical marketing asset, jobsite opportunity, or other customer acquisition effort.

Examples include:

- Yard signs
- Truck graphics or magnets
- Flyers
- Door hangers
- Postcards
- Business cards
- Trade-show materials
- Social media promotions
- Paid advertising
- Seasonal specials
- Jobsite marketing
- Referral campaigns

### Direct-to-receptionist behavior

When a customer scans a Campaign QR code, the desired experience is:

**Campaign QR → AI Receptionist → Conversation → Lead → Appointment when appropriate**

The customer should not be forced to land on a generic tenant website first.

Opening the receptionist directly reduces friction and preserves the customer's immediate intent.

The receptionist should know which campaign or campaign asset caused the conversation whenever attribution data is available.

---

## Campaign knowledge

Campaigns can contain knowledge specific to that promotion or marketing effort.

Examples:

- Promotion details
- Eligible products or services
- Expiration dates
- Special terms
- Images
- PDFs
- Campaign instructions
- Supporting information

This allows the AI receptionist to answer questions in the context of the specific campaign instead of relying only on general tenant knowledge.

Example:

A customer scans a QR code for a window replacement promotion and asks:

"Does this special include sliding doors?"

The receptionist should understand the promotion that generated the conversation and answer using the associated Campaign knowledge.

Campaign knowledge supplements tenant knowledge; it does not replace the tenant's broader business knowledge.

---

## Campaign attribution

Campaigns are also intended to help businesses understand whether their marketing is producing meaningful customer activity.

The implemented attribution model follows the concept:

**Campaign → Campaign Asset → QR/Link → Chat Session → Lead**

Campaign assets allow multiple marketing sources to exist under one Campaign.

Example:

**Spring Window Replacement Campaign**

- Postcard
- Yard sign
- Truck QR
- Facebook promotion
- Home-show banner

The long-term value is not simply counting scans.

Contactor should increasingly help the tenant understand the customer journey:

**Marketing source → Conversation → Lead → Appointment → Conversion**

This can eventually help a small business understand which marketing efforts actually generate opportunities without requiring the owner to understand complex marketing analytics.

---

## Context-aware customer entry

Campaigns established an important product pattern:

**Entry point → context → receptionist**

That same principle should extend to other areas of Contactor.

Examples:

### Project Gallery

A customer clicks "Learn More" or "Ask About Similar Work" on a specific project.

The receptionist should receive structured project context so it understands which project the customer was viewing.

### Services

A customer clicks a CTA on a specific service.

The receptionist should know which service initiated the conversation.

### Campaigns

A customer scans a campaign-specific QR code.

The receptionist should know the campaign and asset context.

The customer should not need to repeat information the interface already knows.

---

## AI receptionist philosophy

The AI receptionist must always remain conversational.

It should not behave as though it has one task to complete and then attempt to end the interaction.

It should:

- Answer legitimate business questions
- Understand intent conversationally
- Gather information naturally
- Capture leads when appropriate
- Offer scheduling only when allowed by the tenant's workflow
- Continue helping after lead capture
- Continue helping after scheduling
- Use tenant and campaign knowledge appropriately
- Avoid repeating questions already answered
- Avoid forcing every conversation toward a lead prematurely
- Avoid falsely claiming that an appointment, estimate, reservation, payment, order, or other outcome has occurred

The AI can guide the conversation, but deterministic application logic remains authoritative for operational truth.

---

## Tenant experience philosophy

Contactor is designed for business owners who may not be technical and may not want to learn software terminology.

The product should follow KISS:

**Keep It Simple.**

Tenants should not need to understand concepts such as:

- Workflow engines
- Conversion goals
- Interaction types
- Prompt engineering
- Internal AI routing
- Scheduling state machines

Instead, Contactor should ask understandable business questions and translate the answers into the required internal configuration.

A core product principle is:

**Contactor should hide complexity from the tenant without hiding capability.**

---

## AI-assisted administration

The long-term product direction includes three related AI experiences:

**Wizard AI → Admin AI → Customer AI Receptionist**

### Wizard AI

Helps the tenant configure Contactor during onboarding by understanding the business and reducing manual setup.

### Admin AI

Should eventually understand the capabilities of the Contactor Admin environment and help tenants operate the platform.

Examples include:

- "Add La Mesa to my service area."
- "We're closed Friday."
- "Rewrite this service description."
- "What should I add to my Knowledge Base?"
- "Why aren't customers booking appointments?"
- "Create a spring promotion."
- "How do I add another project?"
- "Which campaign generated the most leads?"
- "My website looks too dark. Help me change it."

Some capabilities may initially be guidance-only. Others can evolve into AI-assisted actions that require tenant approval.

### Customer AI Receptionist

Represents the tenant to the public.

Its job is to communicate naturally, provide useful information, understand customer intent, capture opportunities, and help move customers toward the correct next step.

---

## Tenant website philosophy

The Contactor-hosted website should be more than a place to launch chat.

It should help a small business appear professional, trustworthy, established, and easy to work with.

The tenant should be able to configure the site without code.

Important website capabilities include:

- Business branding
- Tenant colors
- Logo
- Services
- Service areas
- Business hours
- Project Gallery
- FAQs
- Reviews/social proof
- Calls to action
- Context-aware AI entry points

The website should support businesses that do not already have a strong web presence while remaining optional for tenants that already have a website.

---

## Knowledge authority

Contactor should avoid storing contradictory versions of the same business information across multiple admin areas.

The intended authority model is:

### Business Identity

Authoritative for core facts about the business.

Examples:

- Business name
- Contact information
- Address
- License information
- General business identity

### Website Services

Authoritative for the tenant's public-facing service offerings.

### Knowledge Base

Provides deeper supporting knowledge that helps the AI answer customer questions.

### Campaign Knowledge

Provides additional context specific to a Campaign.

These sources should complement each other rather than become competing copies of the same information.

---

## Scheduling and conversation

Scheduling is a capability, not the purpose of every conversation.

The receptionist should only offer or perform scheduling when:

- The tenant's configured workflow allows it
- The customer expresses scheduling intent or accepts an appropriate scheduling offer

The system must not assume that every service business uses the same interaction method.

Lead capture and scheduling are milestones within a conversation, not automatic conversation-ending events.

---

## Google Calendar

Google Calendar integration has been implemented and tested for the scheduling workflow, including:

- Connection
- Availability
- Booking
- Rescheduling
- Cancellation
- Disconnect/reconnect behavior

Google OAuth verification for the current Calendar integration has been approved.

Google Business Profile is a separate future integration and may require its own Google API access, verification, or approval work when implemented.

---

## Current tenant-facing product areas

- Dashboard/admin shell
- Business Identity
- Service Area
- Business Hours
- Calendar connection and scheduling
- Leads and lead detail
- AI Receptionist settings
- Knowledge Base
- Website builder and publishing
- Campaigns
- Campaign knowledge
- Campaign assets
- QR/link attribution
- Account/users/notification preferences
- Billing/subscription
- Onboarding wizard

---

## Public/customer surfaces

- Main Contactor marketing site
- Contactor-hosted tenant website
- Embedded AI receptionist for existing websites
- Campaign QR/link direct receptionist entry
- Tenant website services
- Project Gallery
- Service Areas
- About
- Reviews
- FAQs
- Social links
- Footer
- AI receptionist

Current tenant websites are path-based at `/[tenantSlug]`.

The planned direction is tenant subdomains such as:

`tenant.getcontactor.com`

---

## Product design principles

1. **KISS**
   Tenants should configure business outcomes, not learn internal technical concepts.

2. **Professional, trustworthy, conversational**
   The customer experience should make the tenant feel established and responsive.

3. **Lead capture is an outcome, not the personality**
   The receptionist should help first and capture naturally.

4. **Conversation continuity**
   Lead capture or booking does not end the conversation.

5. **Context should travel with the customer**
   If Contactor knows what campaign, service, or project caused the interaction, the customer should not need to explain it again.

6. **Industry-neutral core**
   Do not embed contractor-only assumptions into platform-wide behavior.

7. **Deterministic operational truth**
   AI can converse and guide, but code must prevent false claims about bookings, payments, availability, orders, reservations, estimates, or fulfillment.

8. **Single source of truth**
   Avoid duplicate admin configuration that allows business information to conflict.

9. **Hide complexity, preserve capability**
   Contactor can be sophisticated internally while remaining simple for the tenant.

10. **Launch before endless expansion**
    The immediate goal is a stable, credible, sellable V1 rather than completing every future feature before launch.

---

## Near-term product direction

The immediate objective is to finish and launch a stable V1.

Current major areas include:

- AI receptionist workflow stabilization
- Simplified onboarding
- AI-assisted onboarding
- Consistent tenant-facing Booking Flows
- Real tenant website color customization
- Project Gallery improvements
- Context-aware project/service-to-AI handoff
- Service Area / Google Maps presentation
- Reviews
- Tenant subdomains
- Tenant authorization/security review
- Complete signup-to-customer-journey regression testing

Broader features such as Google Business Profile integration and a comprehensive Admin AI operating layer remain important product direction but should not prevent a stable V1 from launching unless explicitly promoted into launch scope.

See:

- `ROADMAP.md`
- `LAUNCH_PLAN.md`
- `CURRENT_STATE.md`
- `DECISIONS.md`
- `WORKFLOWS.md`

for implementation status and priorities
.