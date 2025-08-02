import { NextRequest, NextResponse } from 'next/server';
import { botService } from '@/lib/services/botService';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  const response = NextResponse.json({}, { status: 200 });
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Database storage using Prisma services

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;

    if (!uuid) {
      const response = NextResponse.json(
        { success: false, error: 'Bot UUID is required' },
        { status: 400 }
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Get bot from database
    const bot = await botService.getBotByUuid(uuid);

    console.log(`🔍 Looking for bot ${uuid}, found:`, bot ? 'YES' : 'NO');

    if (!bot) {
      const response = NextResponse.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Return the actual VAPI assistant ID
    const response = NextResponse.json({
      success: true,
      status: bot.status,
      uuid: bot.uuid,
      name: bot.name,
      activationScheduledAt: bot.activationScheduledAt,
      vapiAssistantId: bot.vapiAssistantId || 'fallback-assistant-id',
      activatedAt: bot.activatedAt
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('❌ Bot status check error:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check bot status'
      },
      { status: 500 }
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}