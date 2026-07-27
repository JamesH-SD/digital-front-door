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
  autoOpen?: boolean;
  leadSource?: string;
  campaignId?: string;
  variant?: "page" | "embed";
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

export function ChatWidget({
  tenant,
  autoOpen = true,
  leadSource = "website",
  campaignId,
  variant = "page",
}: Props) {
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
  const schedulingPickerRef = useRef<HTMLDivElement | null>(null);

  const [schedulingState, setSchedulingState] = useState<SchedulingState | null>(null);

  const visibleMessages = useMemo(() => {
    const serverVisible = messages.filter((message) => message.role !== "system");
    const combined = [...serverVisible, ...localMessages];

    return combined.sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [messages, localMessages]);

  const websiteSettings = tenant.websiteSettings || {};
  const brandColor = websiteSettings.primaryColor || tenant.primaryColor || "#111827";
  const accentColor = websiteSettings.accentColor || "#c55a11";
  const tenantLogoUrl = websiteSettings.logoUrl;

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
          leadSource,
          campaignId,
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
    if (!autoOpen) return;
    if (hasStartedRef.current) return;
  
    hasStartedRef.current = true;
    void handleStartChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen]);

  useEffect(() => {
    const container = scrollContainerRef.current;
  
    if (!container) return;
  
    requestAnimationFrame(() => {
      /**
       * If scheduling UI is active,
       * scroll the picker into view instead
       * of forcing the entire chat to bottom.
       */
      if (schedulingState?.active && schedulingPickerRef.current) {
        schedulingPickerRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
  
        return;
      }
  
      container.scrollTop = container.scrollHeight;
    });
  }, [
    visibleMessages,
    isSending,
    isUploading,
    schedulingState,
  ]);

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

  useEffect(() => {
    if (!schedulingState?.active) return;
  
    window.setTimeout(() => {
      schedulingPickerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }, [schedulingState]);

  const shellClassName =
  variant === "embed"
    ? "flex h-full min-h-0 flex-col overflow-hidden"
    : "flex h-[620px] flex-col overflow-hidden";

  return (
    <div className={`${shellClassName} saas-card`}>
      <div className="border-b border-stone-200 bg-white px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {tenantLogoUrl ? (
              <img
                src={tenantLogoUrl}
                alt={`${tenant.businessName} logo`}
                className="h-12 w-12 rounded-xl object-contain"
              />
            ) : (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {tenant.businessName.charAt(0)}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-gray-900">
                {tenant.businessName}
              </h2>
              <p className="text-sm font-medium" style={{ color: accentColor }}>
                AI Receptionist
              </p>
            </div>
          </div>
        </div>
      </div>
  
      {!sessionId ? (
        <div className="flex flex-1 items-center justify-center bg-gray-50 px-4 text-sm text-gray-600">
          {isStarting ? "Starting chat..." : "Preparing chat..."}
        </div>
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            className="flex-1 space-y-3 overflow-y-auto bg-stone-50/60 px-4 py-4"
          >
            {visibleMessages.map((message) => {
              if ("role" in message && message.role === "upload") {
                const attachment = message.attachment ?? message.image ?? null;
  
                if (!attachment) return null;
  
                const filename = attachment.filename || "Uploaded file";
                const extension = getAttachmentExtension(filename);
                const isImage = isImageAttachment(filename, attachment.url);
  
                if (isImage) {
                  return (
                    <div
                      key={message.id}
                      className="max-w-[88%] rounded-2xl border bg-white p-3 text-sm text-gray-800"
                    >
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-xl border bg-gray-100"
                      >
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
                    className="block max-w-[88%] rounded-2xl border bg-white p-3 text-sm text-gray-800 transition hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-xs font-semibold text-white">
                        {getFileBadge(extension)}
                      </div>
  
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {filename}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Click to open
                        </p>
                      </div>
                    </div>
                  </a>
                );
              }
  
              return (
                <div
                  key={message.id}
                  className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
                    message.role === "user"
                      ? "ml-auto text-white"
                      : "border border-stone-200 bg-white text-gray-800 shadow-sm"
                  }`}
                  style={
                    message.role === "user"
                      ? { backgroundColor: brandColor }
                      : undefined
                  }
                >
                  {message.content}
                </div>
              );
            })}
  
            <div ref={schedulingPickerRef}>
            <ChatSchedulingPicker
              schedulingState={schedulingState}
              isSending={isSending}
              onSelectOption={handleSendMessage}
            />
          </div>
  
            {isSending ? (
              <div className="max-w-[88%] rounded-2xl border bg-white px-4 py-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                </span>
              </div>
            ) : null}
          </div>
  
          {error ? (
            <div className="border-t border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
  
          <div ref={composerRef} className="relative border-t border-gray-200 bg-white p-3">
            {isAttachMenuOpen ? (
              <div className="absolute bottom-full left-3 z-20 mb-2 w-44 rounded-xl border bg-white p-2 shadow-lg">
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
  
              <div
                className="flex items-end gap-2 rounded-2xl border bg-white px-2 py-2"
                style={{ borderColor: accentColor }}
              >
              <button
                type="button"
                onClick={handleAttachmentButtonClick}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-700 transition hover:bg-gray-50"
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
                placeholder="How can we help today?"
                rows={1}
                className="max-h-28 min-h-[40px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
  
              <button
                type="button"
                onClick={() => void handleSendMessage()}
                disabled={isSending || !input.trim()}
                className="h-10 shrink-0 rounded-xl px-5 text-sm font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {isSending ? "..." : "Send"}
              </button>
            </div>
  
            <input
              ref={photoLibraryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadImage(file);
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
                if (file) void handleUploadImage(file);
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
                if (file) void handleUploadImage(file);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}