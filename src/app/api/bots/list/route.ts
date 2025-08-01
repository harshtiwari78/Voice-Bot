import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { botService } from '@/lib/services/botService';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    // Get bots from database
    const bots = userId
      ? await botService.getBotsByUserId(userId)
      : await botService.getAllBots();

    // Convert to expected format with complete bot data
    const formattedBots = bots.map(bot => ({
      uuid: bot.uuid,
      name: bot.name,
      status: bot.status,
      vapiAssistantId: bot.vapiAssistantId,
      createdAt: bot.createdAt,
      updatedAt: bot.createdAt, // Using createdAt as updatedAt for compatibility
      documentsProcessed: bot.documentsProcessed,
      ragEnabled: bot.ragEnabled,
      embedCode: bot.embedCode,
      activationScheduledAt: bot.activationScheduledAt,
      welcomeMessage: bot.welcomeMessage,
      systemPrompt: bot.systemPrompt,
      language: bot.language,
      voice: bot.voice,
      position: bot.position,
      theme: bot.theme,
      ragSourceType: bot.ragSourceType,
      ragUrl: bot.ragUrl,
      localFilesStored: bot.localFilesStored,
      activatedAt: bot.activatedAt
    }));

    console.log(`📊 Found ${formattedBots.length} bots in database`);

    const response = NextResponse.json({
      success: true,
      count: formattedBots.length,
      bots: formattedBots
    });

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('❌ Bot list error:', error);
    const response = NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list bots'
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
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
