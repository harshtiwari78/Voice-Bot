import { prisma, handleDatabaseError } from '@/lib/database';
import { Call, CallStatus } from '@prisma/client';

// Types for API compatibility
export interface CallRecord {
  id: string;
  vapiCallId: string;
  assistantId: string;
  status: 'queued' | 'ringing' | 'in_progress' | 'forwarding' | 'ended';
  endedReason?: string;
  phoneNumber?: string;
  type?: string;
  cost: number;
  duration?: number;
  transcript?: string;
  recording?: string;
  summary?: string;
  messageCount: number;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  userId: string;
  botUuid: string;
}

// Convert database call to API format
function callToRecord(call: Call & { bot: { uuid: string } }): CallRecord {
  return {
    id: call.id,
    vapiCallId: call.vapiCallId,
    assistantId: call.assistantId,
    status: call.status.toLowerCase() as 'queued' | 'ringing' | 'in_progress' | 'forwarding' | 'ended',
    endedReason: call.endedReason || undefined,
    phoneNumber: call.phoneNumber || undefined,
    type: call.type || undefined,
    cost: call.cost,
    duration: call.duration || undefined,
    transcript: call.transcript || undefined,
    recording: call.recording || undefined,
    summary: call.summary || undefined,
    messageCount: call.messageCount,
    createdAt: call.createdAt.toISOString(),
    startedAt: call.startedAt?.toISOString(),
    endedAt: call.endedAt?.toISOString(),
    userId: call.userId,
    botUuid: call.bot.uuid,
  };
}

// Call service functions
export const callService = {
  // Create or update call (upsert for VAPI integration)
  async upsertCall(callData: {
    vapiCallId: string;
    assistantId: string;
    status: 'queued' | 'ringing' | 'in_progress' | 'forwarding' | 'ended';
    endedReason?: string;
    phoneNumber?: string;
    type?: string;
    cost?: number;
    duration?: number;
    transcript?: string;
    recording?: string;
    summary?: string;
    messageCount?: number;
    startedAt?: string;
    endedAt?: string;
    userId: string;
    botUuid: string;
  }): Promise<CallRecord> {
    try {
      // First, get the bot ID from UUID
      const bot = await prisma.bot.findUnique({
        where: { uuid: callData.botUuid },
        select: { id: true, uuid: true },
      });

      if (!bot) {
        throw new Error(`Bot with UUID ${callData.botUuid} not found`);
      }

      const call = await prisma.call.upsert({
        where: { vapiCallId: callData.vapiCallId },
        update: {
          status: callData.status.toUpperCase() as CallStatus,
          endedReason: callData.endedReason,
          phoneNumber: callData.phoneNumber,
          type: callData.type,
          cost: callData.cost || 0,
          duration: callData.duration,
          transcript: callData.transcript,
          recording: callData.recording,
          summary: callData.summary,
          messageCount: callData.messageCount || 0,
          startedAt: callData.startedAt ? new Date(callData.startedAt) : null,
          endedAt: callData.endedAt ? new Date(callData.endedAt) : null,
        },
        create: {
          vapiCallId: callData.vapiCallId,
          assistantId: callData.assistantId,
          status: callData.status.toUpperCase() as CallStatus,
          endedReason: callData.endedReason,
          phoneNumber: callData.phoneNumber,
          type: callData.type,
          cost: callData.cost || 0,
          duration: callData.duration,
          transcript: callData.transcript,
          recording: callData.recording,
          summary: callData.summary,
          messageCount: callData.messageCount || 0,
          startedAt: callData.startedAt ? new Date(callData.startedAt) : null,
          endedAt: callData.endedAt ? new Date(callData.endedAt) : null,
          userId: callData.userId,
          botId: bot.id,
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });

      return callToRecord(call);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get call by VAPI call ID
  async getCallByVapiId(vapiCallId: string): Promise<CallRecord | null> {
    try {
      const call = await prisma.call.findUnique({
        where: { vapiCallId },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return call ? callToRecord(call) : null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get calls by user ID
  async getCallsByUserId(userId: string, limit?: number, offset?: number): Promise<CallRecord[]> {
    try {
      const calls = await prisma.call.findMany({
        where: { userId },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
      return calls.map(callToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get calls by bot UUID
  async getCallsByBotUuid(botUuid: string, limit?: number, offset?: number): Promise<CallRecord[]> {
    try {
      const calls = await prisma.call.findMany({
        where: {
          bot: { uuid: botUuid },
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
      return calls.map(callToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get calls within date range with filters
  async getCallsInRange(
    startDate: Date,
    endDate?: Date,
    filters?: {
      userId?: string;
      botUuid?: string;
      assistantId?: string;
      status?: 'queued' | 'ringing' | 'in_progress' | 'forwarding' | 'ended';
    },
    pagination?: {
      limit: number;
      offset: number;
    }
  ): Promise<{ calls: CallRecord[]; total: number }> {
    try {
      const whereClause: any = {
        createdAt: {
          gte: startDate,
          ...(endDate && { lte: endDate }),
        },
      };

      if (filters?.userId) whereClause.userId = filters.userId;
      if (filters?.botUuid) whereClause.bot = { uuid: filters.botUuid };
      if (filters?.assistantId) whereClause.assistantId = filters.assistantId;
      if (filters?.status) whereClause.status = filters.status.toUpperCase() as CallStatus;

      const [calls, total] = await Promise.all([
        prisma.call.findMany({
          where: whereClause,
          include: {
            bot: {
              select: { uuid: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: pagination?.limit,
          skip: pagination?.offset,
        }),
        prisma.call.count({ where: whereClause }),
      ]);

      return {
        calls: calls.map(callToRecord),
        total,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Update call
  async updateCall(vapiCallId: string, updates: Partial<CallRecord>): Promise<CallRecord | null> {
    try {
      const updateData: any = {};
      
      if (updates.status) updateData.status = updates.status.toUpperCase() as CallStatus;
      if (updates.endedReason !== undefined) updateData.endedReason = updates.endedReason;
      if (updates.phoneNumber !== undefined) updateData.phoneNumber = updates.phoneNumber;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.cost !== undefined) updateData.cost = updates.cost;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.transcript !== undefined) updateData.transcript = updates.transcript;
      if (updates.recording !== undefined) updateData.recording = updates.recording;
      if (updates.summary !== undefined) updateData.summary = updates.summary;
      if (updates.messageCount !== undefined) updateData.messageCount = updates.messageCount;
      if (updates.startedAt !== undefined) updateData.startedAt = updates.startedAt ? new Date(updates.startedAt) : null;
      if (updates.endedAt !== undefined) updateData.endedAt = updates.endedAt ? new Date(updates.endedAt) : null;

      const call = await prisma.call.update({
        where: { vapiCallId },
        data: updateData,
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return callToRecord(call);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Delete call
  async deleteCall(vapiCallId: string): Promise<boolean> {
    try {
      await prisma.call.delete({
        where: { vapiCallId },
      });
      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get call analytics
  async getCallAnalytics(
    userId?: string,
    botUuid?: string,
    assistantId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalCalls: number;
    callsWithTranscripts: number;
    callsWithRecordings: number;
    totalMessages: number;
    totalCost: number;
    avgDuration: number;
    statusDistribution: Array<{ status: string; count: number }>;
    assistantDistribution: Array<{ assistantId: string; callCount: number; totalDuration: number; totalCost: number }>;
  }> {
    try {
      const whereClause: any = {};

      if (userId) whereClause.userId = userId;
      if (botUuid) whereClause.bot = { uuid: botUuid };
      if (assistantId) whereClause.assistantId = assistantId;
      if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) whereClause.createdAt.gte = startDate;
        if (endDate) whereClause.createdAt.lte = endDate;
      }

      const [
        totalCalls,
        callsWithTranscripts,
        callsWithRecordings,
        callStats,
        statusGroups,
        assistantGroups,
      ] = await Promise.all([
        prisma.call.count({ where: whereClause }),
        prisma.call.count({
          where: { ...whereClause, transcript: { not: null } },
        }),
        prisma.call.count({
          where: { ...whereClause, recording: { not: null } },
        }),
        prisma.call.aggregate({
          where: whereClause,
          _sum: {
            messageCount: true,
            cost: true,
            duration: true,
          },
          _avg: {
            duration: true,
          },
        }),
        prisma.call.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true,
        }),
        prisma.call.groupBy({
          by: ['assistantId'],
          where: whereClause,
          _count: true,
          _sum: {
            duration: true,
            cost: true,
          },
        }),
      ]);

      return {
        totalCalls,
        callsWithTranscripts,
        callsWithRecordings,
        totalMessages: callStats._sum.messageCount || 0,
        totalCost: callStats._sum.cost || 0,
        avgDuration: Math.round(callStats._avg.duration || 0),
        statusDistribution: statusGroups.map(group => ({
          status: group.status.toLowerCase(),
          count: group._count,
        })),
        assistantDistribution: assistantGroups.map(group => ({
          assistantId: group.assistantId,
          callCount: group._count,
          totalDuration: group._sum.duration || 0,
          totalCost: group._sum.cost || 0,
        })),
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },
};
