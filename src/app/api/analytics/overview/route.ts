import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUploadsInfo, getUserUploadsInfo } from '@/lib/localFileStorage';
import { botService } from '@/lib/services/botService';
import { sessionService } from '@/lib/services/sessionService';
import { callService } from '@/lib/services/callService';

// Database storage using Prisma services

// GET /api/analytics/overview - Comprehensive analytics overview
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate time range
    const now = new Date();
    let startDate = new Date(0);
    
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }

    // Get bot data from database
    const userBots = await botService.getBotsByUserId(userId);

    // Get user's assistant IDs for filtering VAPI data
    const userAssistantIds = userBots
      .map(bot => bot.vapiAssistantId)
      .filter(id => id); // Remove null/undefined values

    // Filter by time range
    const botsInRange = userBots.filter(bot => {
      const createdAt = new Date(bot.createdAt);
      return createdAt >= startDate;
    });

    // Get session data from database
    const sessionsInRange = await sessionService.getSessionsInRange(startDate, undefined, undefined);

    // Fetch real VAPI data
    const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
    let vapiCalls = [];
    let vapiAssistants = [];

    if (VAPI_API_KEY) {
      try {
        // Fetch calls from VAPI
        const callsUrl = new URL('https://api.vapi.ai/call');
        callsUrl.searchParams.set('limit', '1000');
        // Note: Date filtering will be done client-side for now

        const callsResponse = await fetch(callsUrl.toString(), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (callsResponse.ok) {
          const callsData = await callsResponse.json();
          const allVapiCalls = Array.isArray(callsData) ? callsData : [];

          // SECURITY FIX: Filter calls by user-owned assistants only
          vapiCalls = allVapiCalls.filter((call: any) => {
            // If user has no assistants, return empty array (no calls should be shown)
            if (userAssistantIds.length === 0) return false;
            return userAssistantIds.includes(call.assistantId);
          });

          console.log(`✅ Retrieved ${allVapiCalls.length} total calls, ${vapiCalls.length} user calls from VAPI for overview`);
        }

        // Fetch assistants from VAPI
        const assistantsResponse = await fetch('https://api.vapi.ai/assistant', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (assistantsResponse.ok) {
          const assistantsData = await assistantsResponse.json();
          const allVapiAssistants = Array.isArray(assistantsData) ? assistantsData : [];

          // SECURITY FIX: Filter assistants by user-owned assistants only
          vapiAssistants = allVapiAssistants.filter((assistant: any) => {
            // If user has no assistants, return empty array (no assistants should be shown)
            if (userAssistantIds.length === 0) return false;
            return userAssistantIds.includes(assistant.id);
          });

          console.log(`✅ Retrieved ${allVapiAssistants.length} total assistants, ${vapiAssistants.length} user assistants from VAPI for overview`);
        }
      } catch (vapiError) {
        console.warn('⚠️ VAPI API unavailable for overview, using local data only:', vapiError);
      }
    }

    // Bot Analytics
    const totalBots = botsInRange.length;
    const activeBots = botsInRange.filter(bot => bot.status === 'active').length;
    const ragEnabledBots = botsInRange.filter(bot => bot.ragEnabled).length;

    // Session Analytics
    const totalSessions = sessionsInRange.length;
    const activeSessions = sessionsInRange.filter(session => !session.endTime).length;

    // File Storage Analytics - SECURITY FIX: Only count files from user's bots
    let fileStorageInfo = {
      totalBots: 0,
      totalFiles: 0,
      totalSize: 0,
      botsWithFiles: []
    };

    try {
      // Get UUIDs of user's bots for file filtering
      const userBotUuids = userBots.map(bot => bot.uuid);
      fileStorageInfo = await getUserUploadsInfo(userBotUuids);
      console.log(`📊 User ${userId} file storage: ${fileStorageInfo.totalFiles} files, ${fileStorageInfo.totalSize} bytes`);
    } catch (error) {
      console.warn('Failed to get user file storage info:', error);
    }

    // VAPI Call Analytics using already fetched data
    let vapiCallsToday = 0;
    let vapiCallsThisWeek = 0;
    let vapiCallsThisMonth = 0;
    let vapiSuccessfulCalls = 0;
    let vapiFailedCalls = 0;

    if (vapiCalls.length > 0) {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      vapiCalls.forEach((call: any) => {
        if (call.createdAt) {
          const callDate = new Date(call.createdAt);
          if (callDate.toDateString() === today.toDateString()) {
            vapiCallsToday++;
          }
          if (callDate >= weekAgo) {
            vapiCallsThisWeek++;
          }
          if (callDate >= monthAgo) {
            vapiCallsThisMonth++;
          }

          // Count successful vs failed calls
          if (call.status === 'ended' && call.endedReason !== 'assistant-error') {
            vapiSuccessfulCalls++;
          } else if (call.status === 'ended' && call.endedReason === 'assistant-error' || call.status === 'failed') {
            vapiFailedCalls++;
          }
        }
      });
    }

    // Growth calculations (compare with previous period)
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    
    const previousBots = userBots.filter(bot => {
      const createdAt = new Date(bot.createdAt);
      return createdAt >= previousPeriodStart && createdAt < startDate;
    }).length;

    const previousSessions = sessionsInRange.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= previousPeriodStart && sessionDate < startDate;
    }).length;

    const botGrowth = previousBots > 0 
      ? ((totalBots - previousBots) / previousBots * 100).toFixed(1)
      : totalBots > 0 ? '100.0' : '0.0';

    const sessionGrowth = previousSessions > 0 
      ? ((totalSessions - previousSessions) / previousSessions * 100).toFixed(1)
      : totalSessions > 0 ? '100.0' : '0.0';

    // Recent activity
    const recentBots = botsInRange
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(bot => ({
        uuid: bot.uuid,
        name: bot.name,
        status: bot.status,
        createdAt: bot.createdAt,
        ragEnabled: bot.ragEnabled
      }));

    const recentSessions = sessionsInRange
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5)
      .map(session => ({
        id: session.id,
        botUuid: session.botUuid,
        startTime: session.startTime,
        status: session.endTime ? 'completed' : 'active'
      }));

    // System health indicators
    const systemHealth = {
      botsOnline: activeBots,
      activeSessions: activeSessions,
      apiStatus: VAPI_API_KEY ? 'connected' : 'not_configured',
      fileStorageStatus: fileStorageInfo.totalFiles > 0 ? 'active' : 'empty',
      lastUpdated: new Date().toISOString()
    };

    // Quick stats for dashboard cards with real VAPI data
    const totalVapiCalls = vapiCalls.length;
    const vapiSuccessRate = totalVapiCalls > 0 ? ((vapiSuccessfulCalls / totalVapiCalls) * 100).toFixed(1) : '0.0';

    const quickStats = [
      {
        title: 'Total Bots',
        value: totalBots,
        change: `${botGrowth}%`,
        trend: parseFloat(botGrowth) >= 0 ? 'up' : 'down',
        icon: '🤖'
      },
      {
        title: 'VAPI Calls',
        value: totalVapiCalls,
        change: `${vapiSuccessRate}% success`,
        trend: parseFloat(vapiSuccessRate) >= 80 ? 'up' : parseFloat(vapiSuccessRate) >= 60 ? 'neutral' : 'down',
        icon: '📞'
      },
      {
        title: 'Active Sessions',
        value: activeSessions,
        change: `${sessionGrowth}%`,
        trend: parseFloat(sessionGrowth) >= 0 ? 'up' : 'down',
        icon: '👥'
      },
      {
        title: 'Files Stored',
        value: fileStorageInfo.totalFiles,
        change: `${(fileStorageInfo.totalSize / 1024 / 1024).toFixed(1)}MB`,
        trend: 'neutral',
        icon: '📁'
      }
    ];

    return NextResponse.json({
      success: true,
      timeRange,
      overview: {
        quickStats,
        systemHealth,
        growth: {
          bots: {
            current: totalBots,
            previous: previousBots,
            growth: botGrowth
          },
          sessions: {
            current: totalSessions,
            previous: previousSessions,
            growth: sessionGrowth
          }
        },
        breakdown: {
          bots: {
            total: totalBots,
            active: activeBots,
            inactive: totalBots - activeBots,
            ragEnabled: ragEnabledBots,
            ragDisabled: totalBots - ragEnabledBots
          },
          sessions: {
            total: totalSessions,
            active: activeSessions,
            completed: totalSessions - activeSessions
          },
          vapi: {
            callsToday: vapiCallsToday,
            callsThisWeek: vapiCallsThisWeek,
            callsThisMonth: vapiCallsThisMonth
          },
          storage: {
            totalFiles: fileStorageInfo.totalFiles,
            totalSizeMB: Math.round(fileStorageInfo.totalSize / 1024 / 1024 * 100) / 100,
            botsWithFiles: fileStorageInfo.botsWithFiles.length
          }
        },
        recentActivity: {
          bots: recentBots,
          sessions: recentSessions
        }
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        userId,
        timeRange,
        dataSource: 'Multiple Sources'
      }
    });

  } catch (error) {
    console.error('❌ Analytics overview error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve analytics overview' 
      },
      { status: 500 }
    );
  }
}
