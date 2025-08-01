import { prisma, handleDatabaseError } from '@/lib/database';
import { Bot, BotStatus, Position, Theme, RagSourceType } from '@prisma/client';

// Types for API compatibility
export interface BotRecord {
  uuid: string;
  name: string;
  welcomeMessage: string;
  systemPrompt: string;
  language: string;
  voice: string;
  position: 'left' | 'right';
  theme: 'light' | 'dark';
  ragEnabled: boolean;
  ragSourceType: 'files' | 'url' | null;
  ragUrl: string | null;
  userId: string;
  status: 'pending' | 'activating' | 'active' | 'failed';
  createdAt: string;
  activationScheduledAt: string;
  embedCode: string;
  documentsProcessed: number;
  vapiAssistantId?: string;
  vapiKnowledgeBaseId?: string;
  localFilesStored?: number;
  localStoragePath?: string;
  activatedAt?: string;
}

// Convert database bot to API format
function botToRecord(bot: Bot): BotRecord {
  return {
    uuid: bot.uuid,
    name: bot.name,
    welcomeMessage: bot.welcomeMessage,
    systemPrompt: bot.systemPrompt,
    language: bot.language,
    voice: bot.voice,
    position: bot.position.toLowerCase() as 'left' | 'right',
    theme: bot.theme.toLowerCase() as 'light' | 'dark',
    ragEnabled: bot.ragEnabled,
    ragSourceType: bot.ragSourceType?.toLowerCase() as 'files' | 'url' | null,
    ragUrl: bot.ragUrl,
    userId: bot.userId,
    status: bot.status.toLowerCase() as 'pending' | 'activating' | 'active' | 'failed',
    createdAt: bot.createdAt.toISOString(),
    activationScheduledAt: bot.activationScheduledAt.toISOString(),
    embedCode: bot.embedCode,
    documentsProcessed: bot.documentsProcessed,
    vapiAssistantId: bot.vapiAssistantId || undefined,
    vapiKnowledgeBaseId: bot.vapiKnowledgeBaseId || undefined,
    localFilesStored: bot.localFilesStored,
    localStoragePath: bot.localStoragePath || undefined,
    activatedAt: bot.activatedAt?.toISOString(),
  };
}

// Convert API format to database format
function recordToBot(record: Partial<BotRecord> & { userId: string }) {
  return {
    uuid: record.uuid || '',
    name: record.name || '',
    welcomeMessage: record.welcomeMessage || '',
    systemPrompt: record.systemPrompt || '',
    language: record.language || 'en',
    voice: record.voice || 'jennifer',
    position: (record.position?.toUpperCase() as Position) || Position.RIGHT,
    theme: (record.theme?.toUpperCase() as Theme) || Theme.LIGHT,
    ragEnabled: record.ragEnabled || false,
    ragSourceType: record.ragSourceType?.toUpperCase() as RagSourceType | null,
    ragUrl: record.ragUrl,
    userId: record.userId,
    status: (record.status?.toUpperCase() as BotStatus) || BotStatus.PENDING,
    activationScheduledAt: record.activationScheduledAt ? new Date(record.activationScheduledAt) : new Date(),
    embedCode: record.embedCode || '',
    documentsProcessed: record.documentsProcessed || 0,
    vapiAssistantId: record.vapiAssistantId,
    vapiKnowledgeBaseId: record.vapiKnowledgeBaseId,
    localFilesStored: record.localFilesStored || 0,
    localStoragePath: record.localStoragePath,
    activatedAt: record.activatedAt ? new Date(record.activatedAt) : null,
  };
}

// Bot service functions
export const botService = {
  // Create a new bot
  async createBot(botData: Partial<BotRecord> & { userId: string }): Promise<BotRecord> {
    try {
      const bot = await prisma.bot.create({
        data: recordToBot(botData),
      });
      return botToRecord(bot);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get bot by UUID
  async getBotByUuid(uuid: string): Promise<BotRecord | null> {
    try {
      const bot = await prisma.bot.findUnique({
        where: { uuid },
      });
      return bot ? botToRecord(bot) : null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get all bots for a user
  async getBotsByUserId(userId: string): Promise<BotRecord[]> {
    try {
      const bots = await prisma.bot.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      return bots.map(botToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get all bots (admin function)
  async getAllBots(): Promise<BotRecord[]> {
    try {
      const bots = await prisma.bot.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return bots.map(botToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Update bot
  async updateBot(uuid: string, updates: Partial<BotRecord>): Promise<BotRecord | null> {
    try {
      const updateData = recordToBot({ ...updates, userId: '' });
      // Remove userId from update data as it shouldn't be updated
      delete (updateData as any).userId;
      
      const bot = await prisma.bot.update({
        where: { uuid },
        data: updateData,
      });
      return botToRecord(bot);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Update bot status
  async updateBotStatus(uuid: string, status: 'pending' | 'activating' | 'active' | 'failed'): Promise<BotRecord | null> {
    try {
      const bot = await prisma.bot.update({
        where: { uuid },
        data: { 
          status: status.toUpperCase() as BotStatus,
          activatedAt: status === 'active' ? new Date() : undefined,
        },
      });
      return botToRecord(bot);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Delete bot
  async deleteBot(uuid: string): Promise<boolean> {
    try {
      await prisma.bot.delete({
        where: { uuid },
      });
      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get bots by status
  async getBotsByStatus(status: 'pending' | 'activating' | 'active' | 'failed'): Promise<BotRecord[]> {
    try {
      const bots = await prisma.bot.findMany({
        where: { status: status.toUpperCase() as BotStatus },
        orderBy: { createdAt: 'desc' },
      });
      return bots.map(botToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Check if bot exists
  async botExists(uuid: string): Promise<boolean> {
    try {
      const count = await prisma.bot.count({
        where: { uuid },
      });
      return count > 0;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },
};
