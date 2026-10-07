import { NextResponse } from 'next/server';
import { auditWebsite, auditWithoutWebsite } from '../../../src/engine/lead-audit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const website = String(body.website ?? '').trim();
    const audit = website ? await auditWebsite(website) : auditWithoutWebsite();
    return NextResponse.json(audit, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo auditar el negocio.' }, { status: 500 });
  }
}
