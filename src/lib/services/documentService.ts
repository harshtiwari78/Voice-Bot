import { prisma, handleDatabaseError } from '@/lib/database';
import { Document } from '@prisma/client';

// Types for API compatibility
export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  chunks: string[];
  pages?: number;
  wordCount?: number;
  filePath?: string;
  uploadedAt: string;
  processedAt?: string;
  botUuid: string;
}

// Convert database document to API format
function documentToRecord(document: Document & { bot: { uuid: string } }): DocumentRecord {
  return {
    id: document.id,
    name: document.name,
    type: document.type,
    size: document.size,
    content: document.content || undefined,
    chunks: document.chunks,
    pages: document.pages || undefined,
    wordCount: document.wordCount || undefined,
    filePath: document.filePath || undefined,
    uploadedAt: document.uploadedAt.toISOString(),
    processedAt: document.processedAt?.toISOString(),
    botUuid: document.bot.uuid,
  };
}

// Document service functions
export const documentService = {
  // Create a new document
  async createDocument(documentData: {
    name: string;
    type: string;
    size: number;
    content?: string;
    chunks?: string[];
    pages?: number;
    wordCount?: number;
    filePath?: string;
    botUuid: string;
  }): Promise<DocumentRecord> {
    try {
      // First, get the bot ID from UUID
      const bot = await prisma.bot.findUnique({
        where: { uuid: documentData.botUuid },
        select: { id: true, uuid: true },
      });

      if (!bot) {
        throw new Error(`Bot with UUID ${documentData.botUuid} not found`);
      }

      const document = await prisma.document.create({
        data: {
          name: documentData.name,
          type: documentData.type,
          size: documentData.size,
          content: documentData.content,
          chunks: documentData.chunks || [],
          pages: documentData.pages,
          wordCount: documentData.wordCount,
          filePath: documentData.filePath,
          botId: bot.id,
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });

      return documentToRecord(document);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get document by ID
  async getDocumentById(id: string): Promise<DocumentRecord | null> {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return document ? documentToRecord(document) : null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get documents by bot UUID
  async getDocumentsByBotUuid(botUuid: string): Promise<DocumentRecord[]> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          bot: { uuid: botUuid },
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });
      return documents.map(documentToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Update document
  async updateDocument(
    id: string,
    updates: {
      content?: string;
      chunks?: string[];
      pages?: number;
      wordCount?: number;
      processedAt?: Date;
    }
  ): Promise<DocumentRecord | null> {
    try {
      const document = await prisma.document.update({
        where: { id },
        data: {
          content: updates.content,
          chunks: updates.chunks,
          pages: updates.pages,
          wordCount: updates.wordCount,
          processedAt: updates.processedAt,
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return documentToRecord(document);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Mark document as processed
  async markDocumentProcessed(
    id: string,
    processedData: {
      content?: string;
      chunks: string[];
      pages?: number;
      wordCount?: number;
    }
  ): Promise<DocumentRecord | null> {
    try {
      const document = await prisma.document.update({
        where: { id },
        data: {
          content: processedData.content,
          chunks: processedData.chunks,
          pages: processedData.pages,
          wordCount: processedData.wordCount,
          processedAt: new Date(),
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
      });
      return documentToRecord(document);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Delete document
  async deleteDocument(id: string): Promise<boolean> {
    try {
      await prisma.document.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Delete all documents for a bot
  async deleteDocumentsByBotUuid(botUuid: string): Promise<number> {
    try {
      const result = await prisma.document.deleteMany({
        where: {
          bot: { uuid: botUuid },
        },
      });
      return result.count;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get document statistics for a bot
  async getDocumentStats(botUuid: string): Promise<{
    totalDocuments: number;
    processedDocuments: number;
    totalSize: number;
    totalChunks: number;
    totalWords: number;
  }> {
    try {
      const [stats, processedCount] = await Promise.all([
        prisma.document.aggregate({
          where: {
            bot: { uuid: botUuid },
          },
          _count: true,
          _sum: {
            size: true,
            wordCount: true,
          },
        }),
        prisma.document.count({
          where: {
            bot: { uuid: botUuid },
            processedAt: { not: null },
          },
        }),
      ]);

      // Get total chunks count
      const documents = await prisma.document.findMany({
        where: {
          bot: { uuid: botUuid },
        },
        select: { chunks: true },
      });

      const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);

      return {
        totalDocuments: stats._count,
        processedDocuments: processedCount,
        totalSize: stats._sum.size || 0,
        totalChunks,
        totalWords: stats._sum.wordCount || 0,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Search documents by content
  async searchDocuments(
    botUuid: string,
    searchTerm: string,
    limit?: number
  ): Promise<DocumentRecord[]> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          bot: { uuid: botUuid },
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { content: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        take: limit,
      });
      return documents.map(documentToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get documents by type
  async getDocumentsByType(botUuid: string, type: string): Promise<DocumentRecord[]> {
    try {
      const documents = await prisma.document.findMany({
        where: {
          bot: { uuid: botUuid },
          type,
        },
        include: {
          bot: {
            select: { uuid: true },
          },
        },
        orderBy: { uploadedAt: 'desc' },
      });
      return documents.map(documentToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },
};
