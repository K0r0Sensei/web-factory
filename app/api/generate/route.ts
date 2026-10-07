import { NextResponse } from 'next/server';
import { generateWithAI } from '../../../src/engine/ai-director';
import type { BusinessData } from '../../../src/types/design';

function makeId(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9áéíóúüñ]+/gi, '-').replace(/^-|-$/g, '').slice(0, 50) || 'nuevo-negocio';
}

function normalizePhone(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const businessName = String(body.businessName ?? '').trim();
    const city = String(body.city ?? '').trim();
    const phone = normalizePhone(String(body.phone ?? ''));
    const whatsapp = normalizePhone(String(body.whatsapp ?? phone));
    const description = String(body.description ?? '').trim();
    const services = Array.isArray(body.services)
      ? body.services.map((service: unknown) => String(service ?? '').trim()).filter(Boolean).slice(0, 6)
      : [];

    if (!businessName || !city || services.length < 2) {
      return NextResponse.json({ error: 'Necesitamos nombre, ciudad y al menos 2 servicios.' }, { status: 400 });
    }

    const business: BusinessData = {
      id: makeId(businessName), businessName, city, phone, whatsapp: whatsapp || undefined,
      description: description || undefined,
      services: services.map((name: string) => ({ name })),
      serviceAreas: [city],
      rating: Number(body.rating) || undefined,
      reviewsCount: Number(body.reviewsCount) || undefined,
      differentiators: [],
      emergency24h: Boolean(body.emergency24h),
    };

    const generated = await generateWithAI(business);
    const strictAI = body.strictAI === true;

    // Batch mode can require a real Gemini generation. Do not silently turn
    // a model outage/rate limit into a successful local fallback.
    if (strictAI && generated.mode !== 'ai') {
      return NextResponse.json({
        error: generated.diagnostics.error || 'Gemini no ha podido generar esta web.',
        model: generated.model,
        diagnostics: generated.diagnostics,
      }, {
        status: generated.diagnostics.httpStatus && generated.diagnostics.httpStatus >= 400
          ? generated.diagnostics.httpStatus
          : 503,
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    return NextResponse.json(generated, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'No se ha podido generar la web.' }, { status: 500 });
  }
}
