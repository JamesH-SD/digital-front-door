import { ChatMessage, ChatSession, IntakeStep, ChatRole } from "@/lib/types/chat";
import { getTenantBySlug } from "@/lib/db/tenants";
import { createLead } from "@/lib/db/leads";
import { sendLeadNotification } from "@/lib/notifications/sendLeadNotification";

const sessions = new Map<string, ChatSession>();
const messages = new Map<string, ChatMessage[]>();

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function createMessage(
  sessionId: string,
  role: ChatRole,
  content: string
): ChatMessage {
  return {
    id: generateId("msg"),
    sessionId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function getPromptForStep(step: IntakeStep, businessName: string): string {
  switch (step) {
    case "project_type":
      return `Hi! I'm the virtual receptionist for ${businessName}. What kind of project can I help you with today?`;

    case "location":
      return "Got it. What city is the job located in?";

    case "timeline":
      return "Thanks. What is your timeline for getting this work done?";

    case "name":
      return "Understood. What is your name?";

    case "contact":
      return "Great. What is the best phone number or email for the contractor to reach you?";

    case "complete":
      return "Thanks — I have everything I need. Your request has been captured and the contractor can follow up with you shortly.";

    default:
      return "How can I help you today?";
  }
}

function getNextStep(step: IntakeStep): IntakeStep {
  switch (step) {
    case "project_type":
      return "location";
    case "location":
      return "timeline";
    case "timeline":
      return "name";
    case "name":
      return "contact";
    case "contact":
      return "complete";
    case "complete":
      return "complete";
    default:
      return "project_type";
  }
}

function applyAnswerToSession(session: ChatSession, userInput: string): ChatSession {
  const trimmed = userInput.trim();

  switch (session.currentStep) {
    case "project_type":
      session.intakeData.projectType = trimmed;
      session.currentStep = "location";
      return session;

    case "location":
      session.intakeData.location = trimmed;
      session.currentStep = "timeline";
      return session;

    case "timeline":
      session.intakeData.timeline = trimmed;
      session.currentStep = "name";
      return session;

    case "name":
      session.intakeData.name = trimmed;
      session.currentStep = "contact";
      return session;

    case "contact":
      session.intakeData.contact = trimmed;
      session.currentStep = "complete";
      session.leadCaptured = true;
      session.status = "closed";
      return session;

    case "complete":
      return session;

    default:
      return session;
  }
}

export async function createChatSessionForTenantSlug(tenantSlug: string) {
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    return null;
  }

  const session: ChatSession = {
    id: generateId("sess"),
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    status: "active",
    createdAt: new Date().toISOString(),
    currentStep: "project_type",
    intakeData: {},
    leadCaptured: false,
  };

  const greeting = createMessage(
    session.id,
    "assistant",
    getPromptForStep("project_type", tenant.businessName)
  );

  sessions.set(session.id, session);
  messages.set(session.id, [greeting]);

  return {
    session,
    messages: [greeting],
  };
}

export async function getChatSession(sessionId: string) {
  return sessions.get(sessionId) ?? null;
}

export async function getMessagesForSession(sessionId: string) {
  return messages.get(sessionId) ?? [];
}

export async function addUserMessage(sessionId: string, content: string) {
  const session = sessions.get(sessionId);

  if (!session) {
    return null;
  }

  const tenant = await getTenantBySlug(session.tenantSlug);

  if (!tenant) {
    return null;
  }

  const currentMessages = messages.get(sessionId) ?? [];

  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return {
      sessionId,
      messages: currentMessages,
      session,
    };
  }

  const userMessage = createMessage(sessionId, "user", trimmedContent);
  currentMessages.push(userMessage);

  if (session.currentStep === "complete") {
    const assistantReply = createMessage(
      sessionId,
      "assistant",
      "Your request has already been captured. If you'd like, you can start a new chat for another project."
    );

    currentMessages.push(assistantReply);
    messages.set(sessionId, currentMessages);
    sessions.set(sessionId, session);

    return {
      sessionId,
      messages: currentMessages,
      session,
    };
  }

  const updatedSession = applyAnswerToSession(session, trimmedContent);

  if (updatedSession.currentStep === "complete" && updatedSession.leadCaptured) {
    const alreadyCreated = currentMessages.some(
      (msg) =>
        msg.role === "system" &&
        msg.content.startsWith("LEAD_CREATED:")
    );
  
    if (!alreadyCreated) {
      const intake = updatedSession.intakeData;
    
      console.log("[chat] creating lead with intake:", intake);
    
      const lead = await createLead({
        tenantId: updatedSession.tenantId,
        tenantSlug: updatedSession.tenantSlug,
        customerName: intake.name || "Unknown",
        contact: intake.contact || "Unknown",
        projectType: intake.projectType || "Unknown",
        location: intake.location || "Unknown",
        timeline: intake.timeline || "Unknown",
      });
      
      await sendLeadNotification(lead);
  
      currentMessages.push(
        createMessage(
          sessionId,
          "system",
          `LEAD_CREATED:${new Date().toISOString()}`
        )
      );
    }
  }
  
  const assistantReply = createMessage(
    sessionId,
    "assistant",
    getPromptForStep(updatedSession.currentStep, tenant.businessName)
  );
  
  currentMessages.push(assistantReply);
  
  messages.set(sessionId, currentMessages);
  sessions.set(sessionId, updatedSession);
  
  return {
    sessionId,
    messages: currentMessages,
    session: updatedSession,
  };
}