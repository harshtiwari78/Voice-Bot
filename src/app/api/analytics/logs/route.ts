import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { botService } from '@/lib/services/botService';

// GET /api/analytics/logs - Call logs and transcripts
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
    const callId = searchParams.get('callId');
    const assistantId = searchParams.get('assistantId');
    const timeRange = searchParams.get('timeRange') || '7d';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // ended, failed, etc.

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

    try {
      const now = new Date();

      // If specific call ID is requested, fetch that call's details
      if (callId) {
        const callResponse = await fetch(`https://api.vapi.ai/call/${callId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${VAPI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!callResponse.ok) {
          throw new Error(`Failed to fetch call ${callId}: ${callResponse.status}`);
        }

        const callData = await callResponse.json();

        // SECURITY CHECK: Verify user owns this call's assistant
        if (userAssistantIds.length === 0 || !userAssistantIds.includes(callData.assistantId)) {
          return NextResponse.json(
            { success: false, error: 'Call not found or access denied' },
            { status: 404 }
          );
        }

        // Fetch transcript and recording if available
        let transcript = null;
        let recording = null;

        if (callData.transcript) {
          try {
            const transcriptResponse = await fetch(callData.transcript, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`
              }
            });
            
            if (transcriptResponse.ok) {
              transcript = await transcriptResponse.json();
            }
          } catch (transcriptError) {
            console.warn('Failed to fetch transcript:', transcriptError);
          }
        }

        // Fetch recording if available
        if (callData.recordingUrl) {
          try {
            const recordingResponse = await fetch(callData.recordingUrl, {
              method: 'HEAD', // Use HEAD to get metadata without downloading
              headers: {
                'Authorization': `Bearer ${VAPI_API_KEY}`
              }
            });

            if (recordingResponse.ok) {
              recording = {
                url: callData.recordingUrl,
                available: true,
                size: recordingResponse.headers.get('content-length'),
                type: recordingResponse.headers.get('content-type') || 'audio/mpeg'
              };
            }
          } catch (recordingError) {
            console.warn('Failed to fetch recording metadata:', recordingError);
            recording = {
              url: callData.recordingUrl,
              available: false,
              error: 'Failed to access recording'
            };
          }
        }

        return NextResponse.json({
          success: true,
          call: {
            id: callData.id,
            assistantId: callData.assistantId,
            status: callData.status,
            createdAt: callData.createdAt,
            startedAt: callData.startedAt,
            endedAt: callData.endedAt,
            duration: callData.endedAt && callData.startedAt 
              ? (new Date(callData.endedAt).getTime() - new Date(callData.startedAt).getTime()) / 1000
              : null,
            phoneNumber: callData.phoneNumber || callData.customer?.number,
            type: callData.type,
            cost: callData.cost,
            transcript: transcript,
            recording: recording,
            messages: callData.messages || [],
            analysis: callData.analysis || null
          },
          metadata: {
            generatedAt: new Date().toISOString(),
            dataSource: 'VAPI API'
          }
        });
      }

      // Fetch multiple calls with filters using VAPI API
      const vapiUrl = new URL('https://api.vapi.ai/call');

      // Add query parameters based on VAPI API documentation
      vapiUrl.searchParams.set('limit', Math.min(limit, 1000).toString()); // VAPI max limit is 1000

      if (assistantId) {
        vapiUrl.searchParams.set('assistantId', assistantId);
      }

      // Note: Date filtering will be done client-side for now
      // VAPI API date parameters need to be verified

      console.log(`🔍 Fetching call logs from VAPI API: ${vapiUrl.toString()}`);

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
      console.log(`✅ Retrieved ${Array.isArray(vapiData) ? vapiData.length : 0} call logs from VAPI`);

      // VAPI returns an array of calls directly
      const calls = Array.isArray(vapiData) ? vapiData : [];

      // Filter by time range (client-side filtering)
      let startDate = new Date(0);
      
      if (timeRange !== 'all') {
        const days = parseInt(timeRange.replace('d', ''));
        startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      }

      const filteredCalls = calls.filter((call: any) => {
        // Date filtering
        if (!call.createdAt) return false;
        const callDate = new Date(call.createdAt);
        if (callDate < startDate) return false;

        // Status filtering if specified
        if (status && call.status !== status) {
          return false;
        }

        // If we should filter by assistant and user has assistants, filter by them
        if (shouldFilterByAssistant && !userAssistantIds.includes(call.assistantId)) {
          return false;
        }

        return true;
      });

      // Process calls for display using VAPI data structure
      const processedCalls = filteredCalls.map((call: any) => ({
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
        cost: call.cost || 0,
        hasTranscript: !!(call.artifact?.transcript || call.transcript),
        transcript: call.artifact?.transcript || call.transcript || null,
        hasRecording: !!call.recordingUrl,
        recordingUrl: call.recordingUrl || null,
        messageCount: call.messages ? call.messages.length : 0,
        summary: call.analysis?.summary || null
      }));

      // Calculate summary statistics
      const totalCalls = processedCalls.length;
      const callsWithTranscripts = processedCalls.filter(call => call.hasTranscript).length;
      const callsWithRecordings = processedCalls.filter(call => call.hasRecording).length;
      const totalMessages = processedCalls.reduce((sum, call) => sum + call.messageCount, 0);
      const totalCost = processedCalls.reduce((sum, call) => sum + (call.cost || 0), 0);

      // Group by status
      const statusDistribution = {};
      processedCalls.forEach(call => {
        const status = call.status || 'unknown';
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      });

      // Group by assistant
      const assistantDistribution = {};
      processedCalls.forEach(call => {
        if (call.assistantId) {
          const id = call.assistantId;
          if (!assistantDistribution[id]) {
            assistantDistribution[id] = {
              assistantId: id,
              callCount: 0,
              totalDuration: 0,
              totalCost: 0
            };
          }
          assistantDistribution[id].callCount++;
          assistantDistribution[id].totalDuration += call.duration || 0;
          assistantDistribution[id].totalCost += call.cost || 0;
        }
      });

      return NextResponse.json({
        success: true,
        timeRange,
        assistantId,
        status,
        pagination: {
          page,
          limit,
          total: totalCalls,
          hasMore: calls.length === limit
        },
        logs: processedCalls,
        summary: {
          totalCalls,
          callsWithTranscripts,
          callsWithRecordings,
          totalMessages,
          totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimal places
          avgDuration: totalCalls > 0
            ? Math.round(processedCalls.reduce((sum, call) => sum + (call.duration || 0), 0) / totalCalls)
            : 0
        },
        distributions: {
          status: Object.entries(statusDistribution).map(([status, count]) => ({
            status,
            count
          })),
          assistant: Object.values(assistantDistribution)
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          dataSource: 'VAPI API',
          apiCallMade: true
        }
      });

    } catch (vapiError) {
      console.error('❌ VAPI API error:', vapiError);

      // Return empty data if VAPI API fails
      return NextResponse.json({
        success: true,
        timeRange,
        assistantId,
        status,
        pagination: {
          page: parseInt(page.toString()),
          limit: parseInt(limit.toString()),
          total: 0,
          hasMore: false
        },
        logs: [],
        summary: {
          totalCalls: 0,
          callsWithTranscripts: 0,
          callsWithRecordings: 0,
          totalMessages: 0,
          totalCost: 0,
          avgDuration: 0
        },
        distributions: {
          status: [],
          assistant: []
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
    console.error('❌ Analytics logs error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve call logs' 
      },
      { status: 500 }
    );
  }
}
