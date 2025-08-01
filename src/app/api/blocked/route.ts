import { NextResponse } from 'next/server';

// This endpoint handles blocked access attempts to the uploads directory
export async function GET() {
  return NextResponse.json(
    { 
      error: 'Access Denied',
      message: 'This resource is not publicly accessible',
      code: 'UPLOADS_BLOCKED'
    },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { 
      error: 'Access Denied',
      message: 'This resource is not publicly accessible',
      code: 'UPLOADS_BLOCKED'
    },
    { status: 404 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Access Denied',
      message: 'This resource is not publicly accessible',
      code: 'UPLOADS_BLOCKED'
    },
    { status: 404 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Access Denied',
      message: 'This resource is not publicly accessible',
      code: 'UPLOADS_BLOCKED'
    },
    { status: 404 }
  );
}
