import { prisma, handleDatabaseError } from '@/lib/database';
import { Session } from '@prisma/client';

// Types for API compatibility
export interface SessionRecord {
  id: string;
  sessionId: string;
  botUuid: string;
  userId: string;
  startTime: string;
  endTime?: string;
  userAgent?: string;
  ipAddress?: string;
  interactions: number;
}

// Convert database session to API format
function sessionToRecord(session: Session & { bot: { uuid: string } }): SessionRecord {
  return {
    id: session.id,
    sessionId: session.sessionId,
    botUuid: session.bot.uuid,
    userId: session.userId,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString(),
    userAgent: session.userAgent || undefined,
    ipAddress: session.ipAddress || undefined,
    interactions: session.interactions,
  };
}

// Session service functions
export const sessionService = {
  // Create a new session
  async createSession(sessionData: {
    sessionId: string;
    botUuid: string;
    userId: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<SessionRecord> {
    try {
      // First, get the bot ID from UUID
      const bot = await prisma.bot.findUnique({
        where: { uuid: sessionData.botUuid },
        select: { id: true, uuid: true },
      });

      if (!bot) {
        throw new Error(`Bot with UUID ${sessionData.botUuid} not found`);
      }

      const session = await prisma.session.create({
        data: {
          sessionId: sessionData.sessionId,
          userId: sessionData.userId,
          botId: bot.id,
          userAgent: sessionData.userAgent,
          ipAddress: sessionData.ipAddress,
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });

      return sessionToRecord(session);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get session by session ID
  async getSessionBySessionId(sessionId: string): Promise<SessionRecord | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { sessionId },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return session ? sessionToRecord(session) : null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get sessions by user ID
  async getSessionsByUserId(userId: string): Promise<SessionRecord[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: { userId },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });
      return sessions.map(sessionToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get sessions by bot UUID
  async getSessionsByBotUuid(botUuid: string): Promise<SessionRecord[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: {
          bot: { uuid: botUuid },
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });
      return sessions.map(sessionToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get sessions within date range
  async getSessionsInRange(
    startDate: Date,
    endDate?: Date,
    botUuid?: string
  ): Promise<SessionRecord[]> {
    try {
      const whereClause: any = {
        startTime: {
          gte: startDate,
          ...(endDate && { lte: endDate }),
        },
      };

      if (botUuid) {
        whereClause.bot = { uuid: botUuid };
      }

      const sessions = await prisma.session.findMany({
        where: whereClause,
        include: {
          bot: {
            select: { uuid: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });
      return sessions.map(sessionToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Update session (end session, increment interactions)
  async updateSession(
    sessionId: string,
    updates: {
      endTime?: Date;
      interactions?: number;
    }
  ): Promise<SessionRecord | null> {
    try {
      const session = await prisma.session.update({
        where: { sessionId },
        data: {
          endTime: updates.endTime,
          interactions: updates.interactions,
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return sessionToRecord(session);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // End session
  async endSession(sessionId: string): Promise<SessionRecord | null> {
    try {
      const session = await prisma.session.update({
        where: { sessionId },
        data: { endTime: new Date() },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return sessionToRecord(session);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Increment session interactions
  async incrementInteractions(sessionId: string): Promise<SessionRecord | null> {
    try {
      const session = await prisma.session.update({
        where: { sessionId },
        data: { interactions: { increment: 1 } },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return sessionToRecord(session);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Delete session
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await prisma.session.delete({
        where: { sessionId },
      });
      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get session analytics
  async getSessionAnalytics(
    userId?: string,
    botUuid?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalSessions: number;
    activeSessions: number;
    avgSessionDuration: number;
    totalInteractions: number;
  }> {
    try {
      const whereClause: any = {};

      if (userId) whereClause.userId = userId;
      if (botUuid) whereClause.bot = { uuid: botUuid };
      if (startDate || endDate) {
        whereClause.startTime = {};
        if (startDate) whereClause.startTime.gte = startDate;
        if (endDate) whereClause.startTime.lte = endDate;
      }

      const [totalSessions, activeSessions, sessionStats] = await Promise.all([
        prisma.session.count({ where: whereClause }),
        prisma.session.count({
          where: { ...whereClause, endTime: null },
        }),
        prisma.session.aggregate({
          where: whereClause,
          _avg: {
            interactions: true,
          },
          _sum: {
            interactions: true,
          },
        }),
      ]);

      // Calculate average session duration for ended sessions
      const endedSessions = await prisma.session.findMany({
        where: { ...whereClause, endTime: { not: null } },
        select: { startTime: true, endTime: true },
      });

      const avgSessionDuration = endedSessions.length > 0
        ? endedSessions.reduce((sum, session) => {
            const duration = session.endTime!.getTime() - session.startTime.getTime();
            return sum + duration;
          }, 0) / endedSessions.length / 1000 // Convert to seconds
        : 0;

      return {
        totalSessions,
        activeSessions,
        avgSessionDuration: Math.round(avgSessionDuration),
        totalInteractions: sessionStats._sum.interactions || 0,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },
};
