import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a single instance of Prisma client
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// In development, store the client on the global object to prevent
// multiple instances during hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Database connection helper with retry logic
export async function connectToDatabase(retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$connect();
      console.log('✅ Connected to database successfully');
      return true;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt}/${retries} failed:`, error instanceof Error ? error.message : error);

      if (attempt === retries) {
        console.error('❌ All database connection attempts failed');
        console.log('💡 Make sure your DATABASE_URL is correct and the database is running');
        console.log('💡 For Azure Database for PostgreSQL, use format: postgresql://username:password@servername.postgres.database.azure.com:5432/databasename?sslmode=require');
        console.log('💡 Check if the Azure Database for PostgreSQL server is running and accessible');
        console.log('💡 Verify firewall rules allow connections from your IP address');
        return false;
      }

      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
  return false;
}

// Database disconnection helper
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Disconnected from database successfully');
  } catch (error) {
    console.error('❌ Failed to disconnect from database:', error);
  }
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { healthy: true, message: 'Database is healthy' };
  } catch (error) {
    return { 
      healthy: false, 
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

// Error handling helper
export function handleDatabaseError(error: unknown): {
  message: string;
  code?: string;
  statusCode: number;
} {
  if (error instanceof Error) {
    // Prisma-specific error handling
    if ('code' in error) {
      const prismaError = error as any;
      switch (prismaError.code) {
        case 'P2002':
          return {
            message: 'A record with this information already exists',
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            statusCode: 409,
          };
        case 'P2025':
          return {
            message: 'Record not found',
            code: 'RECORD_NOT_FOUND',
            statusCode: 404,
          };
        case 'P2003':
          return {
            message: 'Foreign key constraint failed',
            code: 'FOREIGN_KEY_CONSTRAINT',
            statusCode: 400,
          };
        default:
          return {
            message: `Database error: ${prismaError.message}`,
            code: prismaError.code,
            statusCode: 500,
          };
      }
    }
    
    return {
      message: error.message,
      statusCode: 500,
    };
  }
  
  return {
    message: 'Unknown database error occurred',
    statusCode: 500,
  };
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await disconnectFromDatabase();
});

process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectFromDatabase();
  process.exit(0);
});
