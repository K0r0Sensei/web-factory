import { NextResponse } from 'next/server';
import { discoverBusinesses } from '../../../src/engine/discovery';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await discoverBusinesses({
      niche: String(body.niche || ''),
      location: String(body.location || ''),
      limit: Number(body.limit || 10),
      provider: body.provider,
    });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudieron descubrir negocios.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
