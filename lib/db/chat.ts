import { ChatMessage, ChatSession } from "@/lib/types/chat";
import { getTenantBySlug } from "@/lib/db/tenants";

const sessions = new Map<string, ChatSession>();
const messages = new Map<string, ChatMessage[]>();

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
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
  };

  const greeting: ChatMessage = {
    id: generateId("msg"),
    sessionId: session.id,
    role: "assistant",
    content: `Hi! I'm the virtual receptionist for ${tenant.businessName}. What kind of project can I help you with today?`,
    createdAt: new Date().toISOString(),
  };

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

  const currentMessages = messages.get(sessionId) ?? [];

  const userMessage: ChatMessage = {
    id: generateId("msg"),
    sessionId,
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  };

  currentMessages.push(userMessage);

  const assistantReply: ChatMessage = {
    id: generateId("msg"),
    sessionId,
    role: "assistant",
    content:
      "Thanks — I’ve got that. Can you share your name, contact info, and a few details about the job?",
    createdAt: new Date().toISOString(),
  };

  currentMessages.push(assistantReply);
  messages.set(sessionId, currentMessages);

  return {
    sessionId,
    messages: currentMessages,
  };
}