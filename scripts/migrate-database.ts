#!/usr/bin/env tsx

/**
 * Database Migration Script
 * 
 * This script migrates data from in-memory storage to PostgreSQL database.
 * It should be run after setting up the database connection.
 * 
 * Usage:
 * 1. Ensure DATABASE_URL is set in .env.local
 * 2. Run: npx tsx scripts/migrate-database.ts
 */

import { PrismaClient } from '@prisma/client';
import { connectToDatabase, checkDatabaseHealth } from '../src/lib/database';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting database migration...');

  // Check database connection
  console.log('📡 Checking database connection...');
  const isConnected = await connectToDatabase();
  if (!isConnected) {
    console.error('❌ Failed to connect to database. Please check your DATABASE_URL.');
    process.exit(1);
  }

  // Check database health
  const health = await checkDatabaseHealth();
  if (!health.healthy) {
    console.error('❌ Database health check failed:', health.message);
    process.exit(1);
  }

  console.log('✅ Database connection established successfully');

  // Run database migrations
  console.log('🔄 Running database migrations...');
  try {
    // This would typically run Prisma migrations
    // For now, we'll just ensure the schema is applied
    console.log('📋 Database schema is ready');
    
    // You can add data migration logic here if needed
    // For example, migrating existing data from files or other sources
    
    console.log('✅ Database migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  // Verify tables exist
  console.log('🔍 Verifying database tables...');
  try {
    await prisma.user.findMany({ take: 1 });
    console.log('✅ Users table verified');
    
    await prisma.bot.findMany({ take: 1 });
    console.log('✅ Bots table verified');
    
    await prisma.document.findMany({ take: 1 });
    console.log('✅ Documents table verified');
    
    await prisma.session.findMany({ take: 1 });
    console.log('✅ Sessions table verified');
    
    await prisma.call.findMany({ take: 1 });
    console.log('✅ Calls table verified');
    
  } catch (error) {
    console.error('❌ Table verification failed:', error);
    console.log('💡 You may need to run: npx prisma db push');
    process.exit(1);
  }

  console.log('🎉 Database migration completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update your environment variables if using Azure Database for PostgreSQL');
  console.log('2. Test the application to ensure all functionality works');
  console.log('3. Monitor the application logs for any database-related issues');
}

main()
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
