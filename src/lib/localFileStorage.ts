import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Base uploads directory - outside of public folder for security
const UPLOADS_BASE_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists and is secure
export async function initializeUploadsDirectory(): Promise<void> {
  try {
    // Create uploads directory if it doesn't exist
    await mkdir(UPLOADS_BASE_DIR, { recursive: true });
    
    // Create .gitignore to prevent uploads from being committed
    const gitignorePath = path.join(UPLOADS_BASE_DIR, '.gitignore');
    const gitignoreContent = `# Ignore all uploaded files for security
*
!.gitignore
!README.md
`;
    
    try {
      await writeFile(gitignorePath, gitignoreContent);
    } catch (error) {
      // File might already exist, that's okay
    }
    
    // Create README for documentation
    const readmePath = path.join(UPLOADS_BASE_DIR, 'README.md');
    const readmeContent = `# Uploads Directory

This directory contains uploaded files for RAG-enabled voice bots.

## Security Notes:
- This directory is NOT publicly accessible via web server
- Files are organized by bot UUID for security and organization
- Only authorized backend processes can access these files
- All files are ignored by git for security

## Structure:
\`\`\`
uploads/
├── bot-uuid-1/
│   ├── document1.txt
│   ├── document2.pdf
│   └── metadata.json
├── bot-uuid-2/
│   └── ...
└── README.md
\`\`\`

## Access Control:
- Files can only be accessed through authorized API endpoints
- User authentication is required for file operations
- Bot ownership is verified before file access
`;
    
    try {
      await writeFile(readmePath, readmeContent);
    } catch (error) {
      // File might already exist, that's okay
    }
    
    console.log('✅ Local uploads directory initialized:', UPLOADS_BASE_DIR);
  } catch (error) {
    console.error('❌ Failed to initialize uploads directory:', error);
    throw error;
  }
}

// Create bot-specific directory
export async function createBotDirectory(botUuid: string): Promise<string> {
  const botDir = path.join(UPLOADS_BASE_DIR, botUuid);
  
  try {
    await mkdir(botDir, { recursive: true });
    console.log(`📁 Created bot directory: ${botDir}`);
    return botDir;
  } catch (error) {
    console.error(`❌ Failed to create bot directory for ${botUuid}:`, error);
    throw error;
  }
}

// Save file to bot directory
export async function saveFileToBot(
  botUuid: string, 
  fileName: string, 
  fileContent: Buffer | string,
  metadata?: any
): Promise<string> {
  try {
    // Ensure bot directory exists
    const botDir = await createBotDirectory(botUuid);
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFileName = path.basename(fileName);
    const filePath = path.join(botDir, sanitizedFileName);
    
    // Save the file
    await writeFile(filePath, fileContent);
    
    // Save metadata if provided
    if (metadata) {
      const metadataPath = path.join(botDir, `${sanitizedFileName}.metadata.json`);
      await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }
    
    console.log(`✅ File saved locally: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error(`❌ Failed to save file ${fileName} for bot ${botUuid}:`, error);
    throw error;
  }
}

// Save bot metadata
export async function saveBotMetadata(botUuid: string, metadata: any): Promise<void> {
  try {
    const botDir = await createBotDirectory(botUuid);
    const metadataPath = path.join(botDir, 'bot-metadata.json');
    
    const botMetadata = {
      ...metadata,
      savedAt: new Date().toISOString(),
      botUuid
    };
    
    await writeFile(metadataPath, JSON.stringify(botMetadata, null, 2));
    console.log(`✅ Bot metadata saved: ${metadataPath}`);
  } catch (error) {
    console.error(`❌ Failed to save bot metadata for ${botUuid}:`, error);
    throw error;
  }
}

// Get file from bot directory
export async function getFileFromBot(botUuid: string, fileName: string): Promise<Buffer> {
  try {
    const sanitizedFileName = path.basename(fileName);
    const filePath = path.join(UPLOADS_BASE_DIR, botUuid, sanitizedFileName);
    
    // Check if file exists and is within bot directory (security check)
    const resolvedPath = path.resolve(filePath);
    const expectedBasePath = path.resolve(path.join(UPLOADS_BASE_DIR, botUuid));
    
    if (!resolvedPath.startsWith(expectedBasePath)) {
      throw new Error('Invalid file path - security violation');
    }
    
    const fileContent = await readFile(filePath);
    console.log(`✅ File retrieved: ${filePath}`);
    return fileContent;
  } catch (error) {
    console.error(`❌ Failed to get file ${fileName} for bot ${botUuid}:`, error);
    throw error;
  }
}

// List files for a bot
export async function listBotFiles(botUuid: string): Promise<string[]> {
  try {
    const botDir = path.join(UPLOADS_BASE_DIR, botUuid);
    
    // Check if directory exists
    try {
      await stat(botDir);
    } catch (error) {
      return []; // Directory doesn't exist, return empty array
    }
    
    const files = await readdir(botDir);
    
    // Filter out metadata files and system files
    const userFiles = files.filter(file => 
      !file.endsWith('.metadata.json') && 
      !file.startsWith('.') && 
      file !== 'bot-metadata.json'
    );
    
    console.log(`📋 Found ${userFiles.length} files for bot ${botUuid}`);
    return userFiles;
  } catch (error) {
    console.error(`❌ Failed to list files for bot ${botUuid}:`, error);
    throw error;
  }
}

// Get bot metadata
export async function getBotMetadata(botUuid: string): Promise<any> {
  try {
    const metadataPath = path.join(UPLOADS_BASE_DIR, botUuid, 'bot-metadata.json');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    return JSON.parse(metadataContent);
  } catch (error) {
    console.error(`❌ Failed to get bot metadata for ${botUuid}:`, error);
    return null;
  }
}

// Verify bot ownership (security function)
export function verifyBotAccess(botUuid: string, userId: string, botRecord?: any): boolean {
  try {
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(botUuid)) {
      console.error('❌ Invalid bot UUID format');
      return false;
    }
    
    // If bot record is provided, verify ownership
    if (botRecord && botRecord.userId !== userId) {
      console.error('❌ Bot ownership verification failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Bot access verification failed:', error);
    return false;
  }
}

// Get uploads directory info (for admin purposes)
export async function getUploadsInfo(): Promise<{
  totalBots: number;
  totalFiles: number;
  totalSize: number;
  botsWithFiles: string[];
}> {
  try {
    const botDirs = await readdir(UPLOADS_BASE_DIR);
    const botUuids = botDirs.filter(dir =>
      dir !== '.gitignore' &&
      dir !== 'README.md' &&
      !dir.startsWith('.')
    );

    let totalFiles = 0;
    let totalSize = 0;
    const botsWithFiles: string[] = [];

    for (const botUuid of botUuids) {
      try {
        const files = await listBotFiles(botUuid);
        if (files.length > 0) {
          botsWithFiles.push(botUuid);
          totalFiles += files.length;

          // Calculate total size
          for (const file of files) {
            const filePath = path.join(UPLOADS_BASE_DIR, botUuid, file);
            const fileStat = await stat(filePath);
            totalSize += fileStat.size;
          }
        }
      } catch (error) {
        // Skip problematic directories
        continue;
      }
    }

    return {
      totalBots: botUuids.length,
      totalFiles,
      totalSize,
      botsWithFiles
    };
  } catch (error) {
    console.error('❌ Failed to get uploads info:', error);
    throw error;
  }
}

// Get uploads directory info filtered by user's bots (for user analytics)
export async function getUserUploadsInfo(userBotUuids: string[]): Promise<{
  totalBots: number;
  totalFiles: number;
  totalSize: number;
  botsWithFiles: string[];
}> {
  try {
    // If user has no bots, return empty stats
    if (!userBotUuids || userBotUuids.length === 0) {
      return {
        totalBots: 0,
        totalFiles: 0,
        totalSize: 0,
        botsWithFiles: []
      };
    }

    let totalFiles = 0;
    let totalSize = 0;
    const botsWithFiles: string[] = [];

    // Only check directories for user's bots
    for (const botUuid of userBotUuids) {
      try {
        const files = await listBotFiles(botUuid);
        if (files.length > 0) {
          botsWithFiles.push(botUuid);
          totalFiles += files.length;

          // Calculate total size
          for (const file of files) {
            const filePath = path.join(UPLOADS_BASE_DIR, botUuid, file);
            const fileStat = await stat(filePath);
            totalSize += fileStat.size;
          }
        }
      } catch (error) {
        // Skip problematic directories (bot might not have files)
        console.warn(`⚠️ Could not access files for bot ${botUuid}:`, error);
        continue;
      }
    }

    console.log(`📊 User file storage: ${totalFiles} files across ${botsWithFiles.length}/${userBotUuids.length} bots`);

    return {
      totalBots: userBotUuids.length,
      totalFiles,
      totalSize,
      botsWithFiles
    };
  } catch (error) {
    console.error('❌ Failed to get user uploads info:', error);
    throw error;
  }
}
