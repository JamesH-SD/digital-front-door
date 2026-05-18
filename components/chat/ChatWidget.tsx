"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Tenant } from "@/lib/types/tenant";
import { ChatMessage, IntakeStep } from "@/lib/types/chat";
import type { LeadImage } from "@/lib/types/lead";
import ChatSchedulingPicker from "@/components/chat/ChatSchedulingPicker";
import type { SchedulingState } from "@/lib/types/chat";

type Props = {
  tenant: Tenant;
};

type LocalAssistantMessage = {
  id: string;
  role: "assistant";
  content: string;
  createdAt: string;
};

type LocalUploadMessage = {
  id: string;
  role: "upload";
  createdAt: string;
  attachment?: LeadImage;
  image?: LeadImage;
};

type LocalMessage = LocalAssistantMessage | LocalUploadMessage;

function createLocalAssistantMessage(content: string): LocalAssistantMessage {
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  };
}

function createLocalUploadMessage(attachment: LeadImage): LocalUploadMessage {
  return {
    id: `upload_${attachment.id}`,
    role: "upload",
    createdAt: new Date().toISOString(),
    attachment,
  };
}

function getAttachmentExtension(filename?: string) {
  if (!filename) return "";

  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function isImageAttachment(filename?: string, url?: string) {
  const extension = getAttachmentExtension(filename);

  if (["jpg", "jpeg", "png", "webp", "heic"].includes(extension)) {
    return true;
  }

  if (url) {
    return /\.(jpg|jpeg|png|webp|heic)(\?|$)/i.test(url);
  }

  return false;
}

function getFileBadge(extension: string) {
  switch (extension) {
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
      return "DOC";
    case "xls":
    case "xlsx":
      return "XLS";
    case "csv":
      return "CSV";
    case "zip":
      return "ZIP";
    case "txt":
      return "TXT";
    default:
      return "FILE";
  }
}

export function ChatWidget({ tenant }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);

  const [input, setInput] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<IntakeStep | null>(null);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);

  const hasStartedRef = useRef(false);
  const photoLibraryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [schedulingState, setSchedulingState] = useState<SchedulingState | null>(null);

  const visibleMessages = useMemo(() => {
    const serverVisible = messages.filter((message) => message.role !== "system");

    const combined = [...serverVisible, ...localMessages];

    return combined.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [messages, localMessages]);

  function resetClientConversationState() {
    setInput("");
    setMessages([]);
    setLocalMessages([]);
    setCurrentStep(null);
    setLeadCaptured(false);
    setSessionId(null);
    setLeadId(null);
    setIsAttachMenuOpen(false);
    setSchedulingState(null);
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
      setSchedulingState(data.session?.intakeData?.schedulingState ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsStarting(false);
    }
  }

  function handleSchedulingOptionSelect(value: string) {
    void handleSendMessage(value);
  }

  async function handleSendMessage(messageOverride?: string) {
    if (!sessionId) return;
  
    const trimmed = (messageOverride ?? input).trim();
    if (!trimmed) return;
  
    if (!messageOverride) {
      setInput("");
    }
  
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
      setSchedulingState(
        data.session?.intakeData?.schedulingState ?? null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  async function handleUploadImage(file: File) {
    // ✅ Frontend file size validation
    setError(null);

    if (file.size > 15 * 1024 * 1024) {
      setError("File is too large. Max size is 15MB.");
      return;
    }
  
    if (!leadId) {
      setError("Please finish the initial request before uploading photos.");
      setIsAttachMenuOpen(false);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setIsAttachMenuOpen(false);

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
        const uploadedAttachment: LeadImage = result.image;

        setLocalMessages((prev) => [
          ...prev,
          createLocalUploadMessage(uploadedAttachment),
          createLocalAssistantMessage(
            "Got it, added to your request."
          ),
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleAttachmentButtonClick() {
    setIsAttachMenuOpen((prev) => !prev);
  }

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    void handleStartChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }, [visibleMessages, isSending, isUploading]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!composerRef.current) return;

      if (!composerRef.current.contains(event.target as Node)) {
        setIsAttachMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
          <div
            ref={scrollContainerRef}
            className="h-[420px] space-y-3 overflow-y-auto rounded-xl border bg-gray-50 p-4"
          >
            {visibleMessages.map((message) => {
              if ("role" in message && message.role === "upload") {
                const attachment = message.attachment ?? message.image ?? null;

                if (!attachment) {
                  return null;
                }

                const filename = attachment.filename || "Uploaded file";
                const extension = getAttachmentExtension(filename);
                const isImage = isImageAttachment(filename, attachment.url);

                if (isImage) {
                  return (
                    <div
                      key={message.id}
                      className="max-w-[85%] rounded-2xl border bg-white p-3 text-sm text-gray-800"
                    >
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border bg-gray-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={attachment.url}
                          alt={filename}
                          className="max-h-72 w-full object-cover"
                        />
                      </a>

                      <p className="mt-2 text-xs text-gray-500">{filename}</p>
                    </div>
                  );
                }

                return (
                  <a
                    key={message.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block max-w-[85%] rounded-2xl border bg-white p-3 text-sm text-gray-800 transition hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-xs font-semibold text-white">
                        {getFileBadge(extension)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">{filename}</p>
                        <p className="mt-1 text-xs text-gray-500">Click to open</p>
                      </div>
                    </div>
                  </a>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "ml-auto bg-gray-900 text-white"
                      : "border bg-white text-gray-800"
                  }`}
                >
                  {message.content}
                </div>
              );
            })}

            <ChatSchedulingPicker
              schedulingState={schedulingState}
              isSending={isSending}
              onSelectOption={handleSchedulingOptionSelect}
            />

            {isSending ? (
              <div className="max-w-[85%] rounded-2xl border bg-white px-4 py-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                </span>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div ref={composerRef} className="relative mt-4">
          {isAttachMenuOpen ? (
            <div className="absolute bottom-full left-0 z-20 mb-2 w-44 rounded-xl border bg-white p-2 shadow-lg">
              <button
                type="button"
                onClick={() => photoLibraryInputRef.current?.click()}
                className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                Upload Photo
              </button>

              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                Take Photo
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex w-full items-center rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                Upload File
              </button>
            </div>
          ) : null}

            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={handleAttachmentButtonClick}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-white text-gray-700 transition hover:bg-gray-50"
                aria-label="Upload"
                title="Upload"
              >
                <Plus className="h-5 w-5" />
              </button>

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();

                    if (!isSending && input.trim()) {
                      void handleSendMessage();
                    }
                  }
                }}
                placeholder="Type your message..."
                rows={1}
                className="h-12 min-h-[48px] max-h-28 flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition focus:border-gray-400"
              />

              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={isSending || !input.trim()}
                className="h-12 shrink-0 rounded-2xl bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>

            <input
              ref={photoLibraryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleUploadImage(file);
                }
                e.currentTarget.value = "";
              }}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.zip,.heic,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleUploadImage(file);
                }
                e.currentTarget.value = "";
              }}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleUploadImage(file);
                }
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}