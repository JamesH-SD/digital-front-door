"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TenantWebsiteSettings } from "@/lib/types/tenant";

export type WebsitePanelSection =
  | "brand"
  | "hero"
  | "whyUs"
  | "services"
  | "projectGallery"
  | "banner"
  | "serviceAreas"
  | "about"
  | "reviews"
  | "faqs"
  | "socialLinks";

  type Props = {
    tenantSlug: string;
    initialSettings?: TenantWebsiteSettings;
    visibleSections?: WebsitePanelSection[];
    title?: string;
    description?: string;
  };

const defaultSettings: TenantWebsiteSettings = {
  template: "ai_trust_v1",
  primaryColor: "#1F3B4D",
  accentColor: "#4E9271",
  logoUrl: "",
  heroImageUrl: "",
  whyUsImageUrl: "",
  aboutImageUrl: "",
  showWhyUs: true,
  showServices: true,
  showBanner: true,
  showServiceAreas: true,
  showAbout: true,
  showReviews: true,
  showFaqs: true,
  facebookUrl: "",
  instagramUrl: "",
  yelpUrl: "",
  googleBusinessUrl: "",

  heroHeadline: "",
  heroDescription: "",
  heroPrimaryCtaLabel: "Ask Our Receptionist",
  heroSecondaryCtaLabel: "Call Now",

  whyUsHeading: "Why Us",
  whyUsTitle: "Built to make the first conversation easier",
  whyUsBullet1Title: "Easy to reach",
  whyUsBullet1Text: "Customers can ask questions online without waiting for a callback.",
  whyUsBullet2Title: "Project details captured",
  whyUsBullet2Text: "The receptionist collects the important details so follow-up is more useful.",
  whyUsBullet3Title: "Trust signals up front",
  whyUsBullet3Text: "License, insurance, service area, and business information are visible before a customer reaches out.",

  aboutHeading: "About Us",
  aboutTitle: "",
  aboutBody: "",
  aboutCtaLabel: "Ask About Your Project",

  bannerHeading: "Ready to Get Started?",
  bannerTitle: "Tell us about your project.",
  bannerDescription:
    "Our AI receptionist can answer questions, collect project details, and help schedule the next step.",
  bannerButtonLabel: "Start Conversation",

  serviceAreasHeading: "Service Areas",
  serviceAreasTitle: "",

  reviewsHeading: "Reviews",
  reviewsTitle: "What customers say",

  faqsHeading: "FAQs",
  faqsTitle: "Frequently asked questions",
  faqsDescription:
    "Still have questions? Ask the AI receptionist and we’ll help get the conversation started.",
  faqsButtonLabel: "Ask a Question",
  faqs: [],

  servicesSectionHeading: "Services",
  servicesSectionTitle: "Services customers can ask about",
  servicesSectionDescription:
    "Explore common services and ask our AI receptionist about the one that fits your needs.",
  services: [],

  showProjectGallery: true,
  projectGalleryHeading: "Project Gallery",
  projectGalleryTitle: "Recent work",
  projectGalleryDescription:
    "Browse a few examples of completed projects and ask our AI receptionist about similar work.",
  projectGallery: [],
};

type AssetType = "logo" | "hero" | "whyUs" | "about" | "gallery";

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-bold text-gray-500">
        ?
      </span>

      <span className="pointer-events-none absolute left-1/2 top-7 z-50 hidden w-64 -translate-x-1/2 rounded-xl bg-gray-950 px-3 py-2 text-xs font-medium leading-5 text-white shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

function SectionCard({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  helpText: string;
  enabled?: boolean;
  onToggle?: (checked: boolean) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      {typeof enabled === "boolean" && onToggle ? (
        <div className="mb-4 flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              {description}
            </p>
          </div>

          <label className="flex shrink-0 items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
            />
            Show
          </label>
        </div>
      ) : null}

      <div>{children}</div>
    </section>
  );
}

function ImageUploadCard({
  label,
  imageUrl,
  isSaving,
  onUpload,
  onUseDefault,
}: {
  label: string;
  imageUrl?: string;
  isSaving: boolean;
  onUpload: (file: File) => void;
  onUseDefault: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-gray-950">{label}</p>
      <p className="mt-1 text-xs text-gray-500">
          Upload a JPG, PNG, or WebP image. This logo appears on the public website and brand areas.
      </p>

      {imageUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
          <img
            src={imageUrl}
            alt={label}
            className="h-40 w-full object-cover object-center"
          />
        </div>
      ) : (
        <div className="mt-4 flex h-40 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm text-gray-500">
          Default will be used
        </div>
      )}

      <label className="mt-4 block">
        <span className="sr-only">Upload {label}</span>
        <input
          type="file"
          accept="image/*"
          disabled={isSaving}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;

            onUpload(file);
            event.target.value = "";
          }}
          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      {imageUrl ? (
        <button
          type="button"
          onClick={onUseDefault}
          className="saas-button-secondary mt-3 w-full px-4 py-2 text-sm font-medium"
        >
          Use Default
        </button>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="saas-input mt-1 w-full px-3 py-2 text-sm"
        placeholder={placeholder}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="saas-input mt-1 w-full px-3 py-2 text-sm"
        placeholder={placeholder}
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value?: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  const colorValue = value || fallback;

  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>

      <div className="mt-1 flex gap-2">
        <input
          type="color"
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-200 bg-white"
        />

        <input
          value={colorValue}
          onChange={(e) => onChange(e.target.value)}
          className="saas-input w-full px-3 py-2 text-sm"
          placeholder={fallback}
        />
      </div>
    </label>
  );
}

export default function WebsiteSettingsPanel({
  tenantSlug,
  initialSettings,
  visibleSections,
  title = "Website Settings",
  description = "Customize the public website by section. Each section controls the text, images, and visibility used on the tenant website.",
}: Props) {
  const [settings, setSettings] = useState<TenantWebsiteSettings>({
    ...defaultSettings,
    ...(initialSettings || {}),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function shouldShow(section: WebsitePanelSection) {
    return !visibleSections || visibleSections.includes(section);
  }

  function updateField<K extends keyof TenantWebsiteSettings>(
    key: K,
    value: TenantWebsiteSettings[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetBrandSettings() {
    const confirmed = window.confirm(
      "Reset logo, brand colors, and social links back to the default values?"
    );
  
    if (!confirmed) return;
  
    setSettings((prev) => ({
      ...prev,
      logoUrl: "",
      primaryColor: defaultSettings.primaryColor,
      accentColor: defaultSettings.accentColor,
      facebookUrl: "",
      instagramUrl: "",
      yelpUrl: "",
      googleBusinessUrl: "",
    }));
  
    setMessage("Brand settings reset. Click Save Website Changes to publish.");
  }

  function getWebsiteFaqs() {
    return settings.faqs || [];
  }
  
  function addFaq() {
    const newFaq = {
      id: `faq_${Date.now()}`,
      question: "New FAQ",
      answer: "",
      enabled: true,
    };
  
    updateField("faqs", [newFaq, ...getWebsiteFaqs()]);
  }
  
  function updateFaq(
    faqId: string,
    updates: Partial<{
      question: string;
      answer: string;
      enabled: boolean;
    }>
  ) {
    const nextFaqs = getWebsiteFaqs().map((faq) =>
      faq.id === faqId ? { ...faq, ...updates } : faq
    );
  
    updateField("faqs", nextFaqs);
  }
  
  function removeFaq(faqId: string) {
    const confirmed = window.confirm("Remove this FAQ from the website?");
    if (!confirmed) return;
  
    updateField(
      "faqs",
      getWebsiteFaqs().filter((faq) => faq.id !== faqId)
    );
  }

  function getWebsiteServices() {
    return settings.services || [];
  }
  
  function addService() {
    const newService = {
      id: `service_${Date.now()}`,
      title: "New Service",
      description: "",
      imageUrl: "",
      enabled: true,
    };
  
    updateField("services", [newService, ...getWebsiteServices()]);
  }
  
  function updateService(
    serviceId: string,
    updates: Partial<{
      title: string;
      description: string;
      imageUrl: string;
      enabled: boolean;
    }>
  ) {
    const nextServices = getWebsiteServices().map((service) =>
      service.id === serviceId ? { ...service, ...updates } : service
    );
  
    updateField("services", nextServices);
  }
  
  function removeService(serviceId: string) {
    const confirmed = window.confirm("Remove this service from the website?");
    if (!confirmed) return;
  
    const nextServices = getWebsiteServices().filter(
      (service) => service.id !== serviceId
    );
  
    updateField("services", nextServices);
  }

  function moveService(serviceId: string, direction: "up" | "down") {
    const services = getWebsiteServices();
    const currentIndex = services.findIndex((service) => service.id === serviceId);
  
    if (currentIndex === -1) return;
  
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  
    if (nextIndex < 0 || nextIndex >= services.length) return;
  
    const nextServices = [...services];
    const [movedService] = nextServices.splice(currentIndex, 1);
    nextServices.splice(nextIndex, 0, movedService);
  
    updateField("services", nextServices);
  }

  function getProjectGallery() {
    return settings.projectGallery || [];
  }
  
  function addProjectGalleryItem() {
    const newItem = {
      id: `gallery_${Date.now()}`,
      title: "New Project",
      description: "",
      imageUrl: "",
      enabled: true,
    };
  
    updateField("projectGallery", [newItem, ...getProjectGallery()]);
  }
  
  function updateProjectGalleryItem(
    itemId: string,
    updates: Partial<{
      title: string;
      description: string;
      imageUrl: string;
      enabled: boolean;
    }>
  ) {
    const nextItems = getProjectGallery().map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
  
    updateField("projectGallery", nextItems);
  }
  
  function removeProjectGalleryItem(itemId: string) {
    const confirmed = window.confirm("Remove this project from the gallery?");
    if (!confirmed) return;
  
    updateField(
      "projectGallery",
      getProjectGallery().filter((item) => item.id !== itemId)
    );
  }
  
  async function uploadProjectGalleryImage(itemId: string, file: File) {
    try {
      setIsSaving(true);
      setMessage("");
  
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "gallery");
  
      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/website-assets`,
        {
          method: "POST",
          body: formData,
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload project image.");
      }
  
      updateProjectGalleryItem(itemId, {
        imageUrl: result.imageUrl,
      });
  
      setMessage("Project image uploaded. Click Save Website Changes to publish.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to upload project image."
      );
    } finally {
      setIsSaving(false);
    }
  }
  
  async function uploadServiceImage(serviceId: string, file: File) {
    try {
      setIsSaving(true);
      setMessage("");
  
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", "service");
  
      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/website-assets`,
        {
          method: "POST",
          body: formData,
        }
      );
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to upload service image.");
      }
  
      updateService(serviceId, {
        imageUrl: result.imageUrl,
      });
  
      setMessage("Service image uploaded. Click Save Website Changes to publish.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload service image."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveSettings() {
    try {
      setIsSaving(true);
      setMessage("");

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/website-settings`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ websiteSettings: settings }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save website settings.");
      }

      setMessage("Website settings saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save website settings."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadAsset(assetType: AssetType, file: File) {
    try {
      setIsSaving(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("assetType", assetType);

      const response = await fetch(
        `/api/admin/tenants/${tenantSlug}/website-assets`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image.");
      }

      setSettings((prev) => ({
        ...prev,
        ...(result.websiteSettings || {}),
      }));

      setMessage("Image uploaded.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to upload image."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200/50 bg-white/90 p-4 shadow-[0_8px_24px_rgba(17,24,39,0.045)]">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Changes are not published until you click <strong>Save Website Changes</strong>.
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-gray-700">
          {message}
        </p>
      ) : null}

<div className="mt-5 space-y-5">
  {shouldShow("brand") ? (
    <SectionCard
      title="Brand"
      defaultOpen
      description="Set the business logo, website colors, and social links."
      helpText="Use this section to control the overall look of the website. Upload a logo, choose brand colors, and add social profile links."
    >
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-2">
          <ImageUploadCard
            label="Logo"
            imageUrl={settings.logoUrl}
            isSaving={isSaving}
            onUpload={(file) => void uploadAsset("logo", file)}
            onUseDefault={() => updateField("logoUrl", "")}
          />

          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-950">
                  Brand Colors
                </h4>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Choose colors that match the business brand. These colors control website accents, buttons, and key visual highlights.
                </p>
              </div>

              <button
                type="button"
                onClick={resetBrandSettings}
                className="saas-button-secondary px-3 py-2 text-xs font-semibold"
              >
                Default Colors
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <ColorField
                label="Primary Color"
                value={settings.primaryColor}
                fallback={defaultSettings.primaryColor || "#1F3B4D"}
                onChange={(value) => updateField("primaryColor", value)}
              />

              <ColorField
                label="Accent Color"
                value={settings.accentColor}
                fallback={defaultSettings.accentColor || "#4E9271"}
                onChange={(value) => updateField("accentColor", value)}
              />
            </div>
          </div>
        </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-950">
                Social Links
              </h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  ["facebookUrl", "Facebook URL"],
                  ["instagramUrl", "Instagram URL"],
                  ["yelpUrl", "Yelp URL"],
                  ["googleBusinessUrl", "Google Business Profile URL"],
                ].map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </span>

                    <input
                      value={
                        settings[key as keyof TenantWebsiteSettings]?.toString() ||
                        ""
                      }
                      onChange={(e) =>
                        updateField(
                          key as keyof TenantWebsiteSettings,
                          e.target.value as never
                        )
                      }
                      className="saas-input mt-1 w-full px-3 py-2 text-sm"
                      placeholder="https://..."
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("hero") ? (
        <SectionCard
          title="Hero Section"
          defaultOpen
          description="Control the first section customers see."
          helpText="This is the top of the website. Use a strong headline, simple description, and background image that quickly builds trust."
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <TextField
                label="Headline"
                value={settings.heroHeadline}
                onChange={(value) => updateField("heroHeadline", value)}
                placeholder="Remodeling & construction made simple"
              />

              <TextAreaField
                label="Description"
                value={settings.heroDescription}
                onChange={(value) => updateField("heroDescription", value)}
                placeholder="Ask a question, request an estimate, or schedule the next step."
                rows={3}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Primary CTA Label"
                  value={settings.heroPrimaryCtaLabel}
                  onChange={(value) => updateField("heroPrimaryCtaLabel", value)}
                  placeholder="Ask Our Receptionist"
                />

                <TextField
                  label="Secondary CTA Label"
                  value={settings.heroSecondaryCtaLabel}
                  onChange={(value) => updateField("heroSecondaryCtaLabel", value)}
                  placeholder="Call Now"
                />
              </div>
            </div>

            <ImageUploadCard
              label="Hero Background Image"
              imageUrl={settings.heroImageUrl}
              isSaving={isSaving}
              onUpload={(file) => void uploadAsset("hero", file)}
              onUseDefault={() => updateField("heroImageUrl", "")}
            />
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("whyUs") ? (
        <SectionCard
          title="Why Us Section"
          description="Build trust by explaining why customers should choose this business."
          helpText="Use this section to show credibility. Good examples include licensed, insured, local, experienced, responsive, permit assistance, or quality workmanship."
          enabled={settings.showWhyUs !== false}
          onToggle={(checked) => updateField("showWhyUs", checked)}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <TextField
                label="Small Heading"
                value={settings.whyUsHeading}
                onChange={(value) => updateField("whyUsHeading", value)}
                placeholder="Why Us"
              />

              <TextField
                label="Title"
                value={settings.whyUsTitle}
                onChange={(value) => updateField("whyUsTitle", value)}
                placeholder="Built to make the first conversation easier"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Bullet 1 Title"
                  value={settings.whyUsBullet1Title}
                  onChange={(value) => updateField("whyUsBullet1Title", value)}
                  placeholder="Easy to reach"
                />

                <TextField
                  label="Bullet 1 Text"
                  value={settings.whyUsBullet1Text}
                  onChange={(value) => updateField("whyUsBullet1Text", value)}
                  placeholder="Customers can ask questions online without waiting for a callback."
                />

                <TextField
                  label="Bullet 2 Title"
                  value={settings.whyUsBullet2Title}
                  onChange={(value) => updateField("whyUsBullet2Title", value)}
                  placeholder="Project details captured"
                />

                <TextField
                  label="Bullet 2 Text"
                  value={settings.whyUsBullet2Text}
                  onChange={(value) => updateField("whyUsBullet2Text", value)}
                  placeholder="The receptionist collects the important details so follow-up is more useful."
                />

                <TextField
                  label="Bullet 3 Title"
                  value={settings.whyUsBullet3Title}
                  onChange={(value) => updateField("whyUsBullet3Title", value)}
                  placeholder="Trust signals up front"
                />

                <TextField
                  label="Bullet 3 Text"
                  value={settings.whyUsBullet3Text}
                  onChange={(value) => updateField("whyUsBullet3Text", value)}
                  placeholder="License, insurance, service area, and business information are visible before a customer reaches out."
                />
              </div>
            </div>

            <ImageUploadCard
              label="Why Us Image"
              imageUrl={settings.whyUsImageUrl}
              isSaving={isSaving}
              onUpload={(file) => void uploadAsset("whyUs", file)}
              onUseDefault={() => updateField("whyUsImageUrl", "")}
            />
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("services") ? (
        <SectionCard
          title="Services Section"
          description="Show services as website cards with optional images and descriptions."
          helpText="Use this section to explain what the business offers. Each service can have an image, title, description, and can be shown or hidden."
          enabled={settings.showServices !== false}
          onToggle={(checked) => updateField("showServices", checked)}
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Small Heading"
                value={settings.servicesSectionHeading}
                onChange={(value) => updateField("servicesSectionHeading", value)}
                placeholder="Services"
              />

              <TextField
                label="Title"
                value={settings.servicesSectionTitle}
                onChange={(value) => updateField("servicesSectionTitle", value)}
                placeholder="Services customers can ask about"
              />
            </div>

            <TextAreaField
              label="Description"
              value={settings.servicesSectionDescription}
              onChange={(value) => updateField("servicesSectionDescription", value)}
              placeholder="Explore common services and ask our AI receptionist about the one that fits your needs."
              rows={3}
            />

            <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
              <div>
                <p className="text-sm font-semibold text-gray-950">Service Cards</p>
                <p className="mt-1 text-xs text-gray-500">
                  Add the main services customers ask about.
                </p>
              </div>

              <button
                type="button"
                onClick={addService}
                className="saas-button-accent rounded-xl px-4 py-2 text-sm font-semibold shadow-sm"
              >
                Add Service
              </button>
            </div>
            
            <div className="grid gap-4 lg:grid-cols-2">
              {getWebsiteServices().length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-gray-600">
                  No service cards yet. Add a service to start building the public
                  website services section.
                </div>
              ) : null}

              {getWebsiteServices().map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-4">
                    <div>
                      {service.imageUrl ? (
                        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                          <img
                            src={service.imageUrl}
                            alt={service.title}
                            className="h-44 w-full object-cover object-center"
                          />
                        </div>
                      ) : (
                        <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm text-gray-500">
                          No image
                        </div>
                      )}

                      <label className="mt-3 block">
                        <span className="sr-only">Upload service image</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isSaving}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;

                            void uploadServiceImage(service.id, file);
                            event.target.value = "";
                          }}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </label>

                      {service.imageUrl ? (
                        <button
                          type="button"
                          onClick={() => updateService(service.id, { imageUrl: "" })}
                          className="saas-button-secondary mt-3 w-full px-4 py-2 text-sm font-medium"
                        >
                          Use Default
                        </button>
                      ) : null}
                    </div>

                    <div className="space-y-4">
                      <TextField
                        label="Service Title"
                        value={service.title}
                        onChange={(value) => updateService(service.id, { title: value })}
                        placeholder="Bathroom Remodel"
                      />

                      <TextAreaField
                        label="Service Description"
                        value={service.description || ""}
                        onChange={(value) =>
                          updateService(service.id, { description: value })
                        }
                        placeholder="Briefly describe this service."
                        rows={4}
                      />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={service.enabled !== false}
                    onChange={(event) =>
                      updateService(service.id, {
                        enabled: event.target.checked,
                      })
                    }
                  />
                  Show this service
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveService(service.id, "up")}
                    className="saas-button-secondary px-3 py-2 text-sm font-semibold"
                  >
                    Move Up
                  </button>

                  <button
                    type="button"
                    onClick={() => moveService(service.id, "down")}
                    className="saas-button-secondary px-3 py-2 text-sm font-semibold"
                  >
                    Move Down
                  </button>

                  <button
                    type="button"
                    onClick={() => removeService(service.id)}
                    className="saas-button-danger px-3 py-2 text-sm font-semibold"
                  >
                    Remove
                  </button>
                </div>
              </div>
                    </div>
                    </div>
                    </div>
                    ))}
                    </div>
                    </div>
                    </SectionCard>
                    ) : null}
      {shouldShow("projectGallery") ? (
        <SectionCard
          title="Project Gallery"
          description="Show completed project images in a carousel below Services."
          helpText="Use this section to build trust with real project photos. Keep titles short and descriptions simple."
          enabled={settings.showProjectGallery !== false}
          onToggle={(checked) => updateField("showProjectGallery", checked)}
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Small Heading"
                value={settings.projectGalleryHeading}
                onChange={(value) => updateField("projectGalleryHeading", value)}
                placeholder="Project Gallery"
              />

              <TextField
                label="Title"
                value={settings.projectGalleryTitle}
                onChange={(value) => updateField("projectGalleryTitle", value)}
                placeholder="Recent work"
              />
            </div>

            <TextAreaField
              label="Description"
              value={settings.projectGalleryDescription}
              onChange={(value) => updateField("projectGalleryDescription", value)}
              placeholder="Browse a few examples of completed projects."
              rows={3}
            />

            <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
              <div>
                <p className="text-sm font-semibold text-gray-950">Gallery Cards</p>
                <p className="mt-1 text-xs text-gray-500">
                  Add project photos customers can browse on the website.
                </p>
              </div>

              <button
                type="button"
                onClick={addProjectGalleryItem}
                className="saas-button-accent px-4 py-2 text-sm font-semibold"
              >
                Add Project
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {getProjectGallery().length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-gray-600">
                  No project photos yet. Add a project to build the gallery section.
                </div>
              ) : null}

              {getProjectGallery().map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-4">
                    {item.imageUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-44 w-full object-cover object-center"
                        />
                      </div>
                    ) : (
                      <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm text-gray-500">
                        No image
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      disabled={isSaving}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        void uploadProjectGalleryImage(item.id, file);
                        event.target.value = "";
                      }}
                      className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-orange-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <TextField
                      label="Project Title"
                      value={item.title}
                      onChange={(value) =>
                        updateProjectGalleryItem(item.id, { title: value })
                      }
                      placeholder="Kitchen Remodel"
                    />

                    <TextAreaField
                      label="Project Description"
                      value={item.description || ""}
                      onChange={(value) =>
                        updateProjectGalleryItem(item.id, { description: value })
                      }
                      placeholder="Briefly describe this project."
                      rows={3}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={item.enabled !== false}
                          onChange={(event) =>
                            updateProjectGalleryItem(item.id, {
                              enabled: event.target.checked,
                            })
                          }
                        />
                        Show this project
                      </label>

                      <button
                        type="button"
                        onClick={() => removeProjectGalleryItem(item.id)}
                        className="saas-button-danger px-3 py-2 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("banner") ? (
        <SectionCard
          title="CTA Banner"
          description="Show a call-to-action banner that encourages visitors to start a conversation."
          helpText="This section is designed to push visitors into the AI receptionist without feeling like a popup or form."
          enabled={settings.showBanner !== false}
          onToggle={(checked) => updateField("showBanner", checked)}
        >
          <div className="space-y-4">
            <TextField
              label="Small Heading"
              value={settings.bannerHeading}
              onChange={(value) => updateField("bannerHeading", value)}
              placeholder="Ready to Get Started?"
            />

            <TextField
              label="Title"
              value={settings.bannerTitle}
              onChange={(value) => updateField("bannerTitle", value)}
              placeholder="Tell us about your project."
            />

            <TextAreaField
              label="Description"
              value={settings.bannerDescription}
              onChange={(value) => updateField("bannerDescription", value)}
              placeholder="Our AI receptionist can answer questions, collect project details, and help schedule the next step."
              rows={3}
            />

            <TextField
              label="Button Label"
              value={settings.bannerButtonLabel}
              onChange={(value) => updateField("bannerButtonLabel", value)}
              placeholder="Start Conversation"
            />
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("serviceAreas") ? (
        <SectionCard
          title="Service Areas Section"
          description="Show where the business provides service."
          helpText="Service areas are currently pulled from Business Identity > Service Area. This helps customers quickly confirm whether they are in range."
          enabled={settings.showServiceAreas !== false}
          onToggle={(checked) => updateField("showServiceAreas", checked)}
        >
          <div className="space-y-4">
            <TextField
              label="Small Heading"
              value={settings.serviceAreasHeading}
              onChange={(value) => updateField("serviceAreasHeading", value)}
              placeholder="Service Areas"
            />

            <TextField
              label="Title"
              value={settings.serviceAreasTitle}
              onChange={(value) => updateField("serviceAreasTitle", value)}
              placeholder="Serving our local community"
            />

            <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-gray-600">
              Service area cities are still managed under the Service Area tab.
            </p>
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("about") ? (    
        <SectionCard
          title="About Section"
          description="Tell customers who the business is and why they should trust it."
          helpText="Use this section to humanize the business. A team photo, owner photo, truck photo, or finished project photo works well here."
          enabled={settings.showAbout !== false}
          onToggle={(checked) => updateField("showAbout", checked)}
        >
          <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <TextField
                label="Small Heading"
                value={settings.aboutHeading}
                onChange={(value) => updateField("aboutHeading", value)}
                placeholder="About Us"
              />

              <TextField
                label="Title"
                value={settings.aboutTitle}
                onChange={(value) => updateField("aboutTitle", value)}
                placeholder="About your business"
              />

              <TextAreaField
                label="Body Text"
                value={settings.aboutBody}
                onChange={(value) => updateField("aboutBody", value)}
                placeholder="Tell customers who you are, what you do, and why they should trust your business."
                rows={5}
              />

              <TextField
                label="CTA Label"
                value={settings.aboutCtaLabel}
                onChange={(value) => updateField("aboutCtaLabel", value)}
                placeholder="Ask About Your Project"
              />
            </div>

            <ImageUploadCard
              label="About Image"
              imageUrl={settings.aboutImageUrl}
              isSaving={isSaving}
              onUpload={(file) => void uploadAsset("about", file)}
              onUseDefault={() => updateField("aboutImageUrl", "")}
            />
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("reviews") ? (
        <SectionCard
          title="Reviews Section"
          description="Show customer reviews or testimonials."
          helpText="Reviews build trust. Later this can connect to Google reviews, Yelp reviews, or manually entered testimonials."
          enabled={settings.showReviews !== false}
          onToggle={(checked) => updateField("showReviews", checked)}
        >
          <div className="space-y-4">
            <TextField
              label="Small Heading"
              value={settings.reviewsHeading}
              onChange={(value) => updateField("reviewsHeading", value)}
              placeholder="Reviews"
            />

            <TextField
              label="Title"
              value={settings.reviewsTitle}
              onChange={(value) => updateField("reviewsTitle", value)}
              placeholder="What customers say"
            />

            <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-gray-600">
              Review management is coming later. The website currently shows sample
              review placeholders.
            </p>
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("faqs") ? (
        <SectionCard
          title="FAQs Section"
          description="Manage frequently asked questions shown on the public website."
          helpText="These FAQs appear on the public website. Use Knowledge Base for AI-only information."
          enabled={settings.showFaqs !== false}
          onToggle={(checked) => updateField("showFaqs", checked)}
        >
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Small Heading"
                value={settings.faqsHeading}
                onChange={(value) => updateField("faqsHeading", value)}
                placeholder="FAQs"
              />

              <TextField
                label="Title"
                value={settings.faqsTitle}
                onChange={(value) => updateField("faqsTitle", value)}
                placeholder="Frequently asked questions"
              />
            </div>

            <TextAreaField
              label="Description"
              value={settings.faqsDescription}
              onChange={(value) => updateField("faqsDescription", value)}
              placeholder="Still have questions? Ask the AI receptionist and we’ll help get the conversation started."
              rows={3}
            />

            <TextField
              label="Button Label"
              value={settings.faqsButtonLabel}
              onChange={(value) => updateField("faqsButtonLabel", value)}
              placeholder="Ask a Question"
            />

            <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
              <div>
                <p className="text-sm font-semibold text-gray-950">FAQ Items</p>
                <p className="mt-1 text-xs text-gray-500">
                  These questions and answers display on the public website.
                </p>
              </div>

              <button
                type="button"
                onClick={addFaq}
                className="saas-button-accent px-4 py-2 text-sm font-semibold"
              >
                Add FAQ
              </button>
            </div>

            <div className="space-y-4">
              {getWebsiteFaqs().length === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-gray-600">
                  No FAQ items yet. Add a question to customize the public website FAQ section.
                </div>
              ) : null}

              {getWebsiteFaqs().map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
                >
                  <div className="space-y-4">
                    <TextField
                      label="Question"
                      value={faq.question}
                      onChange={(value) => updateFaq(faq.id, { question: value })}
                      placeholder="Do you offer free estimates?"
                    />

                    <TextAreaField
                      label="Answer"
                      value={faq.answer}
                      onChange={(value) => updateFaq(faq.id, { answer: value })}
                      placeholder="Briefly answer the question."
                      rows={4}
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={faq.enabled !== false}
                          onChange={(event) =>
                            updateFaq(faq.id, {
                              enabled: event.target.checked,
                            })
                          }
                        />
                        Show this FAQ
                      </label>

                      <button
                        type="button"
                        onClick={() => removeFaq(faq.id)}
                        className="saas-button-danger px-3 py-2 text-sm font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      ) : null}
      {shouldShow("socialLinks") && !shouldShow("brand") ? (      
        <SectionCard
          title="Social Links"
          description="Add links to social profiles and business listings."
          helpText="Social links help visitors verify the business and can improve trust before they start a conversation."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["facebookUrl", "Facebook URL"],
              ["instagramUrl", "Instagram URL"],
              ["yelpUrl", "Yelp URL"],
              ["googleBusinessUrl", "Google Business Profile URL"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {label}
                </span>
                <input
                  value={
                    settings[key as keyof TenantWebsiteSettings]?.toString() ||
                    ""
                  }
                  onChange={(e) =>
                    updateField(
                      key as keyof TenantWebsiteSettings,
                      e.target.value as never
                    )
                  }
                  className="saas-input mt-1 w-full px-3 py-2 text-sm"
                  placeholder="https://..."
                />
              </label>
            ))}
          </div>
        </SectionCard>
      ) : null}
      </div>
      <div className="sticky bottom-4 z-20 mt-6 rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-xl backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-gray-500">
          Save changes before leaving this page.
        </p>

        <button
          type="button"
          onClick={saveSettings}
          disabled={isSaving}
          className="saas-button-accent px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Website Changes"}
        </button>
      </div>
    </div>
    </section>
  );
}