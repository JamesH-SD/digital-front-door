import { NextRequest, NextResponse } from "next/server";
import { generateSuggestedReply } from "@/lib/ai/generateSuggestedReply";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const lead = body?.lead;

    if (!lead || typeof lead !== "object") {
      return NextResponse.json(
        { error: "lead is required" },
        { status: 400 }
      );
    }

    const result = await generateSuggestedReply(lead);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST /api/ai/suggested-reply error:", error);

    return NextResponse.json(
      { error: "Failed to generate suggested reply" },
      { status: 500 }
    );
  }
}