import { NextRequest, NextResponse } from 'next/server';
import { createSharedDrive, checkSharedDriveAccess, uploadFileToGoogleDrive, createBotFolder, extractFolderIdFromLink } from '@/lib/googleService';

export async function GET() {
  try {
    console.log('🔧 Setting up shared drive for VAPI file uploads...');
    
    // Check if shared drive is already configured
    const hasAccess = await checkSharedDriveAccess();
    
    if (hasAccess) {
      console.log('✅ Shared drive already configured and accessible');
      
      // Test file upload to shared drive
      const testBotName = 'Test Shared Drive Upload - ' + new Date().toLocaleString();
      console.log(`📁 Creating test folder: ${testBotName}`);
      const folderLink = await createBotFolder(testBotName);
      const folderId = extractFolderIdFromLink(folderLink);
      
      // Create a test file
      const testContent = 'This is a test file for shared drive upload.\n\nIt verifies that the service account can upload files to the shared drive.';
      const testBuffer = Buffer.from(testContent, 'utf-8');
      
      console.log(`📤 Uploading test file to shared drive folder: ${folderId}`);
      const fileLink = await uploadFileToGoogleDrive(
        'shared-drive-test.txt',
        testBuffer,
        'text/plain',
        folderId
      );
      
      return NextResponse.json({
        success: true,
        message: 'Shared drive is configured and working!',
        folderLink: folderLink,
        fileLink: fileLink,
        testContent: testContent
      });
    }
    
    // Try to create a shared drive (this requires domain admin privileges)
    try {
      const sharedDriveName = 'VAPI Bot Files';
      const driveId = await createSharedDrive(sharedDriveName);
      
      return NextResponse.json({
        success: true,
        message: 'Shared drive created successfully!',
        driveId: driveId,
        instructions: [
          '1. Add this drive ID to your .env.local file as GOOGLE_SHARED_DRIVE_ID=' + driveId,
          '2. Make sure the service account has access to the shared drive',
          '3. Test the setup by running this endpoint again'
        ]
      });
    } catch (createError: any) {
      // If we can't create a shared drive, provide manual setup instructions
      return NextResponse.json({
        success: false,
        error: 'Cannot create shared drive automatically',
        message: 'Manual setup required',
        instructions: [
          '1. Go to Google Drive (drive.google.com)',
          '2. Click "New" → "Shared drive"',
          '3. Name it "VAPI Bot Files" (or any name you prefer)',
          '4. Add the service account email as a member with "Content Manager" or "Manager" permissions:',
          '   Service Account: vapi-upload-bot-sa@voicebot-467308.iam.gserviceaccount.com',
          '5. Copy the shared drive ID from the URL (after /drive/folders/)',
          '6. Add it to your .env.local file as GOOGLE_SHARED_DRIVE_ID=your_drive_id',
          '7. Restart your development server',
          '8. Test the setup by running this endpoint again'
        ],
        serviceAccountEmail: 'vapi-upload-bot-sa@voicebot-467308.iam.gserviceaccount.com',
        createError: createError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Shared drive setup failed'
    }, { status: 500 });
  }
}
