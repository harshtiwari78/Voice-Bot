import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = {
      vapiPublicKey: process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY,
      vapiAssistantId: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
      environment: process.env.NODE_ENV || "development"
    };

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error("❌ Config API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
