import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Temporary in-memory storage (replace with database in production)
const botRegistry = new Map();

// Admin activation endpoint
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { botUuid, action } = await request.json();

    if (!botUuid) {
      return NextResponse.json(
        { success: false, error: 'Bot UUID is required' },
        { status: 400 }
      );
    }

    // Get bot from registry
    const bot = botRegistry.get(botUuid);
    if (!bot) {
      return NextResponse.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Check if user owns the bot
    if (bot.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - not bot owner' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'activate':
        if (bot.status === 'pending') {
          bot.status = 'activating';
          botRegistry.set(botUuid, bot);
          
          // Simulate VAPI assistant creation process
          setTimeout(async () => {
            try {
              // In a real implementation, this would create the VAPI assistant
              bot.status = 'active';
              bot.vapiAssistantId = `vapi_assistant_${botUuid.substring(0, 8)}`;
              bot.activatedAt = new Date().toISOString();
              botRegistry.set(botUuid, bot);
              
              console.log(`✅ Bot ${botUuid} activated successfully`);
            } catch (error) {
              console.error(`❌ Failed to activate bot ${botUuid}:`, error);
              bot.status = 'failed';
              botRegistry.set(botUuid, bot);
            }
          }, 3000); // 3 second delay to simulate processing
          
          return NextResponse.json({
            success: true,
            message: 'Bot activation started',
            status: 'activating'
          });
        } else {
          return NextResponse.json(
            { success: false, error: `Bot is already ${bot.status}` },
            { status: 400 }
          );
        }

      case 'deactivate':
        if (bot.status === 'active') {
          bot.status = 'pending';
          bot.vapiAssistantId = undefined;
          botRegistry.set(botUuid, bot);
          
          return NextResponse.json({
            success: true,
            message: 'Bot deactivated',
            status: 'pending'
          });
        } else {
          return NextResponse.json(
            { success: false, error: 'Bot is not active' },
            { status: 400 }
          );
        }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "activate" or "deactivate"' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Bot activation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process activation' 
      },
      { status: 500 }
    );
  }
}

// Get all bots for admin (for manual activation management)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all bots for this user
    const userBots = Array.from(botRegistry.entries())
      .filter(([, bot]) => bot.userId === userId)
      .map(([uuid, bot]) => ({
        uuid,
        name: bot.name,
        status: bot.status,
        createdAt: bot.createdAt,
        activationScheduledAt: bot.activationScheduledAt,
        activatedAt: bot.activatedAt,
        documentsProcessed: bot.documentsProcessed,
        ragEnabled: bot.ragEnabled
      }));

    return NextResponse.json({
      success: true,
      bots: userBots,
      totalBots: userBots.length
    });

  } catch (error) {
    console.error('❌ Get bots error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to get bots' 
      },
      { status: 500 }
    );
  }
}
