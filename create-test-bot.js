const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestBot() {
  try {
    console.log('🤖 Creating test bot...');

    // Create a test user first (if not exists)
    const testUserId = 'test-user-123';
    
    await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }
    });

    console.log('✅ Test user created/found');

    // Create the test bot
    const botUuid = '125ad333-17eb-409a-82a1-fa7e3caba8e0';
    
    const bot = await prisma.bot.upsert({
      where: { uuid: botUuid },
      update: {
        status: 'ACTIVE',
        vapiAssistantId: 'test-vapi-assistant-id-123'
      },
      create: {
        uuid: botUuid,
        name: 'Test Voice Bot',
        welcomeMessage: 'Hello! I am your test voice assistant.',
        systemPrompt: 'You are a helpful voice assistant for testing purposes.',
        language: 'en',
        voice: 'jennifer',
        position: 'RIGHT',
        theme: 'LIGHT',
        ragEnabled: false,
        status: 'ACTIVE',
        embedCode: `<script defer src="http://localhost:3000/js/external-chatbot-voice.js" data-chatbot-uuid="${botUuid}" data-language="en" data-position="right" data-theme="light"></script>`,
        documentsProcessed: 0,
        vapiAssistantId: 'test-vapi-assistant-id-123',
        localFilesStored: 0,
        activationScheduledAt: new Date(),
        activatedAt: new Date(),
        userId: testUserId
      }
    });

    console.log('✅ Test bot created successfully:', {
      uuid: bot.uuid,
      name: bot.name,
      status: bot.status,
      vapiAssistantId: bot.vapiAssistantId
    });

    console.log('🎉 Test bot is ready! You can now test your voice bot.');

  } catch (error) {
    console.error('❌ Error creating test bot:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBot();
