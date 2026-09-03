# Contactor UI Standards

This file captures patterns visible in the reviewed admin/public code plus approved direction. Update it when a deliberate UI convention changes.

## Admin experience

- Use the shared `AdminPageHeader` for section title and description.
- Preserve the simplified sidebar information architecture: Business, Leads, Website, Knowledge Base, Campaigns, AI Receptionist, with Account separated near the bottom.
- Business child pages currently include Business Details, Service Area, Hours, and Calendar.
- Website builder uses focused section pages rather than one overwhelming editor.
- Use clear human-facing labels; avoid requiring tenants to understand internal architecture terminology.
- Prefer consistent rounded cards/panels, concise helper copy, and visible save/feedback states.

## Website builder

Current configurable sections include:
- Brand / social links
- Hero
- Why Us
- Services
- Project Gallery
- CTA banner
- Service Areas
- About
- Reviews
- FAQs

Services are intended to be real website cards with image, title, description, enabled/disabled state, and contextual AI CTA capability.

Project Gallery should evolve to multiple images per project while retaining project title/description/visibility and a contextual AI CTA.

## Brand colors

The builder currently stores primary and accent colors, but many public classes remain hardcoded. The target standard is that tenant brand controls produce a coherent public theme across headings, CTA surfaces, hover states, checkmarks/badges, and other brand accents without sacrificing readability/accessibility.

Avoid simply replacing every neutral color with a tenant brand color. Keep neutral text/background hierarchy and apply brand tokens intentionally.

## Public website

- Website should function as a trust-building front door, not merely a chat launcher.
- The AI receptionist should be prominent but should not prevent a visitor from reading business information.
- Contextual CTAs should carry context into AI when relevant.
- Service area presentation should support a real map when appropriate while preserving readable city/service-area information.
- Footer should contain useful business/contact information; map/location should no longer remain a placeholder once Maps is implemented.

## Copy

- Keep customer copy conversational and plain-language.
- Avoid internal terms such as “workflow engine,” “interaction type,” or technical Booking Flow semantics in normal tenant/customer UI unless necessary.
- Do not make false operational promises in AI or website copy.
