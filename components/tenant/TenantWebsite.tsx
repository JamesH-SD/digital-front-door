"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Menu,
  MessageCircle,
  X,
} from "lucide-react";
import {
  resolveWebsiteAboutBody,
  resolveWebsiteBrandColors,
  resolveWebsiteHeroDescription,
  resolveWebsiteHeroHeadline,
} from "@/lib/website/resolveTenantWebsitePresentation";
import { resolveWebsiteServicesSection } from "@/lib/website/resolveWebsiteServicesSection";
import { getPublicBusinessHoursRows } from "@/lib/website/formatBusinessHours";
import { getPublicFaqs } from "@/lib/website/getPublicFaqs";
import { getPublicTrustLabels } from "@/lib/website/getPublicTrustLabels";
import {
  getPublicWebsiteServices,
  tenantHasPublicServiceAreaContent,
} from "@/lib/website/getPublicWebsiteServices";
import {
  FaFacebook,
  FaInstagram,
  FaYelp,
  FaGoogle,
} from "react-icons/fa";
import type { Tenant } from "@/lib/types/tenant";
import { ChatWidget } from "@/components/chat/ChatWidget";

type Props = {
  tenant: Tenant;
  leadSource: string;
  campaignId?: string;
  campaignAssetId?: string;
  autoOpenChat?: boolean;
  isPreview?: boolean;
};

function formatPhoneHref(phone?: string) {
  if (!phone) return "";
  return `tel:${phone.replace(/\D/g, "")}`;
}

function formatEmailHref(email?: string) {
  if (!email?.trim()) return "";
  return `mailto:${email.trim()}`;
}

function getProjectGallery(tenant: Tenant) {
  const gallery = tenant.websiteSettings?.projectGallery || [];

  return gallery.filter(
    (item) => item.enabled !== false && item.imageUrl?.trim() && item.title?.trim()
  );
}

export function TenantWebsite({
  tenant,
  leadSource,
  campaignId,
  campaignAssetId,
  autoOpenChat = false,
  isPreview = false,
}: Props) {
  const [chatOpen, setChatOpen] = useState(autoOpenChat);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(0);

  const websiteSettings = tenant.websiteSettings || {};

  const phoneHref = formatPhoneHref(tenant.primaryPhone);
  const emailHref = formatEmailHref(tenant.email);
  const services = getPublicWebsiteServices(tenant);
  const projectGallery = getProjectGallery(tenant);
  const faqs = getPublicFaqs(tenant);
  const trustLabels = getPublicTrustLabels(tenant);
  const businessHoursRows = getPublicBusinessHoursRows(tenant.hours);
  const hasServiceAreaContent = tenantHasPublicServiceAreaContent(tenant);
  const hasAuthoredFaqs = (websiteSettings.faqs || []).some(
    (faq) =>
      faq.enabled !== false &&
      faq.question?.trim() &&
      faq.answer?.trim()
  );
  const brand = resolveWebsiteBrandColors(tenant, websiteSettings);
  const brandStyle = {
    ["--tenant-primary" as string]: brand.primary,
    ["--tenant-primary-hover" as string]: brand.primaryHover,
    ["--tenant-primary-button-text" as string]: brand.primaryButtonText,
    ["--tenant-accent" as string]: brand.accent,
    ["--tenant-accent-hover" as string]: brand.accentHover,
  } as CSSProperties;

  const socialLinks = [
    {
      label: "Facebook",
      href: websiteSettings.facebookUrl,
      icon: FaFacebook,
      colorClass: "text-[#1877F2]",
    },
    {
      label: "Instagram",
      href: websiteSettings.instagramUrl,
      icon: FaInstagram,
      colorClass: "text-[#E4405F]",
    },
    {
      label: "Yelp",
      href: websiteSettings.yelpUrl,
      icon: FaYelp,
      colorClass: "text-[#FF1A1A]",
    },
    {
      label: "Google Business",
      href: websiteSettings.googleBusinessUrl,
      icon: FaGoogle,
      colorClass: "text-[#4285F4]",
    },
  ].filter((link) => Boolean(link.href?.trim()));

  const heroHeadline = resolveWebsiteHeroHeadline(tenant);

  const heroDescription = resolveWebsiteHeroDescription(tenant);

  const heroPrimaryCtaLabel =
    websiteSettings.heroPrimaryCtaLabel || "Ask Our Receptionist";

  const heroSecondaryCtaLabel =
    websiteSettings.heroSecondaryCtaLabel || "Call Now";
  
    const heroAiCardMessage =
    websiteSettings.heroAiCardMessage ||
    "Tell us what you need help with. We can answer questions, collect details, and help guide the next step.";
  
  const floatingChatLabel =
    websiteSettings.floatingChatLabel || "Chat with us";

  const whyUsHeading =
    websiteSettings.whyUsHeading || "Why Us";

  const whyUsTitle =
    websiteSettings.whyUsTitle ||
    "Built to make the first conversation easier";

  const whyUsFeatures = [
    {
      title: websiteSettings.whyUsBullet1Title || "Easy to reach",
      text:
        websiteSettings.whyUsBullet1Text ||
        "Customers can ask questions online without waiting for a callback.",
    },
    {
      title: websiteSettings.whyUsBullet2Title || "Project details captured",
      text:
        websiteSettings.whyUsBullet2Text ||
        "The receptionist collects the important details so follow-up is more useful.",
    },
    {
      title: websiteSettings.whyUsBullet3Title || "Trust signals up front",
      text:
        websiteSettings.whyUsBullet3Text ||
        "License, insurance, service area, and business information are visible before a customer reaches out.",
    },
  ];

  const bannerHeading =
  websiteSettings.bannerHeading || "Ready to Get Started?";

  const bannerTitle =
    websiteSettings.bannerTitle || "Tell us about your project.";

  const bannerDescription =
    websiteSettings.bannerDescription ||
    "Our AI receptionist can answer questions, collect project details, and help schedule the next step.";

  const bannerButtonLabel =
    websiteSettings.bannerButtonLabel || "Start Conversation";

    const serviceAreasHeading =
    websiteSettings.serviceAreasHeading || "Service Areas";
  
  const serviceAreasTitle =
    websiteSettings.serviceAreasTitle?.trim() ||
    tenant.serviceAreaSummary?.trim() ||
    "Serving our local community";

  const businessHoursHeading =
    websiteSettings.businessHoursHeading || "Business Hours";

  const businessHoursTitle =
    websiteSettings.businessHoursTitle || "When we're available";

  const showBusinessHoursSection =
    websiteSettings.showBusinessHours !== false && businessHoursRows.length > 0;

    const projectGalleryHeading =
    websiteSettings.projectGalleryHeading || "Project Gallery";
  
  const projectGalleryTitle =
    websiteSettings.projectGalleryTitle || "Recent work";
  
  const projectGalleryDescription =
    websiteSettings.projectGalleryDescription ||
    "Browse a few examples of completed projects and ask our AI receptionist about similar work.";
  
  const faqsHeading = websiteSettings.faqsHeading || "FAQs";
  
  const faqsTitle =
    websiteSettings.faqsTitle || "Frequently asked questions";
  
  const faqsDescription =
    websiteSettings.faqsDescription ||
    "Still have questions? Ask the AI receptionist and we’ll help get the conversation started.";
  
  const faqsButtonLabel =
    websiteSettings.faqsButtonLabel || "Ask a Question";

  const aboutHeading =
    websiteSettings.aboutHeading || "About Us";

  const aboutTitle =
    websiteSettings.aboutTitle ||
    `About ${tenant.businessName}`;

  const aboutBody = resolveWebsiteAboutBody(tenant);

  const aboutCtaLabel =
    websiteSettings.aboutCtaLabel ||
    "Ask About Your Project";

  const {
    heading: servicesSectionHeading,
    title: servicesSectionTitle,
    description: servicesSectionDescription,
  } = resolveWebsiteServicesSection(tenant);

  useEffect(() => {
    if (autoOpenChat) {
      setChatOpen(true);
    }
  }, [autoOpenChat]);

  function openChat() {
    setChatOpen(true);
    setMobileNavOpen(false);
  }

  const whyUsImageUrl = websiteSettings.whyUsImageUrl?.trim();
  const aboutImageUrl = websiteSettings.aboutImageUrl?.trim();

  return (
    <main
      className="tenant-website min-h-screen overflow-x-hidden bg-white text-gray-950"
      style={brandStyle}
    >
      {/* NAV */}
      {isPreview && (
        <div className="fixed left-0 right-0 top-0 z-[60] border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
          Preview Mode — This website is not published yet.
        </div>
      )}
      <header
        className={`fixed left-0 right-0 z-50 border-b border-stone-200 bg-white/90 backdrop-blur-md ${
          isPreview ? "top-12" : "top-0"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <a href="#" className="flex min-w-0 items-center gap-3">
          {websiteSettings.logoUrl ? (
            <img
              src={websiteSettings.logoUrl}
              alt={`${tenant.businessName} logo`}
              className="h-10 w-10 rounded-xl object-contain"
            />
          ) : (
            <div className="tenant-brand-primary-bg flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white">
              {tenant.businessName.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-950">
              {tenant.businessName}
            </p>
            <p className="hidden truncate text-xs text-gray-500 sm:block">
              {tenant.tagline?.trim() ||
                tenant.primaryCategory ||
                "Local Service Business"}
            </p>
          </div>
        </a>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-gray-600 md:flex">
            <a href="#why-us" className="hover:text-gray-950">
              Why Us
            </a>
            <a href="#services" className="hover:text-gray-950">
              Services
            </a>
            <a href="#about" className="hover:text-gray-950">
              About
            </a>
            <a href="#faqs" className="hover:text-gray-950">
              FAQs
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {tenant.primaryPhone ? (
              <a
                href={phoneHref}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-stone-50"
              >
                Call Now
              </a>
            ) : null}

            <button
              type="button"
              onClick={openChat}
              className="saas-button-accent rounded-xl px-4 py-2 text-sm font-semibold shadow-sm"
            >
              {heroPrimaryCtaLabel}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white shadow-sm md:hidden"
            aria-label="Menu"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileNavOpen ? (
          <div className="border-t border-stone-200 bg-white px-5 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm font-semibold text-gray-700">
              <a href="#why-us" onClick={() => setMobileNavOpen(false)}>
                Why Us
              </a>
              <a href="#services" onClick={() => setMobileNavOpen(false)}>
                Services
              </a>
              <a href="#about" onClick={() => setMobileNavOpen(false)}>
                About
              </a>
              <a href="#faqs" onClick={() => setMobileNavOpen(false)}>
                FAQs
              </a>
              <button
                type="button"
                onClick={openChat}
                className="saas-button-accent mt-2 rounded-xl px-4 py-3 text-sm font-semibold"
              >
                {heroPrimaryCtaLabel}
              </button>
            </div>
          </div>
        ) : null}
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gray-950">
        {/*
          If a tenant uploads a Hero Image, use it as the full hero background.
          The dark overlay keeps the text readable while preserving the uploaded brand image.

          Important:
          The AI Receptionist card stays visible at all times because it is the primary
          conversion path for Digital Front Door. The hero image should support trust,
          not replace the AI card.
        */}
        {websiteSettings.heroImageUrl ? (
          <>
            <img
              src={websiteSettings.heroImageUrl}
              alt={`${tenant.businessName} hero`}
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/65" />
          </>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 85% 15%, color-mix(in srgb, ${brand.accent} 22%, transparent), transparent 24%), radial-gradient(circle at 15% 25%, color-mix(in srgb, ${brand.primary} 50%, transparent), transparent 32%), linear-gradient(145deg, ${brand.primary} 0%, #0f172a 100%)`,
            }}
          />
        )}

        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-20 text-white sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-28">
          <div>
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              AI Receptionist Online
            </p>

            <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
              {heroHeadline}
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-white/80 sm:text-lg">
              {heroDescription}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openChat}
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-stone-100"
              >
                {heroPrimaryCtaLabel}
              </button>

              {tenant.primaryPhone ? (
                <a
                  href={phoneHref}
                  className="rounded-xl border border-white/25 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-white/10"
                >
                  {heroSecondaryCtaLabel}
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
            <div className="rounded-2xl bg-white p-5 text-gray-950">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                  style={{ backgroundColor: brand.primary }}
                >
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold">AI Receptionist</p>
                  <p className="text-xs text-gray-500">Ready to help</p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-gray-600">
                “{heroAiCardMessage}”
              </p>

              <button
                type="button"
                onClick={openChat}
                className="saas-button-accent mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold"
              >
                {heroPrimaryCtaLabel}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      {trustLabels.length > 0 ? (
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-3 px-5 py-5 text-sm font-semibold text-gray-700 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {trustLabels.map((label) => (
            <TrustItem key={label} label={label} />
          ))}
        </div>
      </section>
      ) : null}

      {/* WHY US */}
      {websiteSettings.showWhyUs !== false ? (
      <section id="why-us" className="bg-stone-50 py-16">
        <div
          className={`mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:items-center ${
            whyUsImageUrl ? "lg:grid-cols-[0.9fr_1.1fr]" : ""
          }`}
        >
          {whyUsImageUrl ? (
            <div className="min-h-[340px] overflow-hidden rounded-3xl shadow-sm">
              <img
                src={whyUsImageUrl}
                alt={`${tenant.businessName} work`}
                className="h-full min-h-[340px] w-full object-cover object-center"
              />
            </div>
          ) : null}

          <div>
            <p className="tenant-brand-primary-text text-xs font-bold uppercase tracking-wide">
              {whyUsHeading}
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              {whyUsTitle}
            </h2>

            <div className="mt-7 space-y-5">
            {whyUsFeatures.map((feature) => (
              <Feature
                key={feature.title}
                title={feature.title}
                text={feature.text}
              />
            ))}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* SERVICES */}
      {websiteSettings.showServices !== false && services.length > 0 ? (
        <section id="services" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="tenant-brand-primary-text text-xs font-bold uppercase tracking-wide">
                {servicesSectionHeading}
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                {servicesSectionTitle}
              </h2>

              {servicesSectionDescription ? (
                <p className="mt-4 text-sm leading-7 text-gray-600">
                  {servicesSectionDescription}
                </p>
              ) : null}
            </div>

            <div
              className={`mx-auto grid max-w-5xl grid-cols-[repeat(auto-fit,minmax(240px,1fr))] justify-center gap-5 ${
                servicesSectionDescription ? "mt-10" : "mt-8"
              }`}
            >
              {services.map((service) => (
                <article
                  key={service.id}
                  className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"
                >
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.title}
                      className="h-44 w-full object-cover object-center"
                    />
                  ) : null}

                  <div className={service.imageUrl ? "p-5" : "p-6"}>
                    <h3 className="text-lg font-bold text-gray-950">
                      {service.title}
                    </h3>

                    {service.description ? (
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {service.description}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={openChat}
                      className="tenant-brand-accent-soft mt-5 w-full rounded-xl border px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:opacity-90"
                    >
                      Ask About This Service
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {websiteSettings.showProjectGallery !== false && projectGallery.length > 0 ? (
        <section id="project-gallery" className="bg-stone-50 py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="tenant-brand-primary-text text-xs font-bold uppercase tracking-wide">
                {projectGalleryHeading}
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                {projectGalleryTitle}
              </h2>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                {projectGalleryDescription}
              </p>
            </div>

            <div className="mt-10 flex gap-5 overflow-x-auto pb-3">
              {projectGallery.map((item) => (
                <article
                  key={item.id}
                  className="w-[280px] shrink-0 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm sm:w-[340px]"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-52 w-full object-cover object-center"
                  />

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-950">
                      {item.title}
                    </h3>

                    {item.description ? (
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {item.description}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={openChat}
                      className="tenant-brand-accent-soft mt-5 w-full rounded-xl border px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:opacity-90"
                    >
                      Ask About Similar Work
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* BANNER CTA */}
      {websiteSettings.showBanner !== false ? (
        <section className="bg-gray-950 py-14 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="tenant-brand-primary-text text-xs font-bold uppercase tracking-wide">
                {bannerHeading}
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                {bannerTitle}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                {bannerDescription}
              </p>
            </div>

            <button
              type="button"
              onClick={openChat}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-gray-950 shadow-sm transition hover:bg-stone-100"
            >
              {bannerButtonLabel}
            </button>
          </div>
        </section>
      ) : null}

      {/* SERVICE AREAS */}
      {websiteSettings.showServiceAreas !== false && hasServiceAreaContent ? (
        <section className="bg-stone-50 py-16">
          <div className="mx-auto max-w-6xl px-5 text-center sm:px-6">
          <p className="tenant-brand-primary-text text-xs font-bold uppercase tracking-wide">
            {serviceAreasHeading}
          </p>

            <h2 className="mx-auto mt-6 max-w-4xl text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
              {serviceAreasTitle}
            </h2>

            {tenant.serviceCities?.length ? (
              <ul className="mx-auto mt-8 grid max-w-5xl gap-x-10 gap-y-5 text-left sm:grid-cols-2 lg:grid-cols-3">
                {tenant.serviceCities.map((city) => (
                  <li
                    key={city}
                    className="flex items-center gap-3 text-lg font-semibold text-gray-800"
                  >
                    <span className="tenant-brand-primary-bg flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                      ✓
                    </span>
                    <span>{city}</span>
                  </li>
                ))}
              </ul>
            ) : tenant.serviceAreaSummary?.trim() ? (
              <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-gray-700">
                {tenant.serviceAreaSummary.trim()}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {showBusinessHoursSection ? (
        <section id="business-hours" className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-5 sm:px-6">
            <div className="text-center">
              <p className="tenant-brand-primary-text text-xs font-bold uppercase tracking-wide">
                {businessHoursHeading}
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                {businessHoursTitle}
              </h2>
            </div>

            <ul className="mt-8 divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
              {businessHoursRows.map((row) => (
                <li
                  key={row.day}
                  className="flex flex-col gap-1 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-semibold text-gray-950">{row.day}</span>
                  <span className="text-gray-600">{row.hoursText}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
      
      {/* ABOUT */}
      {websiteSettings.showAbout !== false ? (
      <section id="about" className="bg-white py-16">
        <div
          className={`mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:items-center ${
            aboutImageUrl ? "lg:grid-cols-[1.1fr_0.9fr]" : "max-w-3xl"
          }`}
        >
          <div>
            <p className="tenant-brand-primary-text text-xs font-bold uppercase tracking-wide">
              {aboutHeading}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              {aboutTitle}
            </h2>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              {aboutBody}
            </p>

            <button
              type="button"
              onClick={openChat}
              className="saas-button-accent mt-7 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm"
            >
              {aboutCtaLabel}
            </button>
          </div>

          {aboutImageUrl ? (
            <div className="min-h-[320px] overflow-hidden rounded-3xl shadow-sm">
              <img
                src={aboutImageUrl}
                alt={`${tenant.businessName} team`}
                className="h-full min-h-[320px] w-full object-cover object-center"
              />
            </div>
          ) : null}
        </div>
      </section>
      ) : null}

      {/* FAQ */}
      {websiteSettings.showFaqs !== false && faqs.length > 0 ? (
      <section id="faqs" className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="tenant-brand-primary-text text-xs font-bold uppercase tracking-wide">
              {faqsHeading}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              {faqsTitle}
            </h2>
            {hasAuthoredFaqs && faqsDescription?.trim() ? (
              <p className="mt-4 text-sm leading-7 text-gray-600">
                {faqsDescription}
              </p>
            ) : null}
            <button
              type="button"
              onClick={openChat}
              className="saas-button-accent mt-6 rounded-xl px-5 py-3 text-sm font-semibold"
            >
              {faqsButtonLabel}
            </button>
          </div>

          <div className="divide-y divide-stone-200 rounded-3xl border border-stone-200 bg-white">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;

              return (
                <button
                  key={faq.question}
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? -1 : index)}
                  className="block w-full p-5 text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold text-gray-950">{faq.question}</p>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>

                  {isOpen ? (
                    <p className="mt-3 text-sm leading-7 text-gray-600">
                      {faq.answer}
                    </p>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>
      ) : null}

      {/* FOOTER */}
      <footer className="border-t border-stone-200 bg-gray-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold">{tenant.businessName}</h2>
            <div className="mt-5 space-y-2 text-sm text-white/70">
              {tenant.primaryPhone ? (
                <p>
                  Phone:{" "}
                  <a
                    href={phoneHref}
                    className="underline-offset-2 hover:underline"
                  >
                    {tenant.primaryPhone}
                  </a>
                </p>
              ) : null}
              {tenant.email ? (
                <p>
                  Email:{" "}
                  <a
                    href={emailHref}
                    className="break-all underline-offset-2 hover:underline"
                  >
                    {tenant.email}
                  </a>
                </p>
              ) : null}
              {tenant.serviceAreaSummary ? (
                <p>Service Area: {tenant.serviceAreaSummary}</p>
              ) : null}
              {tenant.licenseNumber ? <p>License: {tenant.licenseNumber}</p> : null}
            </div>
            {socialLinks.length > 0 ? (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                {socialLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-950 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Icon className={`h-5 w-5 ${link.colorClass}`} />
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>

          {tenant.serviceAreaSummary || tenant.serviceCities?.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <p className="text-sm font-bold">Service area</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {tenant.serviceAreaSummary ||
                  tenant.serviceCities?.slice(0, 6).join(", ")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 px-5 py-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {tenant.businessName}. Powered by Contactor.
        </div>
      </footer>

      {/* FLOATING AI LAUNCHER */}
      {!chatOpen ? (
        <button
          type="button"
          onClick={openChat}
          className="tenant-brand-primary-bg fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white shadow-2xl transition hover:opacity-90"
        >
          <MessageCircle className="h-5 w-5" />
            <span className="hidden sm:inline">{floatingChatLabel}</span>
            <span className="sm:hidden">Chat</span>
        </button>
      ) : null}

      {/* PROFESSIONAL CHAT WINDOW */}
      {chatOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 p-3 sm:p-5">
          <div className="relative flex h-[86vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition hover:bg-stone-50"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="min-h-0 flex-1">
            <ChatWidget
              tenant={tenant}
              autoOpen
              leadSource={leadSource}
              campaignId={campaignId}
              campaignAssetId={campaignAssetId}
              variant="embed"
            />
            </div>

            <div className="border-t border-stone-100 bg-white px-4 py-2 text-center">
              <a
                href="https://getcontactor.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:opacity-80"
              >
                <span>Powered by</span>
                <img
                  src="/branding/contactor-logo.png"
                  alt="Contactor"
                  className="h-5 w-auto"
                />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function TrustItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <CheckCircle2 className="tenant-brand-check h-5 w-5 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <CheckCircle2 className="tenant-brand-check mt-1 h-5 w-5 shrink-0" />
      <div>
        <p className="font-bold text-gray-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
      </div>
    </div>
  );
}