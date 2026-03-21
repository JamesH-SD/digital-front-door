import { NextRequest, NextResponse } from "next/server";
import { addUserMessage } from "@/lib/db/chat";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body?.sessionId;
    const content = body?.content;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return NextResponse.json(
        { error: "content cannot be empty" },
        { status: 400 }
      );
    }

    const result = await addUserMessage(sessionId, trimmedContent);

    if (!result) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error sending chat message:", error);

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}