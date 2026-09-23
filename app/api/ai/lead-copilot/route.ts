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

    const leadIdFromBody =
      typeof body?.leadId === "string" ? body.leadId.trim() : "";

    const lead = body?.lead as Lead | undefined;
    const leadId = leadIdFromBody || lead?.id;
    const forceRegenerate = body?.forceRegenerate === true;

    if (!leadId) {
      return NextResponse.json(
        { error: "leadId or lead.id is required" },
        { status: 400 }
      );
    }

    const result = await runLeadCopilot(leadId, forceRegenerate);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("POST /api/ai/lead-copilot error:", error);

    return NextResponse.json(
      { error: "Failed to generate Lead Copilot data" },
      { status: 500 }
    );
  }
}
