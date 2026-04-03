"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Tenant } from "@/lib/types/tenant";
import { ChatMessage, IntakeStep } from "@/lib/types/chat";
import type { LeadImage } from "@/lib/types/lead";

type Props = {
  tenant: Tenant;
};

type PostCaptureChoice = "idle" | "awaiting_choice" | "adding_more" | "standby";

type LocalAssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
  createdAt: string;
};

function createLocalAssistantMessage(content: string): LocalAssistantMessage {
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };
}

export function ChatWidget({ tenant }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  /**
   * Server-backed messages returned from the API.
   */
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  /**
   * Local-only assistant messages used to shape the conversational UX
   * after lead capture.
   */
  const [localMessages, setLocalMessages] = useState<LocalAssistantMessage[]>(
    []
  );

  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<IntakeStep | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<LeadImage[]>([]);

  /**
   * Controls the conversational flow after the lead has already been created.
   */
  const [postCaptureChoice, setPostCaptureChoice] =
    useState<PostCaptureChoice>("idle");

  const hasStartedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const leadCapturedRef = useRef(false);

  const visibleMessages = useMemo(() => {
    const serverVisible = messages.filter((message) => message.role !== "system");
    const combined = [...serverVisible, ...localMessages];

    return combined.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [messages, localMessages]);

  const showPostCaptureButtons =
    leadCaptured && postCaptureChoice === "awaiting_choice";

  const showImageUpload =
    leadCaptured &&
    Boolean(leadId) &&
    postCaptureChoice === "adding_more";

  function resetClientConversationState() {
    setInput("");
    setMessages([]);
    setLocalMessages([]);
    setCurrentStep(null);
    setLeadCaptured(false);
    setSessionId(null);
    setLeadId(null);
    setUploadedImages([]);
    setPostCaptureChoice("idle");
    leadCapturedRef.current = false;
  }

  async function handleStartChat() {
    setIsStarting(true);
    setError(null);
    resetClientConversationState();

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
      setLeadId(data.session?.leadId ?? null);
      setMessages(data.messages ?? []);
      setCurrentStep(data.session?.currentStep ?? null);
      setLeadCaptured(Boolean(data.session?.leadCaptured));
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
        if (data?.error === "Session not found") {
          await handleStartChat();
          setError(
            "Your previous chat expired, so a new chat has been started."
          );
          return;
        }

        throw new Error(data?.error || "Failed to send message");
      }

      setMessages(data.messages ?? []);
      setCurrentStep(data.session?.currentStep ?? null);
      setLeadCaptured(Boolean(data.session?.leadCaptured));
      setLeadId(data.session?.leadId ?? null);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  /**
   * Public chat-side image upload.
   *
   * Images are only uploaded after a lead exists so they can be tied to a
   * real lead record and stored in the same images field already used by
   * the admin lead UI.
   */
  async function handleUploadImage(file: File) {
    if (!leadId) {
      setError("Please finish the initial request before uploading photos.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenantSlug", tenant.slug);

      const response = await fetch(`/api/leads/${leadId}/images`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image");
      }

      if (result.image) {
        setUploadedImages((prev) => [...prev, result.image]);
      }

      setLocalMessages((prev) => [
        ...prev,
        createLocalAssistantMessage(
          "Thanks — we’ve added that photo to your request. If you’d like, you can upload more photos, share an email, or send any extra details here."
        ),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleAddMoreDetailsChoice() {
    setPostCaptureChoice("adding_more");

    setLocalMessages((prev) => [
      ...prev,
      createLocalAssistantMessage(
        "You can share an email here if you'd like us to send updates, quotes, or documents. You can also upload photos or send any extra details that would help us understand your project better."
      ),
    ]);
  }

  function handleNoMoreDetailsChoice() {
    setPostCaptureChoice("standby");

    setLocalMessages((prev) => [
      ...prev,
      createLocalAssistantMessage(
        "Feel free to keep browsing and ask questions anytime. If anything else comes to mind, send it here and we’ll add it to your request."
      ),
    ]);
  }

  /**
   * When the lead is captured for the first time in this session,
   * inject the post-capture conversational bubbles.
   */
  useEffect(() => {
    if (!leadCaptured || leadCapturedRef.current) return;

    leadCapturedRef.current = true;
    setPostCaptureChoice("awaiting_choice");

    setLocalMessages((prev) => [
      ...prev,
      createLocalAssistantMessage(
        "Thanks, I have enough information to get us started."
      ),
      createLocalAssistantMessage(
        "If you'd like, you can also share an email so we can send updates, quotes, or documents. You can also add more details or upload photos to help us understand your project better."
      ),
    ]);
  }, [leadCaptured]);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void handleStartChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Ask a question</h2>
      <p className="mt-3 text-sm text-gray-600">
        Chat with us to ask questions, share project details, and get started.
      </p>

      {!sessionId ? (
        <div className="mt-6 rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
          {isStarting ? "Starting chat..." : "Preparing chat..."}
        </div>
      ) : (
        <div className="mt-6">
          <div className="h-80 space-y-3 overflow-y-auto rounded-xl border bg-gray-50 p-4">
            {visibleMessages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  message.role === "user"
                    ? "ml-auto bg-gray-900 text-white"
                    : "border bg-white text-gray-800"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          {showPostCaptureButtons && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleAddMoreDetailsChoice}
                className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Add Email / Details / Photos
              </button>

              <button
                type="button"
                onClick={handleNoMoreDetailsChoice}
                className="rounded-xl border px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                No, That&apos;s All
              </button>
            </div>
          )}

          {showImageUpload && (
            <div className="mt-4 rounded-2xl border bg-gray-50/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Photos
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Upload any photos you’d like us to review with your request.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void handleUploadImage(file);
                      }

                      e.currentTarget.value = "";
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploading ? "Uploading..." : "Upload Photo"}
                  </button>
                </div>
              </div>

              {uploadedImages.length > 0 ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {uploadedImages.map((image) => (
                    <div
                      key={image.id}
                      className="rounded-xl border bg-white p-3"
                    >
                      <img
                        src={image.url}
                        alt={image.filename || "Uploaded project image"}
                        className="aspect-video w-full rounded-lg object-cover"
                      />
                      <p className="mt-2 truncate text-xs text-gray-600">
                        {image.filename || image.url}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-900">
                  No photos uploaded yet.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSending) {
                  void handleSendMessage();
                }
              }}
              placeholder={
                currentStep === "complete"
                  ? "Share an email or add more details..."
                  : "Type your message..."
              }
              className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2"
            />
            <button
              onClick={() => void handleSendMessage()}
              disabled={isSending}
              className="rounded-xl px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: tenant.primaryColor || "#111827" }}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}