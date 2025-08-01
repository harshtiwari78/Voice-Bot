import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { botService } from '@/lib/services/botService';

// VAPI Call Analytics API
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
    const assistantId = searchParams.get('assistantId'); // Filter by specific bot
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get user's bots from database to filter VAPI calls by user-owned assistants
    const userBots = await botService.getBotsByUserId(userId);
    const userAssistantIds = userBots
      .map(bot => bot.vapiAssistantId)
      .filter(id => id); // Remove null/undefined values

    console.log(`🔍 Found ${userBots.length} bots for user ${userId}`);
    console.log(`🎯 User assistant IDs: ${userAssistantIds.join(', ')}`);

    // If user has no bots with VAPI assistants, show all calls from VAPI for now
    // This allows users to see calls even if bot creation didn't complete properly
    const shouldFilterByAssistant = userAssistantIds.length > 0;

    const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;
    if (!VAPI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'VAPI API key not configured' },
        { status: 500 }
      );
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0);
    
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }

    try {
      // Fetch calls from VAPI API using GET /call endpoint
      const vapiUrl = new URL('https://api.vapi.ai/call');

      // Add query parameters
      vapiUrl.searchParams.set('limit', Math.min(limit, 1000).toString()); // VAPI max limit is 1000

      if (assistantId) {
        vapiUrl.searchParams.set('assistantId', assistantId);
      }

      console.log(`🔍 Fetching calls from VAPI API: ${vapiUrl.toString()}`);

      const response = await fetch(vapiUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${VAPI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ VAPI API error: ${response.status} - ${errorText}`);
        throw new Error(`VAPI API error: ${response.status} - ${errorText}`);
      }

      const vapiData = await response.json();
      console.log(`✅ Retrieved ${Array.isArray(vapiData) ? vapiData.length : 0} calls from VAPI`);

      // VAPI returns an array of calls directly
      const calls = Array.isArray(vapiData) ? vapiData : [];

      // Process calls - Filter by user's assistants and date range
      const filteredCalls = calls.filter((call: any) => {
        // Date filtering
        if (!call.createdAt) return false;
        const callDate = new Date(call.createdAt);
        if (callDate < startDate) return false;

        // If we should filter by assistant and user has assistants, filter by them
        if (shouldFilterByAssistant && !userAssistantIds.includes(call.assistantId)) {
          return false;
        }

        return true;
      });

      console.log(`📊 Processing ${filteredCalls.length} calls for analytics`);

      // Calculate analytics based on VAPI call statuses
      const totalCalls = filteredCalls.length;

      // VAPI call statuses: 'queued', 'ringing', 'in-progress', 'forwarding', 'ended'
      const successfulCalls = filteredCalls.filter((call: any) =>
        call.status === 'ended' && call.endedReason !== 'assistant-error'
      ).length;

      const failedCalls = filteredCalls.filter((call: any) =>
        call.status === 'ended' && call.endedReason === 'assistant-error' ||
        call.status === 'failed'
      ).length;

      // Calculate duration statistics using VAPI call data
      const callsWithDuration = filteredCalls.filter((call: any) =>
        call.endedAt && call.startedAt
      );

      const durations = callsWithDuration.map((call: any) => {
        const start = new Date(call.startedAt).getTime();
        const end = new Date(call.endedAt).getTime();
        return Math.max(0, (end - start) / 1000); // Duration in seconds, ensure positive
      });

      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
        : 0;
      const minDuration = durations.length > 0 ? Math.round(Math.min(...durations)) : 0;
      const maxDuration = durations.length > 0 ? Math.round(Math.max(...durations)) : 0;



      // Call volume trends (group by day)
      const volumeTrends = {};
      filteredCalls.forEach((call: any) => {
        if (call.createdAt) {
          const date = new Date(call.createdAt).toISOString().split('T')[0];
          volumeTrends[date] = (volumeTrends[date] || 0) + 1;
        }
      });

      // Calls per assistant/bot using VAPI data structure
      const callsByAssistant = {};
      filteredCalls.forEach((call: any) => {
        if (call.assistantId) {
          const id = call.assistantId;
          if (!callsByAssistant[id]) {
            callsByAssistant[id] = {
              assistantId: id,
              totalCalls: 0,
              successfulCalls: 0,
              failedCalls: 0,
              avgDuration: 0,
              totalDuration: 0
            };
          }
          callsByAssistant[id].totalCalls++;

          // Calculate duration for this call
          if (call.endedAt && call.startedAt) {
            const duration = Math.max(0, (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000);
            callsByAssistant[id].totalDuration += duration;
          }

          // Categorize based on VAPI call status
          if (call.status === 'ended' && call.endedReason !== 'assistant-error') {
            callsByAssistant[id].successfulCalls++;
          } else if (call.status === 'ended' && call.endedReason === 'assistant-error' || call.status === 'failed') {
            callsByAssistant[id].failedCalls++;
          }
        }
      });

      // Calculate average duration per assistant
      Object.values(callsByAssistant).forEach((assistant: any) => {
        if (assistant.totalCalls > 0) {
          assistant.avgDuration = Math.round(assistant.totalDuration / assistant.totalCalls);
        }
      });

      // Recent calls for display
      const recentCalls = filteredCalls
        .sort((a: any, b: any) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 10)
        .map((call: any) => ({
          id: call.id,
          assistantId: call.assistantId,
          status: call.status,
          endedReason: call.endedReason,
          createdAt: call.createdAt,
          startedAt: call.startedAt,
          endedAt: call.endedAt,
          duration: call.endedAt && call.startedAt
            ? Math.max(0, (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
            : null,
          phoneNumber: call.customer?.number || call.phoneNumber?.number || null,
          type: call.type || 'unknown',
          cost: call.cost || 0
        }));

      return NextResponse.json({
        success: true,
        timeRange,
        assistantId,
        pagination: {
          page,
          limit,
          total: totalCalls
        },
        analytics: {
          overview: {
            totalCalls,
            successfulCalls,
            failedCalls,
            successRate: totalCalls > 0 ? (successfulCalls / totalCalls * 100).toFixed(2) : 0
          },
          duration: {
            average: Math.round(avgDuration),
            minimum: Math.round(minDuration),
            maximum: Math.round(maxDuration),
            totalMinutes: Math.round(durations.reduce((sum, d) => sum + d, 0) / 60)
          },
          trends: {
            volumeTrends: Object.entries(volumeTrends).map(([date, count]) => ({
              date,
              count
            })).sort((a, b) => a.date.localeCompare(b.date))
          },
          byAssistant: Object.values(callsByAssistant),
          recentCalls
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: 'VAPI API',
          apiCallMade: true
        }
      });

    } catch (vapiError) {
      console.error('❌ VAPI API error:', vapiError);
      
      // Return mock data if VAPI API fails
      return NextResponse.json({
        success: true,
        timeRange,
        assistantId,
        analytics: {
          overview: {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            successRate: 0
          },
          duration: {
            average: 0,
            minimum: 0,
            maximum: 0,
            totalMinutes: 0
          },
          trends: {
            volumeTrends: []
          },
          byAssistant: [],
          recentCalls: []
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: 'Mock Data',
          apiCallMade: false,
          error: 'VAPI API unavailable'
        }
      });
    }

  } catch (error) {
    console.error('❌ Analytics calls error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve call analytics' 
      },
      { status: 500 }
    );
  }
}
