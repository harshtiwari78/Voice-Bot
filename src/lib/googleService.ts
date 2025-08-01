import { google } from 'googleapis';

// Google Service Account Credentials - Updated for VAPI Upload Bot
const credentials = {
  type: "service_account",
  project_id: "voicebot-467308",
  private_key_id: "0a7a27777ff75c5d21ff138f8b01fc986fad6175",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCnCHlvuAN2jDYz\nQC9QdVoxoyy+BUasgLpxw6M9ln+zCxJV0iv91f22hMeKKx5Cww7mJn+kms++D5Mq\nrZbKXUjraQk39R+jqweVniZQlt5nP9yryBQHV+2gOBblShDLGxJxj797VYW9SoeM\nERreH1+Mt5e7QDGlfjEohU9UcyF02v7OSoCr+Q8ZlP8IYwaDqYyY7lyBALJ3fU6G\ngL+Iasgdic2R6OU0jYvM70aaE8Lus3PqkIFAc6tzwn2kRxb6aui/8MIivN1zkuP2\nNb0MLEQOEV1mUnMXHpK5kID0Un79lW2H4pKsSVPVjjvNOLPAeXeHL2voYnI31dAD\nxpdo9VWHAgMBAAECggEABHQSDiEmhnyf3VHyxlRlU+Qj3JUgw0H+C+vJaGpLe/yU\nP+bbTBND28qX1LPoRKNqvEbT1GcERERUtNNCrUvmFntgcYt+4nWRkt2lQTTPN+Au\nBAPQ9OPVRBZQFfZEPbC6bH4GqZp9dwSLr00CyF/8bjC0QkZ94bRcSdZJZ9kB+q7o\n81NqXg4HQjUxOIeojtbhQBDFDy3ljAtr7tiHWK9scSrXzBS4VaoEJJ9C9cKTT1u5\naZOcZh7H2mBcCAdtXG7ItGKZJW//JB8kopjqQuj9ByIEc/PprHeTdXUNvsnKlx+o\naccem1HyMnflRufOXBH+hQDiZFzu7SeB/Il0F1hs0QKBgQDsDbG2XglwVc0oBb9k\nnyZH56wkPJBeBdsA7aJG7wC4dOUjkSktzpHXnMiC+Qw3ghroDzEpq4/4dImhIgyq\nplxTD4fWdiZBhR5Mnnl8e8pFD6/B27VTDxAfcDGt/Hshij9Py7NJX0tfof1UK4LZ\n+WM1QhhgWkuHfvosAkpD1xBHjQKBgQC1JbtpS6GuKZZOTy7zFVVyXMTWsyg9G9VK\noLZ+rCb9gLPCeyeURxE4V+TMdxkqDeWxRTKDktxgr0t1BDZQBhfLbuA/X9h0EE5j\nUjvh2N4+qJG5JAEAVHLeYTmhRqIgd2b70+PTo3LwVNvbZyS4GUaFOY3nVMHAtcQ6\nOEOulNjSYwKBgQC7lz5tgVna7jT142twmZGgfxosSf0o21pp6G+YE4PtEuiuVUP2\nZT09rhkjDKyKyFh9puUZCoCFoIdniFmsnDyuvZ7j7k0EsLediCtfpDjgnVC9rM7y\nzPuxIEY60HVB+E3MKkO2wYZy35ck9tcsRqZywq4AlIGFkoFZzBAczaLgWQKBgQCz\nJW6zko2B/TTdmye2VRnc8Ovl3OZlkNoeZNQ2cDBbMmYUZtFcre/Uxe/LWdl0IqxO\n5T0wrBPwNkwsnI7OE0iC8tMpObOKDPpI9XGtSFl6pCEBdR7cYaf8TzC8U2tRKmSZ\nlhLRIeswzOtljxrcSnrYlHPHHKZE3D4EydH9nMzVOwKBgGGkxAg/m9b8mdiAQsTq\nGyx68TNCWPndHh74MBD9GFpEzg9Me+Kp1rVcz9rsKYrNPTyccBZ50WwxcB/RN5PS\nuFAEdIEhBGeaLc2FiC9EAvt1QmSE3/9X3+xlToLjFblRdXhZmJrfYRecxB+U94t9\ncxMuSQkP3tBV6P/Kd9jsvwcV\n-----END PRIVATE KEY-----\n",
  client_email: "vapi-upload-bot-sa@voicebot-467308.iam.gserviceaccount.com",
  client_id: "114544580755516101360",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/vapi-upload-bot-sa%40voicebot-467308.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Google Sheets and Drive configuration - Updated for VAPI Upload Bot
const GOOGLE_SHEET_ID = '179OqF9MhrKg9hPI9a8UQ-0Rd7yVcZBFU_R7HhvXNHw0';
const GOOGLE_DRIVE_FOLDER_ID = '1XoQfoL6-PwKdqoV-aeKIEyM4xcw8jKfn';
const GOOGLE_SHARED_DRIVE_ID = process.env.GOOGLE_SHARED_DRIVE_ID;

// Initialize Google Auth
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive',
  ],
});

// Initialize Google Services
const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Interface for bot metadata (4 columns: Bot Name, Bot ID, File Link, Upload Date)
interface BotMetadata {
  botName: string;
  botId: string;
  fileLink: string;
  uploadDate: string;
}

// Save bot metadata to Google Sheets (4 columns)
export async function saveBotMetadataToSheets(metadata: BotMetadata): Promise<void> {
  try {
    console.log('📊 Saving bot metadata to Google Sheets...');

    const values = [
      [
        metadata.botName,
        metadata.botId,
        metadata.fileLink,
        metadata.uploadDate
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'VAPI Upload Logs!A:D',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    console.log('✅ Bot metadata saved to Google Sheets successfully');
  } catch (error) {
    console.error('❌ Error saving to Google Sheets:', error);
    throw error;
  }
}

// Create folder in Google Drive for bot files (supports both regular and shared drives)
export async function createBotFolder(botName: string): Promise<string> {
  try {
    console.log('📁 Creating Google Drive folder for bot...');

    const folderMetadata = {
      name: `${botName} - ${new Date().toISOString().split('T')[0]}`,
      parents: GOOGLE_SHARED_DRIVE_ID ? [GOOGLE_SHARED_DRIVE_ID] : [GOOGLE_DRIVE_FOLDER_ID],
      mimeType: 'application/vnd.google-apps.folder',
    };

    const requestOptions: any = {
      requestBody: folderMetadata,
      fields: 'id',
    };

    // If using shared drive, add supportsAllDrives parameter
    if (GOOGLE_SHARED_DRIVE_ID) {
      requestOptions.supportsAllDrives = true;
    }

    const folder = await drive.files.create(requestOptions);

    const folderId = folder.data.id!;
    const folderLink = `https://drive.google.com/drive/folders/${folderId}`;

    console.log('✅ Google Drive folder created:', folderLink);
    return folderLink;
  } catch (error) {
    console.error('❌ Error creating Google Drive folder:', error);
    throw error;
  }
}

// Upload file to Google Drive (supports both regular and shared drives)
export async function uploadFileToGoogleDrive(
  fileName: string,
  fileContent: Buffer,
  mimeType: string,
  driveFolderId: string
): Promise<string> {
  try {
    console.log(`📤 Uploading file to Google Drive: ${fileName} (${fileContent.length} bytes)`);

    const fileMetadata = {
      name: fileName,
      parents: [driveFolderId],
    };

    // Convert Buffer to Readable stream for Google Drive API
    const { Readable } = require('stream');
    const fileBuffer = Buffer.isBuffer(fileContent) ? fileContent : Buffer.from(fileContent);

    // Create a readable stream from the buffer
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null); // End the stream

    const media = {
      mimeType,
      body: stream,
    };

    const requestOptions: any = {
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, size, webViewLink',
    };

    // If using shared drive, add supportsAllDrives parameter
    if (GOOGLE_SHARED_DRIVE_ID) {
      requestOptions.supportsAllDrives = true;
    }

    const file = await drive.files.create(requestOptions);

    const fileId = file.data.id!;
    const fileLink = `https://drive.google.com/file/d/${fileId}/view`;

    console.log(`✅ File uploaded to Google Drive: ${fileName} (ID: ${fileId})`);
    console.log(`📎 File link: ${fileLink}`);
    return fileLink;
  } catch (error) {
    console.error(`❌ Error uploading file ${fileName} to Google Drive:`, error);
    throw error;
  }
}

// Extract folder ID from Google Drive link
export function extractFolderIdFromLink(driveLink: string): string {
  const match = driveLink.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : '';
}

// Create a shared drive (requires domain admin privileges)
export async function createSharedDrive(name: string): Promise<string> {
  try {
    console.log(`📁 Creating shared drive: ${name}`);

    const driveMetadata = {
      name: name,
    };

    const sharedDrive = await drive.drives.create({
      requestId: `shared-drive-${Date.now()}`, // Unique request ID
      requestBody: driveMetadata,
    });

    const driveId = sharedDrive.data.id!;
    console.log(`✅ Shared drive created: ${name} (ID: ${driveId})`);
    return driveId;
  } catch (error) {
    console.error('❌ Error creating shared drive:', error);
    throw error;
  }
}

// Check if shared drive is configured and accessible
export async function checkSharedDriveAccess(): Promise<boolean> {
  try {
    if (!GOOGLE_SHARED_DRIVE_ID) {
      console.log('ℹ️ No shared drive configured');
      return false;
    }

    const sharedDrive = await drive.drives.get({
      driveId: GOOGLE_SHARED_DRIVE_ID,
    });

    console.log(`✅ Shared drive accessible: ${sharedDrive.data.name}`);
    return true;
  } catch (error) {
    console.error('❌ Shared drive not accessible:', error);
    return false;
  }
}

// Set up Google Sheets headers (run once to initialize)
export async function setupSheetsHeaders(): Promise<void> {
  try {
    console.log('📊 Setting up Google Sheets headers...');

    const headers = [
      ['Bot Name', 'Bot ID', 'File Link', 'Upload Date']
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'VAPI Upload Logs!A1:D1',
      valueInputOption: 'RAW',
      requestBody: {
        values: headers,
      },
    });

    console.log('✅ Google Sheets headers set up successfully');
  } catch (error) {
    console.error('❌ Error setting up Google Sheets headers:', error);
    throw error;
  }
}

// Create empty RAG bot folder and log to Sheets (for RAG-enabled bots without initial files)
export async function createEmptyRagBot(
  botName: string,
  botId: string
): Promise<string> {
  try {
    console.log(`📁 Creating empty RAG bot folder for: ${botName}`);

    // Create a bot-specific folder in Google Drive
    const botFolderLink = await createBotFolder(botName);
    const uploadDate = new Date().toISOString();

    // Log to Google Sheets with "No files uploaded" status
    await saveBotMetadataToSheets({
      botName,
      botId,
      fileLink: 'No files uploaded yet',
      uploadDate
    });

    console.log(`✅ Empty RAG bot folder created and logged: ${botFolderLink}`);
    return botFolderLink;

  } catch (error) {
    console.error('❌ Error creating empty RAG bot:', error);
    throw error;
  }
}

// Upload RAG files to Google Drive and log to Sheets
export async function uploadRagFilesToDrive(
  botName: string,
  botId: string,
  files: { name: string; content: Buffer; mimeType: string }[]
): Promise<string[]> {
  try {
    console.log(`📤 Uploading ${files.length} RAG files for bot: ${botName}`);

    // Create a bot-specific folder in Google Drive
    console.log(`📁 Creating bot folder: ${botName}`);
    const botFolderLink = await createBotFolder(botName);
    const botFolderId = extractFolderIdFromLink(botFolderLink);

    const uploadedFileLinks: string[] = [];
    const uploadDate = new Date().toISOString();

    for (const file of files) {
      // Upload file to the bot-specific folder
      console.log(`📤 Uploading file: ${file.name} to bot folder`);
      const fileLink = await uploadFileToGoogleDrive(
        file.name,
        file.content,
        file.mimeType,
        botFolderId
      );

      uploadedFileLinks.push(fileLink);

      // Log each file to Google Sheets
      await saveBotMetadataToSheets({
        botName,
        botId,
        fileLink,
        uploadDate
      });

      console.log(`✅ Uploaded and logged: ${file.name}`);
    }

    console.log(`✅ All ${files.length} RAG files uploaded to bot folder and logged successfully`);
    console.log(`📁 Bot folder: ${botFolderLink}`);
    return uploadedFileLinks;

  } catch (error) {
    console.error('❌ Error uploading RAG files:', error);
    throw error;
  }
}

// Add files to existing RAG bot folder
export async function addFilesToExistingRagBot(
  botName: string,
  botId: string,
  files: { name: string; content: Buffer; mimeType: string }[],
  existingFolderLink?: string
): Promise<string[]> {
  try {
    console.log(`📤 Adding ${files.length} files to existing RAG bot: ${botName}`);

    let botFolderId: string;

    if (existingFolderLink) {
      // Use existing folder
      botFolderId = extractFolderIdFromLink(existingFolderLink);
      console.log(`📁 Using existing bot folder: ${existingFolderLink}`);
    } else {
      // Create new folder if none exists
      console.log(`📁 Creating new bot folder: ${botName}`);
      const botFolderLink = await createBotFolder(botName);
      botFolderId = extractFolderIdFromLink(botFolderLink);
    }

    const uploadedFileLinks: string[] = [];
    const uploadDate = new Date().toISOString();

    for (const file of files) {
      // Upload file to the bot-specific folder
      console.log(`📤 Uploading file: ${file.name} to bot folder`);
      const fileLink = await uploadFileToGoogleDrive(
        file.name,
        file.content,
        file.mimeType,
        botFolderId
      );

      uploadedFileLinks.push(fileLink);

      // Log each file to Google Sheets
      await saveBotMetadataToSheets({
        botName,
        botId,
        fileLink,
        uploadDate
      });

      console.log(`✅ Uploaded and logged: ${file.name}`);
    }

    console.log(`✅ All ${files.length} files added to existing RAG bot and logged successfully`);
    return uploadedFileLinks;

  } catch (error) {
    console.error('❌ Error adding files to existing RAG bot:', error);
    throw error;
  }
}
