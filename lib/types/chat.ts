export type ChatRole = "assistant" | "user" | "system";

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
};

export type CreateSessionResult = {
  session: ChatSession;
  messages: ChatMessage[];
};

export type SendMessageResult = {
  sessionId: string;
  messages: ChatMessage[];
};