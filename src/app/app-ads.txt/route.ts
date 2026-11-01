import { NextResponse } from 'next/server';

/**
 * @fileOverview Dedicated route to serve app-ads.txt for AdMob verification.
 * This ensures the file is served with the correct text/plain headers.
 */
export async function GET() {
  const content = 'google.com, pub-3697085425178482, DIRECT, f08c47fec0942fa0';
  
  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
