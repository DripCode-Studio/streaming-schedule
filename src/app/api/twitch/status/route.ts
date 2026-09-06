import { NextResponse } from 'next/server';
import { twitchService } from '@/lib/twitch/service';

export async function GET() {
  const status = await twitchService.getLiveStatus();
  return NextResponse.json(status, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
