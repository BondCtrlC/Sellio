import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  // Sanitize filename to prevent header injection
  const rawFilename = searchParams.get('filename') || 'qrcode.png';
  const filename = rawFilename.replace(/[^a-zA-Z0-9_\-\.]/g, '_').slice(0, 100);

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Only allow promptpay.io URLs for security
  if (!url.startsWith('https://promptpay.io/')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch QR code');
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Download QR error:', error);
    return NextResponse.json({ error: 'Failed to download QR code' }, { status: 500 });
  }
}
