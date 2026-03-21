"use client";

import { useState } from "react";
import { Tenant } from "@/lib/types/tenant";
import { ChatMessage } from "@/lib/types/chat";

type Props = {
  tenant: Tenant;
};

export function ChatWidget({ tenant }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartChat() {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to start chat");
      }

      setSessionId(data.session.id);
      setMessages(data.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSendMessage() {
    if (!sessionId) return;

    const trimmed = input.trim();
    if (!trimmed) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          content: trimmed,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to send message");
      }

      setMessages(data.messages);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Ask a question</h2>
      <p className="mt-3 text-sm text-gray-600">
        Chat with {tenant.businessName}'s AI receptionist to ask questions,
        check service area, and request a callback.
      </p>

      {!sessionId ? (
        <button
          onClick={handleStartChat}
          disabled={isStarting}
          className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: tenant.primaryColor || "#111827" }}
        >
          {isStarting ? "Starting chat..." : "Start Chat"}
        </button>
      ) : (
        <div className="mt-6">
          <div className="h-80 space-y-3 overflow-y-auto rounded-xl border bg-gray-50 p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  message.role === "user"
                    ? "ml-auto bg-gray-900 text-white"
                    : "bg-white text-gray-800 border"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSending) {
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            />
            <button
              onClick={handleSendMessage}
              disabled={isSending}
              className="rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: tenant.primaryColor || "#111827" }}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}