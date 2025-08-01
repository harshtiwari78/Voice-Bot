import { NextRequest, NextResponse } from 'next/server';
import { setupSheetsHeaders } from '@/lib/googleService';

export async function GET() {
  try {
    console.log('🔧 Setting up Google Sheets headers...');
    
    await setupSheetsHeaders();
    
    return NextResponse.json({
      success: true,
      message: 'Google Sheets headers set up successfully!',
      headers: [
        'Creation Date & Time',
        'Bot Name', 
        'Knowledge Base Type',
        'Knowledge Base Content',
        'Drive Folder Link'
      ]
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
