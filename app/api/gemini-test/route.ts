import { NextResponse } from 'next/server';

export async function GET() {
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const timeoutMs = Math.max(5_000, Number(process.env.GEMINI_TEST_TIMEOUT_MS || 20_000));

  if (!key) {
    return NextResponse.json({ ok: false, configured: false, model, error: 'GEMINI_API_KEY no está configurada en .env.local.' }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }

  const started = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': key,
      },
      body: JSON.stringify({
        model,
        input: 'Responde únicamente: GEMINI_OK',
        generation_config: { max_output_tokens: 20, thinking_level: 'low' },
      }),
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - started;
    if (!response.ok) {
      let error = `HTTP ${response.status}`;
      try {
        const payload = await response.json() as { error?: { message?: string } };
        error = payload?.error?.message || error;
      } catch {}
      return NextResponse.json({ ok: false, configured: true, model, latencyMs, status: response.status, error }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    }

    const payload = await response.json() as { steps?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
    const text = payload.steps?.flatMap((step) => step.content ?? []).filter((item) => item.type === 'text').map((item) => item.text || '').join('').trim() || '';
    return NextResponse.json({ ok: true, configured: true, model, latencyMs, text }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const detail = error instanceof DOMException && error.name === 'AbortError'
      ? `Tiempo de espera agotado (${Math.round(timeoutMs / 1000)} s).`
      : (error instanceof Error ? error.message : 'Error de red.');
    return NextResponse.json({ ok: false, configured: true, model, latencyMs: Date.now() - started, error: detail }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}
