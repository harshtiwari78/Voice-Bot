import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sessionService } from '@/lib/services/sessionService';

// Database storage using Prisma services

// GET /api/analytics/sessions - Session analytics
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
    const botUuid = searchParams.get('botUuid');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Calculate time range
    const now = new Date();
    let startDate = new Date(0);
    
    if (timeRange !== 'all') {
      const days = parseInt(timeRange.replace('d', ''));
      startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    }

    // Get sessions from database with filters
    const filteredSessions = await sessionService.getSessionsInRange(
      startDate,
      undefined,
      botUuid || undefined
    );

    // Filter by user if needed (sessions should already be filtered by user in the service)
    const userFilteredSessions = filteredSessions.filter(session => session.userId === userId);

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedSessions = userFilteredSessions.slice(startIndex, startIndex + limit);

    // Calculate analytics
    const totalSessions = userFilteredSessions.length;
    const activeSessions = userFilteredSessions.filter(session => !session.endTime).length;
    const completedSessions = userFilteredSessions.filter(session => session.endTime).length;

    // Session duration statistics
    const sessionsWithDuration = userFilteredSessions.filter(session =>
      session.endTime && session.startTime
    );

    const durations = sessionsWithDuration.map(session => {
      const start = new Date(session.startTime).getTime();
      const end = new Date(session.endTime!).getTime();
      return (end - start) / 1000; // Duration in seconds
    });

    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0;
    const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

    // Geographic distribution (mock data - in real app, would use IP geolocation)
    const geoDistribution = {
      'United States': Math.floor(totalSessions * 0.4),
      'United Kingdom': Math.floor(totalSessions * 0.15),
      'Canada': Math.floor(totalSessions * 0.12),
      'Australia': Math.floor(totalSessions * 0.08),
      'Germany': Math.floor(totalSessions * 0.07),
      'France': Math.floor(totalSessions * 0.06),
      'Other': Math.floor(totalSessions * 0.12)
    };

    // Device/Browser distribution (mock data)
    const deviceDistribution = {
      'Desktop': Math.floor(totalSessions * 0.6),
      'Mobile': Math.floor(totalSessions * 0.35),
      'Tablet': Math.floor(totalSessions * 0.05)
    };

    const browserDistribution = {
      'Chrome': Math.floor(totalSessions * 0.65),
      'Safari': Math.floor(totalSessions * 0.15),
      'Firefox': Math.floor(totalSessions * 0.10),
      'Edge': Math.floor(totalSessions * 0.08),
      'Other': Math.floor(totalSessions * 0.02)
    };

    // Session trends (group by day)
    const sessionTrends: Record<string, number> = {};
    filteredSessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      sessionTrends[date] = (sessionTrends[date] || 0) + 1;
    });

    // Sessions by bot
    const sessionsByBot: Record<string, any> = {};
    filteredSessions.forEach(session => {
      const botId = session.botUuid || 'unknown';
      if (!sessionsByBot[botId]) {
        sessionsByBot[botId] = {
          botUuid: botId,
          sessionCount: 0,
          totalDuration: 0,
          avgDuration: 0
        };
      }
      sessionsByBot[botId].sessionCount++;
      
      if (session.endTime && session.startTime) {
        const duration = (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000;
        sessionsByBot[botId].totalDuration += duration;
      }
    });

    // Calculate average durations for each bot
    Object.values(sessionsByBot).forEach((bot: any) => {
      if (bot.sessionCount > 0) {
        bot.avgDuration = Math.round(bot.totalDuration / bot.sessionCount);
      }
    });

    // Recent sessions for display
    const recentSessions = filteredSessions
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 10)
      .map(session => ({
        id: session.id,
        botUuid: session.botUuid,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.endTime && session.startTime 
          ? (new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000
          : null,
        userAgent: session.userAgent || 'Unknown',
        ipAddress: session.ipAddress ? session.ipAddress.replace(/\d+$/, 'xxx') : 'Unknown', // Mask IP for privacy
        interactions: session.interactions || 0,
        status: session.endTime ? 'completed' : 'active'
      }));

    // Peak hours analysis
    const hourlyDistribution: Record<number, number> = {};
    filteredSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      timeRange,
      botUuid,
      pagination: {
        page,
        limit,
        total: totalSessions,
        hasMore: startIndex + limit < totalSessions
      },
      analytics: {
        overview: {
          totalSessions,
          activeSessions,
          completedSessions,
          avgSessionsPerDay: totalSessions > 0 && timeRange !== 'all' 
            ? Math.round(totalSessions / parseInt(timeRange.replace('d', '')))
            : 0
        },
        duration: {
          average: Math.round(avgDuration),
          minimum: Math.round(minDuration),
          maximum: Math.round(maxDuration),
          totalHours: Math.round(durations.reduce((sum, d) => sum + d, 0) / 3600)
        },
        trends: {
          sessionTrends: Object.entries(sessionTrends).map(([date, count]) => ({
            date,
            count
          })).sort((a, b) => a.date.localeCompare(b.date)),
          hourlyDistribution: Object.entries(hourlyDistribution).map(([hour, count]) => ({
            hour: parseInt(hour),
            count
          })).sort((a, b) => a.hour - b.hour)
        },
        distributions: {
          geographic: Object.entries(geoDistribution).map(([country, count]) => ({
            country,
            count
          })),
          device: Object.entries(deviceDistribution).map(([device, count]) => ({
            device,
            count
          })),
          browser: Object.entries(browserDistribution).map(([browser, count]) => ({
            browser,
            count
          }))
        },
        byBot: Object.values(sessionsByBot),
        recentSessions
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dataSource: 'Session Registry',
        note: 'Session tracking is currently mock data. In production, implement proper session tracking.'
      }
    });

  } catch (error) {
    console.error('❌ Analytics sessions error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve session analytics' 
      },
      { status: 500 }
    );
  }
}

// POST /api/analytics/sessions - Track new session (for future implementation)
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { botUuid, userAgent, ipAddress } = body;

    // Create new session in database
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session = await sessionService.createSession({
      sessionId,
      botUuid,
      userId,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      message: 'Session tracking started'
    });

  } catch (error) {
    console.error('❌ Session tracking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to start session tracking' 
      },
      { status: 500 }
    );
  }
}
