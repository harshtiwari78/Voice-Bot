import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  listBotFiles,
  getFileFromBot,
  getBotMetadata,
  verifyBotAccess,
  saveFileToBot
} from '@/lib/localFileStorage';
import { addFilesToExistingRagBot } from '@/lib/googleService';
import { documentService } from '@/lib/services/documentService';
import { botService } from '@/lib/services/botService';

// In-memory bot registry (same as in create route)
declare global {
  var botRegistry: Map<string, any>;
}

if (!global.botRegistry) {
  global.botRegistry = new Map();
}

const botRegistry = global.botRegistry;

// GET /api/bots/[uuid]/files - List files for a bot
export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const botUuid = params.uuid;

    // Verify bot access
    const botRecord = botRegistry.get(botUuid);
    if (!verifyBotAccess(botUuid, userId, botRecord)) {
      return NextResponse.json(
        { success: false, error: 'Bot not found or access denied' },
        { status: 404 }
      );
    }

    // List files for the bot
    const files = await listBotFiles(botUuid);
    const botMetadata = await getBotMetadata(botUuid);

    return NextResponse.json({
      success: true,
      botUuid,
      files: files.map(fileName => ({
        name: fileName,
        downloadUrl: `/api/bots/${botUuid}/files/${encodeURIComponent(fileName)}`
      })),
      metadata: botMetadata,
      totalFiles: files.length
    });

  } catch (error) {
    console.error('❌ Error listing bot files:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to list files' 
      },
      { status: 500 }
    );
  }
}

// POST /api/bots/[uuid]/files - Upload additional files to a bot (future feature)
export async function POST(
  request: NextRequest,
  { params }: { params: { uuid: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const botUuid = params.uuid;

    // Verify bot access
    const botRecord = botRegistry.get(botUuid);
    if (!verifyBotAccess(botUuid, userId, botRecord)) {
      return NextResponse.json(
        { success: false, error: 'Bot not found or access denied' },
        { status: 404 }
      );
    }

    // Check if bot is RAG-enabled
    const bot = await botService.getBotByUuid(botUuid);
    if (!bot || !bot.ragEnabled) {
      return NextResponse.json(
        { success: false, error: 'Bot not found or RAG not enabled' },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const fileEntries = Array.from(formData.entries()).filter(([key]) => key.startsWith('file_'));

    if (fileEntries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    // Process uploaded files
    const processedDocuments: any[] = [];
    const localFilesPaths: string[] = [];

    for (const [, file] of fileEntries) {
      if (file instanceof File) {
        try {
          let content: string;
          let originalFileBuffer: Buffer;

          // Handle different file types properly
          if (file.type === 'application/pdf') {
            // For PDFs, preserve the original binary data
            const arrayBuffer = await file.arrayBuffer();
            originalFileBuffer = Buffer.from(arrayBuffer);

            // For RAG processing, we'll use a placeholder text
            content = `[PDF Document: ${file.name}]\nThis is a PDF file that requires specialized parsing for text extraction. The original binary content is preserved for download and viewing.`;
          } else {
            // For text files, convert to text as usual
            content = await file.text();
            originalFileBuffer = Buffer.from(content, 'utf-8');
          }

          // Simple text chunking
          const chunks = content
            .split(/\n\s*\n/)
            .filter(chunk => chunk.trim().length > 0)
            .map(chunk => chunk.trim());

          const processedDoc = {
            name: file.name,
            type: file.type,
            size: file.size,
            content,
            chunks,
            originalFileBuffer,
            metadata: {
              wordCount: content.split(/\s+/).length,
              processedAt: new Date().toISOString()
            }
          };

          processedDocuments.push(processedDoc);

          // Save file locally - use original binary data for PDFs
          const fileBuffer = file.type === 'application/pdf' && originalFileBuffer
            ? originalFileBuffer
            : Buffer.from(content, 'utf-8');
          const filePath = await saveFileToBot(
            botUuid,
            file.name,
            fileBuffer,
            {
              originalSize: file.size,
              type: file.type,
              chunks: chunks.length,
              processedAt: new Date().toISOString(),
              metadata: processedDoc.metadata
            }
          );
          localFilesPaths.push(filePath);

          console.log(`✅ Processed and saved locally: ${file.name}`);
        } catch (error) {
          console.error(`❌ Error processing file ${file.name}:`, error);
        }
      }
    }

    if (processedDocuments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files could be processed' },
        { status: 400 }
      );
    }

    // Upload to Google Drive and log to Sheets
    try {
      const filesToUpload = processedDocuments.map(doc => ({
        name: doc.name,
        content: doc.type === 'application/pdf' && doc.originalFileBuffer
          ? doc.originalFileBuffer
          : Buffer.from(doc.content, 'utf-8'),
        mimeType: doc.type || 'text/plain'
      }));

      const uploadedFileLinks = await addFilesToExistingRagBot(
        bot.name,
        botUuid,
        filesToUpload
      );

      console.log(`✅ Google Drive upload complete: ${uploadedFileLinks.length} files uploaded`);
    } catch (driveError) {
      console.error('❌ Google Drive upload failed:', driveError);
      // Continue even if Drive upload fails
    }

    // Store documents in database
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
      console.log(`✅ Database storage complete: ${processedDocuments.length} documents saved`);
    } catch (dbError) {
      console.error('❌ Database document storage failed:', dbError);
      // Continue even if database storage fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${processedDocuments.length} files to bot`,
      filesUploaded: processedDocuments.length,
      files: processedDocuments.map(doc => ({
        name: doc.name,
        size: doc.size,
        type: doc.type,
        chunks: doc.chunks.length
      }))
    });

  } catch (error) {
    console.error('❌ Error uploading files to bot:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to upload files' 
      },
      { status: 500 }
    );
  }
}
