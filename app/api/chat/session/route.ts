import { NextRequest, NextResponse } from "next/server";
import { createChatSessionForTenantSlug } from "@/lib/db/chat";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenantSlug = body?.tenantSlug;

    if (!tenantSlug || typeof tenantSlug !== "string") {
      return NextResponse.json(
        { error: "tenantSlug is required" },
        { status: 400 }
      );
    }

    const result = await createChatSessionForTenantSlug(tenantSlug);

    if (!result) {
      return NextResponse.json(
        { error: "Tenant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating chat session:", error);

    return NextResponse.json(
      { error: "Failed to create chat session" },
      { status: 500 }
    );
  }
}