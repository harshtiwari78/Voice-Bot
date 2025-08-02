import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { botService } from '@/lib/services/botService';

// Handle POST request for bot activation/deactivation
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

    // Parse request body
    const body = await request.json();
    const { botUuid, action } = body;

    if (!botUuid) {
      return NextResponse.json(
        { success: false, error: 'Bot UUID is required' },
        { status: 400 }
      );
    }

    // Get bot from database
    const bot = await botService.getBotByUuid(botUuid);

    if (!bot) {
      return NextResponse.json(
        { success: false, error: 'Bot not found' },
        { status: 404 }
      );
    }

    // Check if user owns the bot
    if (bot.userId !== userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to manage this bot' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'activate':
        if (bot.status !== 'active') {
          // Update bot status to activating
          await botService.updateBotStatus(botUuid, 'activating');
          
          // Simulate VAPI assistant creation process
          setTimeout(async () => {
            try {
              // In a real implementation, this would create the VAPI assistant
              // Keep the existing vapiAssistantId if it exists
              await botService.updateBot(botUuid, {
                status: 'active',
                activatedAt: new Date().toISOString(),
              });
              
              console.log(`✅ Bot ${botUuid} activated successfully`);
            } catch (error) {
              console.error(`❌ Failed to activate bot ${botUuid}:`, error);
              await botService.updateBotStatus(botUuid, 'failed');
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
          await botService.updateBot(botUuid, {
            status: 'pending',
            vapiAssistantId: undefined
          });
          
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

    // Get all bots for this user from database
    const userBots = await botService.getBotsByUserId(userId);

    // Format the response to match the expected format in the AdminPanel component
    const formattedBots = userBots.map(bot => ({
      uuid: bot.uuid,
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
      bots: formattedBots,
      totalBots: formattedBots.length
    });

  } catch (error) {
    console.error('❌ Get bots error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve bots' 
      },
      { status: 500 }
    );
  }
}
