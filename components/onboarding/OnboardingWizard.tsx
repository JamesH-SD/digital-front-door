"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tenant, TenantDeploymentMode } from "@/lib/types/tenant";
import { buildWizardTenantSnapshot } from "@/lib/onboarding/buildWizardTenantSnapshot";
import { getTenantSetupReadiness } from "@/lib/readiness/getTenantSetupReadiness";
import type { TenantSetupReadiness } from "@/lib/readiness/types";
import type { TenantSetupReadinessDependencies } from "@/lib/readiness/loadTenantSetupReadinessDependencies";
import TenantSetupProgress from "@/components/admin/readiness/TenantSetupProgress";
import TenantKnowledgeManager from "@/components/admin/settings/TenantKnowledgeManager";
import {
  buildOnboardingWizardSteps,
  getCalendarStepExplanation,
  type OnboardingWizardStepKey,
} from "@/lib/onboarding/buildOnboardingWizardSteps";
import {
  CUSTOMER_HELP_OPTIONS,
  getCustomerHelpLabel,
  isLegacyBookingType,
  isTenantFacingBookingType,
  type TenantFacingBookingType,
} from "@/lib/onboarding/customerHelpOptions";
import {
  getOnboardingSkipToastMessage,
  isSkippableOnboardingStep,
} from "@/lib/onboarding/onboardingDeferredSetupMessages";
import ToastMessage from "@/components/ui/ToastMessage";
import OnboardingCustomerExperienceStep from "@/components/onboarding/OnboardingCustomerExperienceStep";
import WizardAiProposalPanel from "@/components/onboarding/WizardAiProposalPanel";
import {
  buildWizardAiAboutContext,
  buildWizardAiTaglineContext,
} from "@/lib/onboarding/buildWizardAiRequestContext";
import type { WizardAiProposeAction } from "@/lib/ai/wizard/types";

type StepKey = OnboardingWizardStepKey;

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DayHours = {
  open: string;
  close: string;
  closed: boolean;
};

type HoursState = Record<DayKey, DayHours>;

const DAYS: DayKey[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const STEP_HELP: Record<
  StepKey,
  {
    eyebrow: string;
    title: string;
    description: string;
    examples?: string[];
  }
> = {
  business: {
    eyebrow: "Business Profile",
    title: "Tell us who customers are contacting.",
    description:
      "This information appears on your website and helps the AI receptionist answer basic questions correctly.",
    examples: [
      "Business name: Hughes General Contractors",
      "Category: General contractor, plumber, mobile detailer",
      "Tagline: Veteran-owned remodeling specialists",
    ],
  },
  serviceArea: {
    eyebrow: "Service Area",
    title: "Where do you work?",
    description:
      "This helps the AI answer questions like “Do you service Vista?” or “Can you come to Temecula?”",
    examples: [
      "Serving San Diego County",
      "North County, Vista, Oceanside, San Marcos",
      "Within 25 miles of Temecula",
    ],
  },
  services: {
    eyebrow: "Services",
    title: "What do you offer?",
    description:
      "List the services you want the AI receptionist to understand. Keep it simple — you can improve this later.",
    examples: [
      "Kitchen remodels",
      "Bathroom remodels",
      "Flooring installation",
      "Emergency plumbing repairs",
    ],
  },
  customerHelp: {
    eyebrow: "Customer experience",
    title: "How should your AI receptionist help customers?",
    description:
      "Choose what your AI receptionist should do when a customer wants help. You can adjust advanced messaging later in AI Receptionist settings.",
  },
  hours: {
    eyebrow: "Business Hours",
    title: "When should customers expect a response?",
    description:
      "These hours help set expectations. You can still receive leads outside of business hours.",
  },
  calendar: {
    eyebrow: "Scheduling",
    title: "Connect your calendar.",
    description: "",
  },
  knowledge: {
    eyebrow: "Train your AI receptionist",
    title: "Help your receptionist learn your business.",
    description:
      "Just like a new employee, your receptionist gets better when it knows more about your business. Add the information customers commonly ask about—policies, products, services, pricing guidance, FAQs, and other useful details. Information you add here is saved to your Knowledge Base and can be updated anytime.",
    examples: [
      "FAQ document",
      "Service descriptions",
      "Pricing guidance",
      "Quote or appointment policies",
    ],
  },
  customerExperience: {
    eyebrow: "Customer experience",
    title: "Prepare how customers reach you.",
    description: "",
  },
  finish: {
    eyebrow: "Review",
    title: "Review your setup.",
    description:
      "Make sure the basics are correct before entering your admin dashboard.",
  },
};

const DEFAULT_HOURS: HoursState = {
  monday: { open: "08:00", close: "17:00", closed: false },
  tuesday: { open: "08:00", close: "17:00", closed: false },
  wednesday: { open: "08:00", close: "17:00", closed: false },
  thursday: { open: "08:00", close: "17:00", closed: false },
  friday: { open: "08:00", close: "17:00", closed: false },
  saturday: { open: "08:00", close: "17:00", closed: true },
  sunday: { open: "08:00", close: "17:00", closed: true },
};

function parseListInput(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDayLabel(day: string) {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function normalizeHours(value: unknown): HoursState {
  if (!value || typeof value !== "object") return DEFAULT_HOURS;

  return {
    ...DEFAULT_HOURS,
    ...(value as Partial<HoursState>),
  };
}

function SummaryRow({
  label,
  value,
  detail,
  onEdit,
}: {
  label: string;
  value: string;
  detail?: string;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">
              ✓
            </span>

            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {label}
            </p>
          </div>

          <p className="mt-2 text-sm font-semibold text-gray-950">{value}</p>

          {detail ? (
            <p className="mt-1 text-sm leading-6 text-gray-500">{detail}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="text-xs font-semibold text-orange-700 hover:text-orange-800"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

/** Step layout only when customer help is not chosen yet (avoids legacy types affecting Calendar visibility). */
const WIZARD_STEP_PLACEHOLDER_BOOKING_TYPE: TenantFacingBookingType = "lead_capture";

type WizardAiFieldState = {
  visible: boolean;
  loading: boolean;
  proposal: string | null;
  error: string | null;
};

const INITIAL_WIZARD_AI_FIELD: WizardAiFieldState = {
  visible: false,
  loading: false,
  proposal: null,
  error: null,
};

type OnboardingWizardProps = {
  tenant: Tenant;
  setupReadiness: TenantSetupReadiness;
  readinessDependencies: TenantSetupReadinessDependencies;
};

export default function OnboardingWizard({
  tenant,
  setupReadiness,
  readinessDependencies,
}: OnboardingWizardProps) {
  const router = useRouter();
  const priorStepRef = useRef<StepKey | null>(null);
  const taglineInputRef = useRef<HTMLInputElement>(null);
  const aboutTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentStepKey, setCurrentStepKey] = useState<StepKey>("business");
  const [taglineAi, setTaglineAi] = useState<WizardAiFieldState>(INITIAL_WIZARD_AI_FIELD);
  const [aboutAi, setAboutAi] = useState<WizardAiFieldState>(INITIAL_WIZARD_AI_FIELD);
  const [returnToReview, setReturnToReview] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [skipToastMessage, setSkipToastMessage] = useState<string | null>(null);

  const [customerHelpChoice, setCustomerHelpChoice] =
    useState<TenantFacingBookingType | null>(() =>
      isTenantFacingBookingType(tenant.bookingType) ? tenant.bookingType : null
    );

  const [form, setForm] = useState({
    businessName: tenant.businessName || "",
    primaryPhone: tenant.primaryPhone || "",
    email: tenant.email || "",
    websiteUrl: tenant.websiteUrl || "",
    deploymentMode: (tenant.deploymentMode ?? null) as TenantDeploymentMode | null,
    primaryCategory: tenant.primaryCategory || "",
    tagline: tenant.tagline || "",
    aboutUs: tenant.aboutUs || "",
    licenseNumber: tenant.licenseNumber || "",
    isInsured: tenant.isInsured ?? false,

    addressLine1: tenant.addressLine1 || "",
    city: tenant.city || "",
    state: tenant.state || "",
    country: tenant.country || "United States",
    zip: tenant.zip || "",
    serviceAreaSummary: tenant.serviceAreaSummary || "",
    serviceCities: (tenant.serviceCities || []).join(", "),

    servicesOffered: (tenant.servicesOffered || []).join("\n"),
    bookingType: tenant.bookingType ?? "",
    nextStepMessage: tenant.nextStepMessage || "",

    hours: normalizeHours(tenant.hours),
  });

  const steps = useMemo(
    () =>
      buildOnboardingWizardSteps(
        customerHelpChoice ?? WIZARD_STEP_PLACEHOLDER_BOOKING_TYPE
      ),
    [customerHelpChoice]
  );

  const stepIndex = steps.findIndex((step) => step.key === currentStepKey);
  const safeStepIndex = stepIndex >= 0 ? stepIndex : 0;
  const currentStep = steps[safeStepIndex] ?? steps[0];
  const progressPercent = Math.round(((safeStepIndex + 1) / steps.length) * 100);

  useEffect(() => {
    if (steps.some((step) => step.key === currentStepKey)) {
      return;
    }

    const fallbackKey = steps[Math.min(safeStepIndex, steps.length - 1)]?.key;
    if (fallbackKey) {
      setCurrentStepKey(fallbackKey);
    }
  }, [steps, currentStepKey, safeStepIndex]);

  const reviewReadiness = useMemo(() => {
    if (currentStepKey !== "finish") {
      return setupReadiness;
    }

    const snapshot = buildWizardTenantSnapshot(tenant, form, customerHelpChoice);

    return getTenantSetupReadiness({
      tenant: snapshot,
      ...readinessDependencies,
    });
  }, [
    currentStepKey,
    setupReadiness,
    tenant,
    form,
    customerHelpChoice,
    readinessDependencies,
  ]);

  function editFromReview(stepKey: StepKey) {
    setReturnToReview(true);
    setCurrentStepKey(stepKey);
  }

  function goToStepKey(stepKey: StepKey) {
    if (steps.some((step) => step.key === stepKey)) {
      setCurrentStepKey(stepKey);
    }
  }

  function goBack() {
    setMessage("");
    setCurrentStepKey((prev) => {
      const index = steps.findIndex((step) => step.key === prev);
      if (index <= 0) return prev;
      return steps[index - 1].key;
    });
  }

  function advanceToNextStep() {
    setCurrentStepKey((prev) => {
      const index = steps.findIndex((step) => step.key === prev);
      if (index < 0 || index >= steps.length - 1) {
        return steps[steps.length - 1]?.key ?? prev;
      }
      return steps[index + 1].key;
    });
  }

  function skipOptionalStep() {
    if (!isSkippableOnboardingStep(currentStep.key)) {
      return;
    }

    setMessage("");
    setSkipToastMessage(
      getOnboardingSkipToastMessage(currentStep.key, {
        deploymentMode: form.deploymentMode,
      })
    );
    advanceToNextStep();
  }

  function updateHoursDay(day: DayKey, updates: Partial<DayHours>) {
    setForm((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          ...updates,
        },
      },
    }));
  }

  function applyMondayToWeekdays() {
    const monday = form.hours.monday;

    setForm((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        monday,
        tuesday: { ...monday },
        wednesday: { ...monday },
        thursday: { ...monday },
        friday: { ...monday },
      },
    }));
  }

  function applyMondayToAllDays() {
    const monday = form.hours.monday;

    setForm((prev) => ({
      ...prev,
      hours: {
        monday: { ...monday },
        tuesday: { ...monday },
        wednesday: { ...monday },
        thursday: { ...monday },
        friday: { ...monday },
        saturday: { ...monday },
        sunday: { ...monday },
      },
    }));
  }

  function closeWizardAiField(action: WizardAiProposeAction) {
    if (action === "tagline") {
      setTaglineAi(INITIAL_WIZARD_AI_FIELD);
      return;
    }

    setAboutAi(INITIAL_WIZARD_AI_FIELD);
  }

  function applyWizardAiProposal(action: WizardAiProposeAction, focusField: boolean) {
    const state = action === "tagline" ? taglineAi : aboutAi;
    if (!state.proposal) {
      return;
    }

    if (action === "tagline") {
      setForm((prev) => ({ ...prev, tagline: state.proposal! }));
      closeWizardAiField("tagline");
      if (focusField) {
        taglineInputRef.current?.focus();
      }
      return;
    }

    setForm((prev) => ({ ...prev, aboutUs: state.proposal! }));
    closeWizardAiField("about");
    if (focusField) {
      aboutTextareaRef.current?.focus();
    }
  }

  async function requestWizardAiProposal(action: WizardAiProposeAction) {
    const setState = action === "tagline" ? setTaglineAi : setAboutAi;
    const context =
      action === "tagline"
        ? buildWizardAiTaglineContext(form)
        : buildWizardAiAboutContext(form);

    setState({
      visible: true,
      loading: true,
      proposal: null,
      error: null,
    });

    try {
      const response = await fetch(
        `/api/admin/tenants/${tenant.slug}/wizard-ai/propose`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action, context }),
        }
      );

      const result = await response.json();

      if (result.status === "generated" && typeof result.proposal === "string") {
        setState({
          visible: true,
          loading: false,
          proposal: result.proposal,
          error: null,
        });
        return;
      }

      setState({
        visible: true,
        loading: false,
        proposal: null,
        error:
          result.reason ||
          result.error ||
          "Could not generate a suggestion right now. You can continue typing manually.",
      });
    } catch {
      setState({
        visible: true,
        loading: false,
        proposal: null,
        error:
          "Could not generate a suggestion right now. You can continue typing manually.",
      });
    }
  }

  function generateServices() {
    const category = form.primaryCategory || "service business";
  
    setForm((prev) => ({
      ...prev,
      servicesOffered: [
        `${category} consultations`,
        `${category} estimates`,
        `${category} repairs`,
        `${category} maintenance`,
      ].join("\n"),
    }));
  }

  async function saveProgress() {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/tenants/${tenant.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessName: form.businessName,
          primaryPhone: form.primaryPhone,
          email: form.email,
          websiteUrl: form.websiteUrl.trim(),
          deploymentMode: form.deploymentMode,
          primaryCategory: form.primaryCategory,
          tagline: form.tagline,
          aboutUs: form.aboutUs,
          licenseNumber: form.licenseNumber,
          isInsured: form.isInsured,

          addressLine1: form.addressLine1,
          city: form.city,
          state: form.state,
          country: form.country,
          zip: form.zip,
          serviceAreaSummary: form.serviceAreaSummary,
          serviceCities: parseListInput(form.serviceCities),

          servicesOffered: parseListInput(form.servicesOffered),
          ...(customerHelpChoice
            ? { bookingType: customerHelpChoice }
            : form.bookingType
            ? { bookingType: form.bookingType }
            : {}),
          nextStepMessage: form.nextStepMessage,

          hours: form.hours,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save onboarding step.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    if (currentStepKey !== "finish") {
      priorStepRef.current = currentStepKey;
      return;
    }

    if (priorStepRef.current === "finish") {
      return;
    }

    priorStepRef.current = "finish";

    void (async () => {
      try {
        await saveProgress();
        router.refresh();
      } catch {
        // goNext surfaces save errors when advancing steps
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh once when entering Review
  }, [currentStepKey]);

  async function goNext() {
    try {
      if (currentStep.key === "business") {
        if (!form.businessName.trim() || !form.primaryPhone.trim()) {
          setMessage("Business name and primary phone are required.");
          return;
        }

        if (!form.deploymentMode) {
          setMessage("Please tell us whether you already have a business website.");
          return;
        }

        if (form.deploymentMode === "existing_site" && !form.websiteUrl.trim()) {
          setMessage("Website URL is required when you already have a business website.");
          return;
        }
      }

      if (currentStep.key === "serviceArea") {
        if (!form.serviceAreaSummary.trim()) {
          setMessage("Service area summary is required.");
          return;
        }
      }

      if (currentStep.key === "services") {
        if (parseListInput(form.servicesOffered).length === 0) {
          setMessage("Please add at least one service.");
          return;
        }
      }

      if (currentStep.key === "customerHelp") {
        if (!customerHelpChoice) {
          setMessage("Please choose how Contactor should help customers.");
          return;
        }
      }

      await saveProgress();

      if (currentStep.key === "finish") {
        window.location.href = `/admin/${tenant.slug}`;
        return;
      }

      if (returnToReview) {
        setReturnToReview(false);
        setCurrentStepKey("finish");
        return;
      }

      advanceToNextStep();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save onboarding."
      );
    }
  }

  return (
    <div className="w-full">
      {skipToastMessage ? (
        <ToastMessage
          message={skipToastMessage}
          variant="success"
          durationMs={7000}
          onClose={() => setSkipToastMessage(null)}
        />
      ) : null}

      <div className="w-full">
        <div className="w-full">
          <div className="rounded-3xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
              Digital Front Door Setup
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
              Let’s set up {form.businessName || tenant.businessName || "your business"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              Complete the essentials now. You can refine everything later from
              Admin Settings.
            </p>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-gray-500">
                <span>
                  Step {safeStepIndex + 1} of {steps.length}: {currentStep.label}
                </span>
                <span>{progressPercent}%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div
                className="mt-4 hidden gap-2 text-xs font-semibold text-gray-500 md:grid"
                style={{
                  gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
                }}
              >
                {steps.map((step, index) => (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => goToStepKey(step.key)}
                    className={`rounded-xl px-2 py-2 text-left transition ${
                      index === safeStepIndex
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                        : index < safeStepIndex
                        ? "bg-orange-50 text-orange-800"
                        : "bg-white text-gray-500"
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="mt-5 rounded-3xl border border-stone-200 bg-white p-5">
            <div className="mb-5 flex flex-col gap-2 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
              <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
                {STEP_HELP[currentStep.key].eyebrow}
              </p>

              <h2 className="mt-1 text-xl font-bold text-gray-950">
                {currentStep.key === "customerExperience"
                  ? form.deploymentMode === "existing_site"
                    ? "Add Contactor to your website"
                    : form.deploymentMode === "hosted"
                    ? "Your Contactor website"
                    : STEP_HELP.customerExperience.title
                  : STEP_HELP[currentStep.key].title}
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                {currentStep.key === "calendar"
                  ? getCalendarStepExplanation(
                      customerHelpChoice ?? form.bookingType
                    )
                  : currentStep.key === "customerExperience"
                  ? form.deploymentMode === "existing_site"
                    ? "Install the Contactor snippet on your website so visitors can open your AI receptionist."
                    : form.deploymentMode === "hosted"
                    ? "Preview and finish your Contactor-hosted website when you are ready for customers to visit."
                    : "Choose your website setup on the Business step to continue."
                  : STEP_HELP[currentStep.key].description}
              </p>

              {STEP_HELP[currentStep.key].examples ? (
                <div className="mt-4 rounded-2xl border border-orange-100 bg-orange-50/60 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-800">
                    Examples
                  </p>

                  <ul className="mt-2 space-y-1 text-sm text-orange-900">
                    {STEP_HELP[currentStep.key].examples?.map((example) => (
                      <li key={example}>• {example}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              </div>
            </div>

            {currentStep.key === "business" ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={form.businessName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, businessName: e.target.value }))
                    }
                    placeholder="Business name *"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <input
                    value={form.primaryPhone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, primaryPhone: e.target.value }))
                    }
                    placeholder="Primary business phone *"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <input
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Business email"
                    className="saas-input w-full px-3 py-2 text-sm md:col-span-2"
                  />

                  <input
                    value={form.primaryCategory}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        primaryCategory: e.target.value,
                      }))
                    }
                    placeholder="Business type/category"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <div>
                    <div className="relative">
                      <input
                        ref={taglineInputRef}
                        value={form.tagline}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, tagline: e.target.value }))
                        }
                        placeholder="Short tagline"
                        className="saas-input w-full px-3 py-2 pr-10 text-sm"
                      />

                      <button
                        type="button"
                        onClick={() => void requestWizardAiProposal("tagline")}
                        disabled={taglineAi.loading}
                        title="Get AI suggestion"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 text-sm hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ✨
                      </button>
                    </div>

                    {taglineAi.visible ? (
                      <WizardAiProposalPanel
                        label="Tagline"
                        loading={taglineAi.loading}
                        proposal={taglineAi.proposal}
                        error={taglineAi.error}
                        onUseThis={() => applyWizardAiProposal("tagline", false)}
                        onEdit={() => applyWizardAiProposal("tagline", true)}
                        onTryAgain={() => void requestWizardAiProposal("tagline")}
                        onCancel={() => closeWizardAiField("tagline")}
                      />
                    ) : null}
                  </div>

                  <input
                    value={form.licenseNumber}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        licenseNumber: e.target.value,
                      }))
                    }
                    placeholder="License number, if applicable"
                    className="saas-input w-full px-3 py-2 text-sm"
                  />

                  <label className="saas-input flex items-center gap-2 px-3 py-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.isInsured}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          isInsured: e.target.checked,
                        }))
                      }
                    />
                    Insured
                  </label>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4">
                  <p className="text-sm font-semibold text-gray-900">
                    Do you already have a business website?
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-gray-800">
                      <input
                        type="radio"
                        name="deploymentMode"
                        checked={form.deploymentMode === "existing_site"}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            deploymentMode: "existing_site",
                          }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="font-semibold">Yes</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          I will add Contactor to my existing website.
                        </span>
                      </span>
                    </label>

                    <label className="flex flex-1 cursor-pointer items-start gap-2 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-gray-800">
                      <input
                        type="radio"
                        name="deploymentMode"
                        checked={form.deploymentMode === "hosted"}
                        onChange={() =>
                          setForm((prev) => ({
                            ...prev,
                            deploymentMode: "hosted",
                          }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="font-semibold">No</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          Contactor can provide a customer-facing website for my
                          business.
                        </span>
                      </span>
                    </label>
                  </div>

                  {form.deploymentMode === "existing_site" ? (
                    <input
                      value={form.websiteUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          websiteUrl: e.target.value,
                        }))
                      }
                      placeholder="Website URL *"
                      className="saas-input mt-3 w-full px-3 py-2 text-sm"
                    />
                  ) : null}

                  {form.deploymentMode === "hosted" ? (
                    <p className="mt-3 text-xs leading-5 text-gray-600">
                      You can customize and publish your Contactor website from
                      Admin after setup. Your deployment choice is saved
                      separately from any marketing links you add later.
                    </p>
                  ) : null}
                </div>

                <div>
                  <div className="relative">
                    <textarea
                      ref={aboutTextareaRef}
                      value={form.aboutUs}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          aboutUs: e.target.value,
                        }))
                      }
                      rows={5}
                      placeholder="About the business"
                      className="saas-input w-full px-3 py-2 pr-10 text-sm"
                    />

                    <button
                      type="button"
                      onClick={() => void requestWizardAiProposal("about")}
                      disabled={aboutAi.loading}
                      title="Get AI suggestion"
                      className="absolute right-2 top-2 rounded-full px-2 text-sm hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ✨
                    </button>
                  </div>

                  {aboutAi.visible ? (
                    <WizardAiProposalPanel
                      label="About"
                      loading={aboutAi.loading}
                      proposal={aboutAi.proposal}
                      error={aboutAi.error}
                      onUseThis={() => applyWizardAiProposal("about", false)}
                      onEdit={() => applyWizardAiProposal("about", true)}
                      onTryAgain={() => void requestWizardAiProposal("about")}
                      onCancel={() => closeWizardAiField("about")}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            {currentStep.key === "serviceArea" ? (
              <div className="space-y-4">
                <input
                  value={form.serviceAreaSummary}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      serviceAreaSummary: e.target.value,
                    }))
                  }
                  placeholder="Example: Serving San Diego County *"
                  className="saas-input w-full px-3 py-2 text-sm"
                />

                <div className="grid gap-4 md:grid-cols-4">
                  <input
                    value={form.addressLine1}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, addressLine1: e.target.value }))
                    }
                    placeholder="Business address"
                    className="saas-input px-3 py-2 text-sm md:col-span-2"
                  />

                  <input
                    value={form.city}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, city: e.target.value }))
                    }
                    placeholder="City"
                    className="saas-input px-3 py-2 text-sm"
                  />

                  <select
                    value={form.state}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, state: e.target.value }))
                    }
                    className="saas-input px-3 py-2 text-sm"
                  >
                    <option value="">State</option>
                    <option value="CA">CA</option>
                    <option value="AZ">AZ</option>
                    <option value="NV">NV</option>
                    <option value="TX">TX</option>
                    <option value="FL">FL</option>
                    <option value="NY">NY</option>
                  </select>

                  <select
                    value={form.country}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, country: e.target.value }))
                    }
                    className="saas-input px-3 py-2 text-sm"
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                  </select>    

                  <input
                    value={form.zip}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, zip: e.target.value }))
                    }
                    placeholder="ZIP"
                    className="saas-input px-3 py-2 text-sm"
                  />
                </div>

                <textarea
                  value={form.serviceCities}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, serviceCities: e.target.value }))
                  }
                  rows={5}
                  placeholder="Service cities. Separate by commas or put one per line."
                  className="saas-input w-full px-3 py-2 text-sm"
                />
              </div>
            ) : null}

            {currentStep.key === "services" ? (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={form.servicesOffered}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        servicesOffered: e.target.value,
                      }))
                    }
                    rows={8}
                    placeholder="Add one service per line. Example: Bathroom remodel, Kitchen remodel, Flooring"
                    className="saas-input w-full px-3 py-2 pr-10 text-sm"
                  />

                  <button
                    type="button"
                    onClick={generateServices}
                    title="Let AI help"
                    className="absolute right-2 top-2 rounded-full px-2 text-sm hover:bg-orange-50"
                  >
                    ✨
                  </button>
                </div>
              </div>
            ) : null}

            {currentStep.key === "customerHelp" ? (
              <div className="space-y-3">
                {!customerHelpChoice && isLegacyBookingType(form.bookingType) ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    Please choose one of the supported options below to continue
                    setup. Your previous configuration is not shown here.
                  </p>
                ) : null}

                {CUSTOMER_HELP_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                      customerHelpChoice === option.value
                        ? "border-orange-300 bg-orange-50/60 ring-1 ring-orange-200"
                        : "border-stone-200 bg-white hover:border-orange-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="customerHelp"
                      value={option.value}
                      checked={customerHelpChoice === option.value}
                      onChange={() => {
                        setCustomerHelpChoice(option.value);
                        setForm((prev) => ({
                          ...prev,
                          bookingType: option.value,
                        }));
                      }}
                      className="mt-1"
                    />

                    <span>
                      <span className="text-sm font-semibold text-gray-950">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-gray-600">
                        {option.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}

            {currentStep.key === "hours" ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-3">
                  <button
                    type="button"
                    onClick={applyMondayToWeekdays}
                    className="saas-button-secondary px-3 py-2 text-xs font-semibold"
                  >
                    Apply Monday to weekdays
                  </button>

                  <button
                    type="button"
                    onClick={applyMondayToAllDays}
                    className="saas-button-secondary px-3 py-2 text-xs font-semibold"
                  >
                    Apply Monday to all days
                  </button>
                </div>

                {DAYS.map((day) => {
                  const value = form.hours[day];

                  return (
                    <div
                      key={day}
                      className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-3 md:grid-cols-[130px_auto_1fr_1fr]"
                    >
                      <div className="flex items-center text-sm font-semibold text-gray-800">
                        {formatDayLabel(day)}
                      </div>

                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={value.closed}
                          onChange={(e) =>
                            updateHoursDay(day, { closed: e.target.checked })
                          }
                        />
                        Closed
                      </label>

                      <input
                        type="time"
                        value={value.open}
                        disabled={value.closed}
                        onChange={(e) =>
                          updateHoursDay(day, { open: e.target.value })
                        }
                        className="saas-input px-3 py-2 text-sm disabled:bg-stone-100"
                      />

                      <input
                        type="time"
                        value={value.close}
                        disabled={value.closed}
                        onChange={(e) =>
                          updateHoursDay(day, { close: e.target.value })
                        }
                        className="saas-input px-3 py-2 text-sm disabled:bg-stone-100"
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}

            {currentStep.key === "calendar" ? (
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-sm leading-6 text-gray-700">
                  Connect Google Calendar now, or skip and connect it later from
                  Settings.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      `/api/admin/tenants/${tenant.slug}/calendar-connections/google/start` +
                      `?returnTo=${encodeURIComponent(`/onboarding/${tenant.slug}`)}`;
                  }}
                  className="saas-button-accent mt-4 px-4 py-2 text-sm font-semibold"
                >
                  Connect Google Calendar
                </button>
              </div>
            ) : null}

            {currentStep.key === "knowledge" ? (
              <div className="-mx-2">
                <TenantKnowledgeManager tenantSlug={tenant.slug} />
              </div>
            ) : null}

            {currentStep.key === "customerExperience" ? (
              <OnboardingCustomerExperienceStep
                tenantSlug={tenant.slug}
                deploymentMode={form.deploymentMode}
                websiteUrl={form.websiteUrl}
                websiteStatus={tenant.websiteStatus}
              />
            ) : null}

            {currentStep.key === "finish" ? (
              <div className="space-y-5">
                <div
                  className={
                    reviewReadiness.overallPercent === 100
                      ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800"
                      : "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900"
                  }
                >
                  <p className="font-semibold">
                    {reviewReadiness.overallPercent === 100
                      ? "Your core Contactor setup is operationally ready."
                      : "Some operational items still need attention."}
                  </p>
                  <p className="mt-1 leading-6">
                    You can finish onboarding and continue in the Dashboard. Suggested
                    improvements below are optional and do not block launch.
                  </p>
                </div>

                <TenantSetupProgress
                  tenantSlug={tenant.slug}
                  readiness={reviewReadiness}
                  variant="review"
                />

                <div>
                  <h3 className="text-sm font-bold text-gray-950">
                    Confirm what you entered
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Quick factual summary — edit any section before you finish.
                  </p>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <SummaryRow
                      label="Business"
                      value={form.businessName || "Not provided"}
                      detail={form.primaryCategory || "No business category added yet"}
                      onEdit={() => editFromReview("business")}
                    />

                    <SummaryRow
                      label="Contact"
                      value={form.primaryPhone || "No phone added yet"}
                      detail={form.email || "No business email added yet"}
                      onEdit={() => editFromReview("business")}
                    />

                    <SummaryRow
                      label="Customer website"
                      value={
                        form.deploymentMode === "existing_site"
                          ? "Existing website"
                          : form.deploymentMode === "hosted"
                          ? "Contactor-hosted website"
                          : "Not selected yet"
                      }
                      detail={
                        form.deploymentMode === "existing_site"
                          ? form.websiteUrl || "Website URL not added yet"
                          : "Publish from Website in Admin when ready"
                      }
                      onEdit={() => editFromReview("business")}
                    />

                    <SummaryRow
                      label="How Contactor helps"
                      value={
                        getCustomerHelpLabel(customerHelpChoice) ||
                        (customerHelpChoice
                          ? customerHelpChoice.replaceAll("_", " ")
                          : isLegacyBookingType(form.bookingType)
                          ? "Legacy configuration — choose a supported option"
                          : "Not selected yet")
                      }
                      detail="Advanced AI messaging is editable in AI Receptionist settings."
                      onEdit={() => editFromReview("customerHelp")}
                    />

                    <SummaryRow
                      label="Services"
                      value={`${parseListInput(form.servicesOffered).length} service(s) added`}
                      detail={
                        parseListInput(form.servicesOffered).length
                          ? parseListInput(form.servicesOffered).slice(0, 5).join(", ")
                          : "No services added yet"
                      }
                      onEdit={() => editFromReview("services")}
                    />

                    <SummaryRow
                      label="Service area"
                      value={form.serviceAreaSummary || "Not provided"}
                      onEdit={() => editFromReview("serviceArea")}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {message ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {message}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={safeStepIndex === 0}
                className="saas-button-secondary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>

              <div className="flex gap-3">
                {isSkippableOnboardingStep(currentStep.key) ? (
                  <button
                    type="button"
                    onClick={skipOptionalStep}
                    className="px-2 py-2 text-sm font-semibold text-gray-600 underline-offset-2 hover:text-orange-700 hover:underline"
                  >
                    Skip for now
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => void goNext()}
                  disabled={isSaving}
                  className="saas-button-accent px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : currentStep.key === "finish"
                    ? "Launch Dashboard"
                    : returnToReview
                    ? "Save & Return to Review"
                    : "Save & Continue"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}