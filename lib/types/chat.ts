export type ChatRole = "user" | "assistant" | "system";

export type IntakeStep =
  | "project_type"
  | "location"
  | "timeline"
  | "name"
  | "contact"
  | "complete";

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type IntakeData = {
  projectType?: string;
  location?: string;
  timeline?: string;
  name?: string;

  /**
   * Primary contact method for the initial lead capture.
   * For the current MVP, this is the normalized phone number.
   */
  contact?: string;

  /**
   * Optional email captured after the lead has already been created.
   * This is not required for initial lead creation.
   */
  email?: string;

  [key: string]: any;
};

export type ChatSession = {
  id: string;
  tenantId?: string;
  tenantSlug: string;
  status: "active" | "closed";
  createdAt: string;
  currentStep: IntakeStep;
  intakeData: IntakeData;
  leadCaptured: boolean;
  leadId?: string | null;
  notificationSentAt?: string | null;
};