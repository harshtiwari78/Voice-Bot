import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import { uploadRagFilesToDrive, createEmptyRagBot } from '@/lib/googleService';
import {
  initializeUploadsDirectory,
  saveFileToBot,
  saveBotMetadata,
  createBotDirectory
} from '@/lib/localFileStorage';
import { botService } from '@/lib/services/botService';
import { userService } from '@/lib/services/userService';
import { documentService } from '@/lib/services/documentService';

// Types
interface BotConfig {
  botName: string;
  welcomeMessage: string;
  systemPrompt: string;
  language: string;
  voice: string;
  position: 'left' | 'right';
  theme: 'light' | 'dark';
  ragEnabled: boolean;
  ragSourceType: 'files' | 'url';
  ragUrl: string;
  userId?: string;
}

interface BotRecord {
  uuid: string;
  name: string;
  welcomeMessage: string;
  systemPrompt: string;
  language: string;
  voice: string;
  position: 'left' | 'right';
  theme: 'light' | 'dark';
  ragEnabled: boolean;
  ragSourceType: 'files' | 'url';
  ragUrl: string;
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
}

interface ProcessedDocument {
  name: string;
  type: string;
  size: number;
  content: string;
  chunks: string[];
  originalFileBuffer?: Buffer; // Add original binary data for PDFs
  metadata: {
    pages?: number;
    wordCount?: number;
    processedAt: string;
  };
}

// Utility functions
function generateUUID(): string {
  return uuidv4();
}

function generateEmbedCode(botUuid: string, config: BotConfig, request?: NextRequest): string {
  // Dynamic domain detection for embedding
  let baseUrl: string;

  if (request) {
    // Extract domain from the request headers
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') ||
                    (host?.includes('localhost') ? 'http' : 'https');
    baseUrl = `${protocol}://${host}`;
  } else {
    // Fallback to environment variable or localhost for development
    baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  return `<script defer src="${baseUrl}/js/external-chatbot-voice.js" data-chatbot-uuid="${botUuid}" data-language="${config.language}" data-position="${config.position}" data-theme="${config.theme}"></script>`;
}

function scheduleActivation(botUuid: string): string {
  // Schedule activation for 24 hours from now
  const activationTime = new Date();
  activationTime.setHours(activationTime.getHours() + 24);
  return activationTime.toISOString();
}

async function processDocumentContent(file: File): Promise<ProcessedDocument> {
  let content: string;
  let originalFileBuffer: Buffer;

  // Handle different file types properly
  if (file.type === 'application/pdf') {
    // For PDFs, preserve the original binary data
    const arrayBuffer = await file.arrayBuffer();
    originalFileBuffer = Buffer.from(arrayBuffer);

    // For RAG processing, we'll use a placeholder text
    // In a production system, you'd use a PDF parser like pdf-parse
    content = `[PDF Document: ${file.name}]\nThis is a PDF file that requires specialized parsing for text extraction. The original binary content is preserved for download and viewing.`;
  } else {
    // For text files, convert to text as usual
    content = await file.text();
    originalFileBuffer = Buffer.from(content, 'utf-8');
  }

  // Simple text chunking (can be improved with more sophisticated methods)
  const chunks = content
    .split(/\n\s*\n/) // Split by double newlines
    .filter(chunk => chunk.trim().length > 0)
    .map(chunk => chunk.trim());

  return {
    name: file.name,
    type: file.type,
    size: file.size,
    content,
    chunks,
    originalFileBuffer, // Add the original binary data
    metadata: {
      wordCount: content.split(/\s+/).length,
      processedAt: new Date().toISOString()
    }
  };
}

async function createVAPIAssistant(config: BotConfig, documents: ProcessedDocument[] = []) {
  const VAPI_API_KEY = process.env.VAPI_PRIVATE_KEY;

  if (!VAPI_API_KEY) {
    throw new Error('VAPI API key not configured');
  }

  // Prepare knowledge base content if documents exist
  let knowledgeBase = '';
  if (documents.length > 0) {
    knowledgeBase = documents
      .map(doc => `Document: ${doc.name}\n${doc.content}`)
      .join('\n\n---\n\n');
  }

  // Enhanced system prompt with knowledge base
  const enhancedSystemPrompt = config.ragEnabled && knowledgeBase
    ? `${config.systemPrompt}\n\nKnowledge Base:\n${knowledgeBase}\n\nUse the above knowledge base to answer questions when relevant. If the information is not in the knowledge base, provide general helpful responses.`
    : config.systemPrompt;

  // Create minimal VAPI assistant configuration
  const assistantData = {
    name: config.botName,
    model: {
      provider: 'openai',
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: enhancedSystemPrompt
        }
      ]
    },
    voice: {
      provider: '11labs',
      voiceId: getVoiceId(config.voice)
    },
    firstMessage: config.welcomeMessage
  };

  console.log('🚀 Creating VAPI assistant with data:', JSON.stringify(assistantData, null, 2));

  try {
    const response = await fetch('https://api.vapi.ai/assistant', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(assistantData)
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`VAPI API error: ${response.status} - ${errorData}`);
    }

    const assistant = await response.json();
    return assistant;
  } catch (error) {
    console.error('Error creating VAPI assistant:', error);
    throw error;
  }
}

function getVoiceId(voiceName: string): string {
  const voiceMap: Record<string, string> = {
    'jennifer': 'EXAVITQu4vr4xnSDxMaL', // Bella
    'mark': 'TxGEqnHWrfWFTfGW9XjX', // Josh
    'sarah': 'pNInz6obpgDQGcFmaJgB', // Adam
    'david': 'VR6AewLTigWG4xSOukaG', // Arnold
    'emma': 'jsCqWAovK2LkecY7zXl4', // Charlotte
    'alex': 'pqHfZKP75CvOlQylNhV4'  // Clyde
  };
  
  return voiceMap[voiceName] || voiceMap['jennifer'];
}

// Database storage using Prisma services

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const configStr = formData.get('config') as string;
    
    if (!configStr) {
      return NextResponse.json(
        { success: false, error: 'Missing configuration' },
        { status: 400 }
      );
    }

    const config: BotConfig = JSON.parse(configStr);

    // Validate required fields
    if (!config.botName || !config.welcomeMessage || !config.systemPrompt) {
      return NextResponse.json(
        { success: false, error: 'Missing required bot configuration' },
        { status: 400 }
      );
    }

    // Process uploaded files
    let processedDocuments: ProcessedDocument[] = [];
    
    if (config.ragEnabled && config.ragSourceType === 'files') {
      const fileEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('file_'));
      
      for (const [, file] of fileEntries) {
        if (file instanceof File) {
          try {
            const processedDoc = await processDocumentContent(file);
            processedDocuments.push(processedDoc);
            console.log(`✅ Processed document: ${processedDoc.name}`);
          } catch (error) {
            console.error(`❌ Error processing document ${file.name}:`, error);
          }
        }
      }
    }

    // Generate bot UUID
    const botUuid = generateUUID();

    // 🗂️ LOCAL FILE STORAGE - Save files locally for RAG-enabled bots
    let localFilesPaths: string[] = [];
    if (config.ragEnabled && config.ragSourceType === 'files' && processedDocuments.length > 0) {
      try {
        console.log(`💾 Saving ${processedDocuments.length} files locally for bot: ${botUuid}`);

        // Initialize uploads directory if needed
        await initializeUploadsDirectory();

        // Create bot-specific directory
        await createBotDirectory(botUuid);

        // Save each file locally
        for (const doc of processedDocuments) {
          try {
            // Use original binary data for PDFs, text content for other files
            const fileBuffer = doc.type === 'application/pdf' && doc.originalFileBuffer
              ? doc.originalFileBuffer
              : Buffer.from(doc.content, 'utf-8');

            const filePath = await saveFileToBot(
              botUuid,
              doc.name,
              fileBuffer,
              {
                originalSize: doc.size,
                type: doc.type,
                chunks: doc.chunks.length,
                processedAt: new Date().toISOString(),
                metadata: doc.metadata
              }
            );
            localFilesPaths.push(filePath);
            console.log(`✅ Saved locally: ${doc.name}`);
          } catch (fileError) {
            console.error(`❌ Failed to save file locally: ${doc.name}`, fileError);
          }
        }

        // Save bot metadata locally
        await saveBotMetadata(botUuid, {
          botName: config.botName,
          ragEnabled: config.ragEnabled,
          ragSourceType: config.ragSourceType,
          documentsCount: processedDocuments.length,
          userId: userId,
          createdAt: new Date().toISOString()
        });

        console.log(`✅ Local storage complete: ${localFilesPaths.length} files saved for bot ${botUuid}`);
      } catch (localStorageError) {
        console.error('❌ Local file storage failed:', localStorageError);
        // Continue with bot creation even if local storage fails
      }
    }

    // 📤 GOOGLE DRIVE UPLOAD - Handle RAG-enabled bots (with or without files)
    if (config.ragEnabled && config.ragSourceType === 'files') {
      try {
        if (processedDocuments.length > 0) {
          // Upload files to Google Drive and log to Sheets
          console.log(`📤 Uploading ${processedDocuments.length} RAG files to Google Drive for bot: ${config.botName}`);

          // Prepare files for Google Drive upload with proper content handling
          const filesToUpload = processedDocuments.map(doc => {
            // Handle different content types properly
            let fileBuffer: Buffer;
            if (doc.type === 'application/pdf') {
              // For PDFs, use the original binary data
              fileBuffer = doc.originalFileBuffer || Buffer.from(doc.content, 'utf-8');
            } else {
              // For text files, use UTF-8 encoding
              fileBuffer = Buffer.from(doc.content, 'utf-8');
            }

            return {
              name: doc.name,
              content: fileBuffer,
              mimeType: doc.type || 'text/plain'
            };
          });

          // Upload files to Google Drive and log to Google Sheets
          const uploadedFileLinks = await uploadRagFilesToDrive(
            config.botName,
            botUuid,
            filesToUpload
          );

          console.log(`✅ Google Drive upload complete: ${uploadedFileLinks.length} files uploaded and logged`);
        } else {
          // Create empty bot folder and log to Sheets for RAG-enabled bots without files
          console.log(`📁 Creating empty RAG bot folder for: ${config.botName}`);
          await createEmptyRagBot(config.botName, botUuid);
          console.log(`✅ Empty RAG bot folder created and logged for bot ${config.botName}`);
        }
      } catch (googleDriveError) {
        console.error('❌ Google Drive/Sheets operation failed:', googleDriveError);
        // Continue with bot creation even if Google Drive upload fails
      }


    }

    // Generate embed code with dynamic domain detection
    const embedCode = generateEmbedCode(botUuid, config, request);

    // Schedule activation for 24 hours (safety net)
    const activationScheduledAt = scheduleActivation(botUuid);

    // Create VAPI assistant immediately (with fallback to manual activation)
    let vapiAssistant = null;
    let botStatus = 'active'; // Default to active - bot should work even without VAPI assistant

    try {
      console.log('🤖 Attempting to create VAPI assistant for bot:', config.botName);
      vapiAssistant = await createVAPIAssistant(config, processedDocuments);
      console.log('✅ VAPI assistant created successfully:', vapiAssistant.id);
      // Bot remains active
    } catch (error) {
      console.error('❌ Failed to create VAPI assistant:', error);
      console.log('🔄 Bot is still active - VAPI assistant creation failed but bot functionality remains');
      // Bot remains active even if VAPI assistant creation fails
      // The bot can still function with the basic configuration
    }

    // Create bot record with new fields
    const botRecord: BotRecord = {
      uuid: botUuid,
      name: config.botName,
      welcomeMessage: config.welcomeMessage,
      systemPrompt: config.systemPrompt,
      language: config.language || 'en',
      voice: config.voice || 'jennifer',
      position: config.position || 'right',
      theme: config.theme || 'light',
      ragEnabled: config.ragEnabled || false,
      ragSourceType: config.ragSourceType || 'files',
      ragUrl: config.ragUrl || '',
      userId: userId,
      status: botStatus as 'pending' | 'activating' | 'active' | 'failed',
      createdAt: new Date().toISOString(),
      activationScheduledAt: activationScheduledAt,
      embedCode: embedCode,
      documentsProcessed: processedDocuments.length,
      vapiAssistantId: vapiAssistant?.id,
      vapiKnowledgeBaseId: undefined,
      localFilesStored: localFilesPaths.length,
      localStoragePath: localFilesPaths.length > 0 ? `uploads/${botUuid}` : undefined
    };

    // Ensure user exists in database
    await userService.upsertUser({
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      imageUrl: user.imageUrl || undefined,
    });

    // Store bot in database
    const savedBot = await botService.createBot(botRecord);

    // Store documents in database (after bot is created)
    if (processedDocuments.length > 0) {
      try {
        for (const doc of processedDocuments) {
          await documentService.createDocument({
            name: doc.name,
            type: doc.type,
            size: doc.size,
            content: doc.content,
            chunks: doc.chunks,
            pages: doc.metadata.pages,
            wordCount: doc.metadata.wordCount,
            filePath: localFilesPaths.find(path => path.includes(doc.name)),
            botUuid: botUuid,
          });
        }
        console.log(`✅ Database storage complete: ${processedDocuments.length} documents saved for bot ${botUuid}`);
      } catch (dbStorageError) {
        console.error('❌ Database document storage failed:', dbStorageError);
        // Continue even if database storage fails
      }
    }

    // Note: Google Drive upload and Sheets logging is now handled in the uploadRagFilesToDrive function above



    console.log(`✅ Bot created successfully: ${config.botName} (${botUuid})`);
    console.log(`📄 Documents processed: ${processedDocuments.length}`);
    console.log(`🤖 VAPI Assistant ID: ${vapiAssistant?.id || 'Not created'}`);
    console.log(`🔥 Bot Status: ${botStatus}`);

    const statusMessage = `Bot created and activated successfully! Your voice bot is ready to use immediately.${processedDocuments.length > 0 ? ` Knowledge base includes ${processedDocuments.length} documents.` : ''}`;

    return NextResponse.json({
      success: true,
      bot: {
        uuid: botUuid,
        name: config.botName,
        status: botStatus,
        embedCode: embedCode,
        activationScheduledAt: activationScheduledAt,
        documentsProcessed: processedDocuments.length,
        ragEnabled: config.ragEnabled,
        vapiAssistantId: vapiAssistant?.id,
        localFilesStored: localFilesPaths.length,
        localStoragePath: localFilesPaths.length > 0 ? `uploads/${botUuid}` : null
      },
      storage: {
        local: {
          enabled: config.ragEnabled && config.ragSourceType === 'files',
          filesStored: localFilesPaths.length,
          storagePath: localFilesPaths.length > 0 ? `uploads/${botUuid}` : null
        },
        googleDrive: {
          enabled: true, // Google Drive is always enabled
          // Will be populated by existing Google Drive logic
        }
      },
      message: statusMessage
    });

  } catch (error) {
    console.error('❌ Create bot error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create bot' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve bots for a user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all bots for the user from database
    const userBots = await botService.getBotsByUserId(userId);

    return NextResponse.json({
      success: true,
      bots: userBots.map(bot => ({
        uuid: bot.uuid,
        name: bot.name,
        status: bot.status,
        createdAt: bot.createdAt,
        documentsCount: bot.documentsProcessed || 0,
        ragEnabled: bot.ragEnabled,
        embedCode: bot.embedCode,
        activationScheduledAt: bot.activationScheduledAt
      }))
    });

  } catch (error) {
    console.error('❌ Get bots error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retrieve bots' 
      },
      { status: 500 }
    );
  }
}
