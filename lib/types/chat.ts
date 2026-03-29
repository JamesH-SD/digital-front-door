export type ChatRole = "assistant" | "user" | "system";

export type IntakeStep =
  | "project_type"
  | "location"
  | "timeline"
  | "name"
  | "contact"
  | "complete";

export type IntakeData = {
  projectType?: string;
  location?: string;
  timeline?: string;
  name?: string;
  contact?: string;
};

export type ChatMessage = {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ChatSession = {
  id: string;
  tenantId: string;
  tenantSlug: string;
  status: "active" | "closed";
  createdAt: string;
  currentStep: IntakeStep;
  intakeData: IntakeData;
  leadCaptured: boolean;
};

export type CreateSessionResult = {
  session: ChatSession;
  messages: ChatMessage[];
};

export type SendMessageResult = {
  sessionId: string;
  messages: ChatMessage[];
  session: ChatSession;
};