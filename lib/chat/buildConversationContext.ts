import type { ChatSession } from "@/lib/types/chat";
import type { Lead } from "@/lib/types/lead";
import type { Tenant } from "@/lib/types/tenant";

export type ConversationStage =
  | "intake"
  | "lead_captured"
  | "scheduling_active"
  | "appointment_confirmed"
  | "closed";

export type ConversationContext = {
  stage: ConversationStage;
  leadCaptured: boolean;
  appointmentScheduled: boolean;
  schedulingActive: boolean;
  askForImagesEnabled: boolean;
  photosHelpful: boolean;
  hasUploadedFiles: boolean;
  shouldInvitePhotos: boolean;
};

export function buildConversationContext(input: {
  tenant: Tenant;
  session: ChatSession;
  lead: Lead | null;
}): ConversationContext {
  const { tenant, session, lead } = input;

  const schedulingState = session.intakeData?.schedulingState;
  const appointment = lead?.appointment?.trim();

  const appointmentScheduled = Boolean(
    appointment &&
      appointment.toLowerCase() !== "not provided" &&
      appointment.toLowerCase() !== "unknown"
  );

  const schedulingActive = Boolean(schedulingState?.active);
  const askForImagesEnabled = tenant.askForImagesAfterCapture !== false;
  const hasUploadedFiles = (lead?.images?.length ?? 0) > 0;

  const projectType = lead?.projectType?.toLowerCase() || "";
  const category = tenant.primaryCategory?.toLowerCase() || "";

  const photosHelpful =
    projectType.includes("remodel") ||
    projectType.includes("repair") ||
    projectType.includes("patio") ||
    projectType.includes("bathroom") ||
    projectType.includes("kitchen") ||
    projectType.includes("damage") ||
    projectType.includes("install") ||
    category.includes("contractor") ||
    category.includes("construction") ||
    category.includes("remodel");

  const stage: ConversationStage = schedulingActive
    ? "scheduling_active"
    : appointmentScheduled
      ? "appointment_confirmed"
      : session.leadCaptured
        ? "lead_captured"
        : session.status === "closed"
          ? "closed"
          : "intake";

  return {
    stage,
    leadCaptured: session.leadCaptured,
    appointmentScheduled,
    schedulingActive,
    askForImagesEnabled,
    photosHelpful,
    hasUploadedFiles,
    shouldInvitePhotos:
      stage === "appointment_confirmed" &&
      askForImagesEnabled &&
      photosHelpful &&
      !hasUploadedFiles,
  };
}

export function formatConversationContextForPrompt(
  context: ConversationContext
) {
  return [
    `Conversation Stage: ${context.stage}`,
    `Lead Captured: ${context.leadCaptured ? "yes" : "no"}`,
    `Appointment Scheduled: ${context.appointmentScheduled ? "yes" : "no"}`,
    `Scheduling Active: ${context.schedulingActive ? "yes" : "no"}`,
    `Ask For Images Enabled: ${context.askForImagesEnabled ? "yes" : "no"}`,
    `Photos Helpful For This Request: ${context.photosHelpful ? "yes" : "no"}`,
    `Uploaded Files Already Received: ${context.hasUploadedFiles ? "yes" : "no"}`,
    `Should Invite Photo Upload: ${context.shouldInvitePhotos ? "yes" : "no"}`,
  ].join("\n");
}