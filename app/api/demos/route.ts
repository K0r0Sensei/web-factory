import { NextResponse } from 'next/server';
import { saveDemo } from '../../../src/server/demo-store';
import type { BusinessData, DesignSpec } from '../../../src/types/design';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.business || !body?.design) return NextResponse.json({ error: 'Faltan business o design.' }, { status: 400 });
    const record = await saveDemo({ business: body.business as BusinessData, design: body.design as DesignSpec });
    return NextResponse.json({ slug: record.slug, demoPath: `/demo/${record.slug}`, proposalPath: `/proposal/${record.slug}`, createdAt: record.createdAt }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo guardar la demo.' }, { status: 500 });
  }
}
