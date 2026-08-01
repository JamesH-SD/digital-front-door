"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  MessageCircle,
  Star,
  X,
} from "lucide-react";
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

function getServiceAreas(tenant: Tenant) {
  if (tenant.serviceCities && tenant.serviceCities.length > 0) {
    return tenant.serviceCities;
  }

  if (tenant.serviceAreaSummary) {
    return [tenant.serviceAreaSummary];
  }

  return ["Local service area"];
}

function getServices(tenant: Tenant) {
  const websiteServices = tenant.websiteSettings?.services || [];

  const enabledWebsiteServices = websiteServices.filter(
    (service) => service.enabled !== false && service.title?.trim()
  );

  if (enabledWebsiteServices.length > 0) {
    return enabledWebsiteServices;
  }

  if (tenant.servicesOffered && tenant.servicesOffered.length > 0) {
    return tenant.servicesOffered.map((service) => ({
      id: service,
      title: service,
      description: "",
      imageUrl: "",
      enabled: true,
    }));
  }

  return [
    {
      id: "default-primary",
      title: tenant.primaryCategory || "General services",
      description: "",
      imageUrl: "",
      enabled: true,
    },
    {
      id: "default-questions",
      title: "Project questions",
      description: "",
      imageUrl: "",
      enabled: true,
    },
    {
      id: "default-quotes",
      title: "Quotes and estimates",
      description: "",
      imageUrl: "",
      enabled: true,
    },
    {
      id: "default-scheduling",
      title: "Scheduling",
      description: "",
      imageUrl: "",
      enabled: true,
    },
  ];
}

function getProjectGallery(tenant: Tenant) {
  const gallery = tenant.websiteSettings?.projectGallery || [];

  return gallery.filter(
    (item) => item.enabled !== false && item.imageUrl?.trim() && item.title?.trim()
  );
}

function getFaqs(tenant: Tenant) {
  const websiteFaqs = tenant.websiteSettings?.faqs || [];

  const enabledWebsiteFaqs = websiteFaqs.filter(
    (faq) => faq.enabled !== false && faq.question?.trim() && faq.answer?.trim()
  );

  if (enabledWebsiteFaqs.length > 0) {
    return enabledWebsiteFaqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    }));
  }

  return [
    {
      question: "How do I get started?",
      answer:
        "The easiest way to get started is to ask a question or request an estimate through our AI receptionist. We’ll collect the right details and help move your request forward.",
    },
    {
      question: "What areas do you serve?",
      answer:
        tenant.serviceAreaSummary ||
        `We primarily serve customers in our local service area.`,
    },
    {
      question: "Are you licensed and insured?",
      answer: `${tenant.licenseNumber ? `We are licensed (${tenant.licenseNumber})` : "License information can be provided upon request"}${
        tenant.isInsured ? " and insured." : "."
      }`,
    },
    {
      question: "Can I schedule a call or visit?",
      answer:
        "Yes. Use the AI receptionist to share your project details, ask questions, and schedule the next step when available.",
    },
  ];
}

const sampleReviews = [
  {
    name: "Local Homeowner",
    text: "Great communication, clear next steps, and easy to get the project conversation started.",
  },
  {
    name: "Property Owner",
    text: "Professional, responsive, and helpful when discussing the scope of work.",
  },
  {
    name: "San Diego Customer",
    text: "The process was simple and made it easy to ask questions before moving forward.",
  },
];

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
  const [activeReview, setActiveReview] = useState(0);

  const phoneHref = formatPhoneHref(tenant.primaryPhone);
  const services = getServices(tenant);
  const projectGallery = getProjectGallery(tenant);
  const serviceAreas = getServiceAreas(tenant);
  const faqs = getFaqs(tenant);
  const currentReview = sampleReviews[activeReview];

  const websiteSettings = tenant.websiteSettings || {};

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

  const heroHeadline =
  websiteSettings.heroHeadline ||
  `${tenant.businessName} makes it easy to get started.`;

  const heroDescription =
    websiteSettings.heroDescription ||
    "Ask a question, request an estimate, or schedule the next step. Our AI receptionist helps collect the right details so you do not have to wait for a callback.";

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
    websiteSettings.serviceAreasTitle ||
    tenant.serviceAreaSummary ||
    "Serving our local community";

    const projectGalleryHeading =
    websiteSettings.projectGalleryHeading || "Project Gallery";
  
  const projectGalleryTitle =
    websiteSettings.projectGalleryTitle || "Recent work";
  
  const projectGalleryDescription =
    websiteSettings.projectGalleryDescription ||
    "Browse a few examples of completed projects and ask our AI receptionist about similar work.";
  
  const reviewsHeading = websiteSettings.reviewsHeading || "Reviews";
  
  const reviewsTitle =
    websiteSettings.reviewsTitle || "What customers say";
  
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

  const aboutBody =
  websiteSettings.aboutBody ||
  `${tenant.businessName} helps customers ask questions, share details, and coordinate next steps through a simple online experience.`;

  const aboutCtaLabel =
    websiteSettings.aboutCtaLabel ||
    "Ask About Your Project";

    const servicesSectionHeading =
    websiteSettings.servicesSectionHeading || "Services";
  
  const servicesSectionTitle =
    websiteSettings.servicesSectionTitle || "Services customers can ask about";
  
  const servicesSectionDescription =
    websiteSettings.servicesSectionDescription ||
    "Explore common services and ask our AI receptionist about the one that fits your needs.";

  useEffect(() => {
    if (autoOpenChat) {
      setChatOpen(true);
    }
  }, [autoOpenChat]);

  function openChat() {
    setChatOpen(true);
    setMobileNavOpen(false);
  }

  function nextReview() {
    setActiveReview((prev) => (prev + 1) % sampleReviews.length);
  }

  function previousReview() {
    setActiveReview((prev) =>
      prev === 0 ? sampleReviews.length - 1 : prev - 1
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-gray-950">
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-950 text-sm font-bold text-white">
              {tenant.businessName.charAt(0)}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-bold text-gray-950">
              {tenant.businessName}
            </p>
            <p className="hidden text-xs text-gray-500 sm:block">
              {tenant.primaryCategory || "Local Service Business"}
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
                Ask a Question
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.25),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_22%)]" />
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
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-700 text-white">
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
                Start Conversation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-3 px-5 py-5 text-sm font-semibold text-gray-700 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {tenant.licenseNumber ? (
            <TrustItem label={`Licensed ${tenant.licenseNumber}`} />
          ) : (
            <TrustItem label="License info available" />
          )}
          <TrustItem
            label={tenant.isInsured ? "Insured" : "Insurance info available"}
          />
          <TrustItem label="Local service provider" />
          <TrustItem label="Fast online intake" />
        </div>
      </section>

      {/* WHY US */}
      {websiteSettings.showWhyUs !== false ? (
      <section id="why-us" className="bg-stone-50 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="min-h-[340px] overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#e7e5e4,#fafaf9)] shadow-sm">
            {websiteSettings.whyUsImageUrl ? (
              <img
                src={websiteSettings.whyUsImageUrl}
                alt={`${tenant.businessName} work`}
                className="h-full min-h-[340px] w-full object-cover object-center"
              />
            ) : (
              <div className="flex h-full min-h-[340px] items-end rounded-2xl border border-white/70 bg-white/50 p-6">
                <p className="text-sm font-semibold text-gray-600">
                  Professional image / project photo placeholder
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
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
      {websiteSettings.showServices !== false ? (
        <section id="services" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                {servicesSectionHeading}
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                {servicesSectionTitle}
              </h2>

              <p className="mt-4 text-sm leading-7 text-gray-600">
                {servicesSectionDescription}
              </p>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl grid-cols-[repeat(auto-fit,minmax(240px,1fr))] justify-center gap-5">
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
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-stone-100 text-sm font-semibold text-stone-500">
                      {service.title}
                    </div>
                  )}

                  <div className="p-5">
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
                      className="mt-5 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
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
              <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
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
                      className="mt-5 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
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
              <p className="text-xs font-bold uppercase tracking-wide text-orange-400">
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
      {websiteSettings.showServiceAreas !== false ? (
        <section className="bg-stone-50 py-16">
          <div className="mx-auto max-w-6xl px-5 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
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
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                      ✓
                    </span>
                    <span>{city}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}
      
      {/* ABOUT */}
      {websiteSettings.showAbout !== false ? (
      <section id="about" className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
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

          <div className="min-h-[320px] overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#f5f5f4,#e7e5e4)] shadow-sm">
            {websiteSettings.aboutImageUrl ? (
              <img
                src={websiteSettings.aboutImageUrl}
                alt={`${tenant.businessName} team`}
                className="h-full min-h-[320px] w-full object-cover object-center"
              />
            ) : (
              <div className="flex h-full min-h-[320px] items-end rounded-2xl border border-white/70 bg-white/50 p-6">
                <p className="text-sm font-semibold text-gray-600">
                  Business photo placeholder
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      ) : null}

      {/* REVIEWS */}
      {websiteSettings.showReviews !== false ? (
      <section className="bg-stone-50 py-16">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-6">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            {reviewsHeading}
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
            {reviewsTitle}
          </h2>

          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <div className="flex justify-center gap-1 text-orange-500">
              {[1, 2, 3, 4, 5].map((item) => (
                <Star key={item} className="h-5 w-5 fill-current" />
              ))}
            </div>

            <p className="mt-5 text-lg leading-8 text-gray-700">
              “{currentReview.text}”
            </p>
            <p className="mt-4 text-sm font-bold text-gray-950">
              {currentReview.name}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={previousReview}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition hover:bg-stone-50"
                aria-label="Previous review"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={nextReview}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white shadow-sm transition hover:bg-stone-50"
                aria-label="Next review"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* FAQ */}
      {websiteSettings.showFaqs !== false ? (
      <section id="faqs" className="bg-white py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              {faqsHeading}
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              {faqsTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              {faqsDescription}
            </p>
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
              {tenant.primaryPhone ? <p>Phone: {tenant.primaryPhone}</p> : null}
              {tenant.email ? <p>Email: {tenant.email}</p> : null}
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

          <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-sm font-bold">Map / Location Placeholder</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              A map can be added here when business address sharing is enabled.
            </p>
          </div>
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
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl bg-gray-950 px-4 py-3 text-sm font-bold text-white shadow-2xl transition hover:bg-gray-800"
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
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-500 transition hover:text-orange-700"
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
      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
      <span>{label}</span>
    </div>
  );
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-green-600" />
      <div>
        <p className="font-bold text-gray-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">{text}</p>
      </div>
    </div>
  );
}