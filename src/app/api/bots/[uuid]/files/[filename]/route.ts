import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  getFileFromBot, 
  verifyBotAccess 
} from '@/lib/localFileStorage';

// In-memory bot registry (same as in create route)
declare global {
  var botRegistry: Map<string, any>;
}

if (!global.botRegistry) {
  global.botRegistry = new Map();
}

const botRegistry = global.botRegistry;

// GET /api/bots/[uuid]/files/[filename] - Download a specific file
export async function GET(
  request: NextRequest,
  { params }: { params: { uuid: string; filename: string } }
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
    const filename = decodeURIComponent(params.filename);

    // Verify bot access
    const botRecord = botRegistry.get(botUuid);
    if (!verifyBotAccess(botUuid, userId, botRecord)) {
      return NextResponse.json(
        { success: false, error: 'Bot not found or access denied' },
        { status: 404 }
      );
    }

    // Get the file
    const fileContent = await getFileFromBot(botUuid, filename);

    // Determine content type based on file extension
    const getContentType = (filename: string): string => {
      const ext = filename.toLowerCase().split('.').pop();
      switch (ext) {
        case 'txt':
          return 'text/plain';
        case 'pdf':
          return 'application/pdf';
        case 'json':
          return 'application/json';
        case 'csv':
          return 'text/csv';
        case 'md':
          return 'text/markdown';
        default:
          return 'application/octet-stream';
      }
    };

    const contentType = getContentType(filename);

    // Return the file with appropriate headers
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
        'X-Bot-UUID': botUuid,
        'X-File-Name': filename
      }
    });

  } catch (error) {
    console.error('❌ Error downloading file:', error);
    
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      );
    }

    if (error instanceof Error && error.message.includes('security violation')) {
      return NextResponse.json(
        { success: false, error: 'Access denied - security violation' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to download file' 
      },
      { status: 500 }
    );
  }
}
