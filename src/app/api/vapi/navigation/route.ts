import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url, command } = await request.json();
    
    console.log("🌐 Navigation request:", { url, command });
    
    // Validate URL
    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Log the navigation for analytics
    console.log(`Navigation command: "${command}" -> ${url}`);
    
    return NextResponse.json({
      success: true,
      message: "Navigation logged successfully",
      url,
      command
    });
    
  } catch (error) {
    console.error("❌ Navigation API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "VAPI Navigation API is running",
    endpoints: {
      POST: "/api/vapi/navigation - Log navigation commands"
    }
  });
}
