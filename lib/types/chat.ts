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

export type SchedulingStep =
  | "idle"
  | "offer_slots"
  | "select_day"
  | "select_slot"
  | "collect_details"
  | "collect_email"
  | "confirm"
  | "fallback_followup";

export type SchedulingState = {
  active?: boolean;
  step?: SchedulingStep;

  appointmentType?: "call" | "site_visit";

  selectedDay?: {
    optionNumber: number;
    dateKey: string;
    displayLabel: string;
    slots?: any[];
  };

  availableDays?: {
    optionNumber: number;
    dateKey: string;
    displayLabel: string;
    slots?: any[];
  }[];

  offeredSlots?: {
    optionNumber: number;
    displayTime: string;
    startAt?: string;
    endAt?: string;
    timezone?: string;
  }[];

  selectedSlot?: {
    optionNumber?: number;
    displayTime?: string;
    startAt: string;
    endAt: string;
    timezone: string;
  };

  address?: string;
  email?: string;
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

  /**
 * Scheduling flow state (NEW)
 *
 * IMPORTANT:
 * - This is optional so it does NOT break existing sessions
 * - We are NOT using it yet (safe addition)
 * - Will be activated in later steps
 */
schedulingState?: SchedulingState;
};