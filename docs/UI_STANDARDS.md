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

Website settings store **primary** and **accent** colors (with optional legacy `tenant.primaryColor` fallback for primary). On the hosted site, **primary** is the dominant brand (primary CTAs, section eyebrows, hero treatment, launcher, check icons). **Accent** is supporting only (soft secondary button fills, subtle hero glow, small labels such as chat “Ready to help,” composer border in chat).

Avoid replacing every neutral with brand color. Keep navigation, body copy, and secondary actions such as Call Now neutral unless there is a deliberate branded reason.

## Website content precedence (F1)

Public hosted copy follows: **website-specific override → tenant/business field (Wizard) → restrained generic fallback**. Hero headline uses `websiteSettings.heroHeadline` else `tenant.tagline`; hero description uses override else `tenant.aboutUs`; About body uses override else `tenant.aboutUs`. No AI generation at render time.

Do not show fictional sample reviews on the public site. Omit the reviews section until real review data exists.

Do not show development-style image placeholders on the public site; use text-first layouts when no image is configured.

Tenant-facing website image controls must not imply stock/default images exist when they do not (use “No custom image yet…” / “Remove image”).

**F2 truthfulness:** Business hours, phone, and email come from Business Identity — website settings control visibility/headings only. Trust bar items require stored license/insured facts. FAQs are tenant-authored or a small fact-safe derived set — no generic AI marketing FAQ block. Optional sections (services, FAQs, trust, service area, hours, gallery) do not render when empty/disabled.

**Website admin navigation:** Website setup grid lists section shortcuts (10 rows including **Project Gallery** beside Services). Project Gallery shows **Added** or **Optional** and is excluded from the 9-essential readiness percentage.

## Public website

- Website should function as a trust-building front door, not merely a chat launcher.
- The AI receptionist should be prominent but should not prevent a visitor from reading business information.
- Contextual CTAs should carry context into AI when relevant.
- **F3B service area:** Public hosted site shows Business Identity summary and/or city list; optional formatted street address only when **`showBusinessAddressPublicly`** is enabled in Service Area settings. Maps/geocoding are parked post–V1.
- Footer should contain useful business/contact information (phone, email, service-area text, optional public address).

## Copy

- Keep customer copy conversational and plain-language.
- Avoid internal terms such as “workflow engine,” “interaction type,” or technical Booking Flow semantics in normal tenant/customer UI unless necessary.
- Do not make false operational promises in AI or website copy.
