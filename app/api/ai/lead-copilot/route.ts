import { NextRequest, NextResponse } from "next/server";
import { runLeadCopilot } from "@/lib/ai/runLeadCopilot";
import type { Lead } from "@/lib/types/lead";

/**
 * Lead Copilot API wrapper.
 *
 * The reusable generation and persistence logic lives in:
 * lib/ai/runLeadCopilot.ts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const lead = body?.lead as Lead | undefined;
    const forceRegenerate = body?.forceRegenerate === true;

    if (!lead || typeof lead !== "object") {
      return NextResponse.json(
        { error: "lead is required" },
        { status: 400 }
      );
    }

    if (!lead.id || typeof lead.id !== "string") {
      return NextResponse.json(
        { error: "lead.id is required" },
        { status: 400 }
      );
    }

    const result = await runLeadCopilot(
      lead,
      forceRegenerate
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST /api/ai/lead-copilot error:", error);

    return NextResponse.json(
      { error: "Failed to generate Lead Copilot data" },
      { status: 500 }
    );
  }
}