import { prisma, handleDatabaseError } from '@/lib/database';
import { User } from '@prisma/client';

// Types for API compatibility
export interface UserRecord {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Convert database user to API format
function userToRecord(user: User): UserRecord {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    imageUrl: user.imageUrl || undefined,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// User service functions
export const userService = {
  // Create or update user (upsert for Clerk integration)
  async upsertUser(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  }): Promise<UserRecord> {
    try {
      const user = await prisma.user.upsert({
        where: { id: userData.id },
        update: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
        },
        create: {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          imageUrl: userData.imageUrl,
        },
      });
      return userToRecord(user);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get user by ID
  async getUserById(id: string): Promise<UserRecord | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      return user ? userToRecord(user) : null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<UserRecord | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user ? userToRecord(user) : null;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Update user
  async updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    try {
      const user = await prisma.user.update({
        where: { id },
        data: {
          email: updates.email,
          firstName: updates.firstName,
          lastName: updates.lastName,
          imageUrl: updates.imageUrl,
        },
      });
      return userToRecord(user);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Delete user
  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Check if user exists
  async userExists(id: string): Promise<boolean> {
    try {
      const count = await prisma.user.count({
        where: { id },
      });
      return count > 0;
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get user with bots count
  async getUserWithStats(id: string): Promise<(UserRecord & { botsCount: number }) | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: { bots: true },
          },
        },
      });
      
      if (!user) return null;
      
      return {
        ...userToRecord(user),
        botsCount: user._count.bots,
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },

  // Get all users (admin function)
  async getAllUsers(): Promise<UserRecord[]> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return users.map(userToRecord);
    } catch (error) {
      throw handleDatabaseError(error);
    }
  },
};
