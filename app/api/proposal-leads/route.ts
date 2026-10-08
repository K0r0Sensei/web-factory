import { NextResponse } from 'next/server';
import { saveProposalLead } from '../../../src/server/proposal-leads';
import { getDemo } from '../../../src/server/demo-store';

function clean(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = clean(body?.slug, 100);
    const name = clean(body?.name, 120);
    const email = clean(body?.email, 180);
    const phone = clean(body?.phone, 40);
    const message = clean(body?.message, 1200);

    if (!slug || !name) return NextResponse.json({ error: 'Necesitamos al menos tu nombre.' }, { status: 400 });
    if (!email && !phone) return NextResponse.json({ error: 'Indica un email o teléfono para poder contactarte.' }, { status: 400 });

    const demo = await getDemo(slug);
    if (!demo) return NextResponse.json({ error: 'La propuesta ya no está disponible.' }, { status: 404 });

    const lead = await saveProposalLead({ slug, name, email: email || undefined, phone: phone || undefined, message: message || undefined, source: 'public-proposal' });
    return NextResponse.json({ ok: true, id: lead.id }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo enviar la solicitud.' }, { status: 500 });
  }
}
