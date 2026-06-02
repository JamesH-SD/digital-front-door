"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TenantWebsiteSettings } from "@/lib/types/tenant";

type Props = {
  tenantSlug: string;
  initialSettings?: TenantWebsiteSettings;
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

  servicesSectionHeading: "Services",
  servicesSectionTitle: "Services customers can ask about",
  servicesSectionDescription:
    "Explore common services and ask our AI receptionist about the one that fits your needs.",
  services: [],
};

type AssetType = "logo" | "hero" | "whyUs" | "about";

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
  helpText,
  enabled,
  onToggle,
  defaultOpen = false,
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
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <ChevronDown
            className={`mt-0.5 h-5 w-5 shrink-0 text-gray-500 transition ${
              isOpen ? "rotate-180" : ""
            }`}
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-950">
                {title}
              </h3>
              <HelpTip text={helpText} />
            </div>

            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
        </button>

        {typeof enabled === "boolean" && onToggle ? (
          <label
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-gray-700"
          >
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggle(e.target.checked)}
            />
            Show
          </label>
        ) : null}
      </div>

      {isOpen ? (
        <div className="mt-4 border-t border-stone-100 pt-4">{children}</div>
      ) : null}
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
        Upload a JPG, PNG, or WebP image.
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
          className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
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

export default function WebsiteSettingsPanel({
  tenantSlug,
  initialSettings,
}: Props) {
  const [settings, setSettings] = useState<TenantWebsiteSettings>({
    ...defaultSettings,
    ...(initialSettings || {}),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  function updateField<K extends keyof TenantWebsiteSettings>(
    key: K,
    value: TenantWebsiteSettings[K]
  ) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
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
  
    updateField("services", [...getWebsiteServices(), newService]);
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
      <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-950">
            Website Settings
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Customize the public website by section. Each section controls the
            text, images, and visibility used on the tenant website.
          </p>

          <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Changes are not published until you click <strong>Save Website Changes</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={saveSettings}
          disabled={isSaving}
          className="saas-button-accent rounded-xl px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Website Changes"}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-gray-700">
          {message}
        </p>
      ) : null}

      <div className="mt-5 space-y-5">
      <SectionCard
          title="Brand"
          defaultOpen
          description="Set the business logo and website colors."
          helpText="Use this section to control the overall look of the website. Upload a logo and choose colors that match the business brand."
        >
          <div className="grid gap-5 lg:grid-cols-3">
            <ImageUploadCard
              label="Logo"
              imageUrl={settings.logoUrl}
              isSaving={isSaving}
              onUpload={(file) => void uploadAsset("logo", file)}
              onUseDefault={() => updateField("logoUrl", "")}
            />

            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:col-span-2">
              <h4 className="text-sm font-semibold text-gray-950">
                Brand Colors
              </h4>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Primary Color
                  </span>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={settings.primaryColor || "#1F3B4D"}
                      onChange={(e) =>
                        updateField("primaryColor", e.target.value)
                      }
                      className="h-10 w-12 rounded-lg border border-stone-200 bg-white"
                    />
                    <input
                      value={settings.primaryColor || ""}
                      onChange={(e) =>
                        updateField("primaryColor", e.target.value)
                      }
                      className="saas-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Accent Color
                  </span>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="color"
                      value={settings.accentColor || "#4E9271"}
                      onChange={(e) =>
                        updateField("accentColor", e.target.value)
                      }
                      className="h-10 w-12 rounded-lg border border-stone-200 bg-white"
                    />
                    <input
                      value={settings.accentColor || ""}
                      onChange={(e) =>
                        updateField("accentColor", e.target.value)
                      }
                      className="saas-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </SectionCard>

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

            <div className="space-y-4">
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
                  <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[220px_1fr_auto]">
                    <div>
                      {service.imageUrl ? (
                        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                          <img
                            src={service.imageUrl}
                            alt={service.title}
                            className="h-36 w-full object-cover object-center"
                          />
                        </div>
                      ) : (
                        <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-sm text-gray-500">
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
                          className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
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
                    </div>

                    <div className="flex items-start">
                      <button
                        type="button"
                        onClick={() => removeService(service.id)}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-800"
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

        <SectionCard
          title="FAQs Section"
          description="Show common questions customers may have."
          helpText="FAQs reduce repetitive questions and also help the AI receptionist answer customer questions more accurately."
          enabled={settings.showFaqs !== false}
          onToggle={(checked) => updateField("showFaqs", checked)}
        >
          <div className="space-y-4">
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

            <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-gray-600">
              Individual FAQ questions are still generated from business settings and
              default questions for now.
            </p>
          </div>
        </SectionCard>

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
      </div>
    </section>
  );
}