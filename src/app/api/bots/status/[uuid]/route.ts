import { NextRequest, NextResponse } from 'next/server';
import { botService } from '@/lib/services/botService';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

    // Check if bot should be activated (24 hours have passed)
    const now = new Date();
    const activationTime = new Date(bot.activationScheduledAt);
    const shouldBeActive = now >= activationTime;

    // Update status if needed
    let updatedBot = bot;
    if (shouldBeActive && bot.status === 'pending') {
      const statusUpdate = await botService.updateBotStatus(uuid, 'activating');
      if (statusUpdate) {
        updatedBot = statusUpdate;
      }

      // In a real implementation, trigger VAPI assistant creation here
      console.log(`🔄 Bot ${uuid} should be activated now`);

      // Simulate activation process
      setTimeout(async () => {
        const finalBot = await botService.updateBot(uuid, {
          ...updatedBot,
          status: 'active',
          vapiAssistantId: `vapi_assistant_${uuid.substring(0, 8)}`,
        });
        console.log(`✅ Bot ${uuid} activated successfully`);
      }, 5000);
    }

    const response = NextResponse.json({
      success: true,
      status: updatedBot.status,
      uuid: updatedBot.uuid,
      name: updatedBot.name,
      activationScheduledAt: updatedBot.activationScheduledAt,
      vapiAssistantId: updatedBot.vapiAssistantId,
      activatedAt: updatedBot.activatedAt
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

// Handle OPTIONS request for CORS preflight
// Handle PATCH request to update bot assistant ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const { vapiAssistantId } = await request.json();

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

    if (!vapiAssistantId) {
      const response = NextResponse.json(
        { success: false, error: 'VAPI Assistant ID is required' },
        { status: 400 }
      );
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // Get bot from registry
    const bot = botRegistry.get(uuid);

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

    // Update the bot's VAPI assistant ID
    bot.vapiAssistantId = vapiAssistantId;
    bot.updatedAt = new Date().toISOString();
    botRegistry.set(uuid, bot);

    console.log(`✅ Updated bot ${uuid} with new VAPI assistant ID: ${vapiAssistantId}`);

    const response = NextResponse.json({
      success: true,
      message: 'Bot assistant ID updated successfully',
      uuid: bot.uuid,
      vapiAssistantId: bot.vapiAssistantId
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('❌ Bot update error:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update bot'
      },
      { status: 500 }
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
