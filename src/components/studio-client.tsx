'use client';

import { useState } from 'react';
import { GeneratedSite } from '../engine/renderer';
import type { BusinessData, DesignSpec } from '../types/design';

type Diagnostics = { configured: boolean; attempted: boolean; ok: boolean; latencyMs: number; httpStatus?: number; error?: string };
type Generated = { business: BusinessData; design: DesignSpec; copy?: BusinessData['copy']; mode?: 'ai' | 'fallback'; model?: string; diagnostics?: Diagnostics };


const initialServices = ['Urgencias 24h', 'Desatascos', 'Reparación de fugas', 'Instalaciones'];

export function StudioClient() {
  const [services, setServices] = useState(initialServices);
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geminiTest, setGeminiTest] = useState<{ ok: boolean; configured: boolean; model: string; latencyMs?: number; text?: string; error?: string } | null>(null);
  const [testingGemini, setTestingGemini] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const form = new FormData(event.currentTarget);
    const payload = {
      businessName: form.get('businessName'),
      city: form.get('city'),
      phone: form.get('phone'),
      whatsapp: form.get('whatsapp'),
      description: form.get('description'),
      rating: form.get('rating'),
      reviewsCount: form.get('reviewsCount'),
      emergency24h: form.get('emergency24h') === 'on',
      services,
    };

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al generar.');
      setGenerated(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar.');
    } finally {
      setLoading(false);
    }
  }


  async function testGemini() {
    setTestingGemini(true);
    setGeminiTest(null);
    try {
      const response = await fetch('/api/gemini-test', { cache: 'no-store' });
      const data = await response.json();
      setGeminiTest(data);
    } catch (err) {
      setGeminiTest({ ok: false, configured: false, model: 'desconocido', error: err instanceof Error ? err.message : 'Error de conexión.' });
    } finally {
      setTestingGemini(false);
    }
  }

  function addService() {
    if (services.length >= 6) return;
    setServices([...services, 'Nuevo servicio']);
  }

  function updateService(index: number, value: string) {
    setServices(services.map((service, i) => (i === index ? value : service)));
  }

  function removeService(index: number) {
    if (services.length <= 2) return;
    setServices(services.filter((_, i) => i !== index));
  }

  return (
    <div className="studio-shell">
      <section className="studio-panel">
        <div className="studio-head">
          <span className="kicker">WEB FACTORY · STUDIO</span>
          <h1>Genera una web desde los datos del negocio.</h1>
          <p>El motor usa Gemini cuando configuras <code>GEMINI_API_KEY</code>; si no, cae automáticamente al Design Director local.</p>
        </div>

        <form onSubmit={onSubmit} className="studio-form">
          <label>Nombre del negocio<input name="businessName" defaultValue="Fontanería García" required /></label>
          <label>Ciudad<input name="city" defaultValue="Madrid" required /></label>
          <label>Teléfono<input name="phone" defaultValue="+34 910 000 000" required /></label>
          <label>WhatsApp<input name="whatsapp" defaultValue="+34 600 000 000" /></label>
          <label>Valoración<input name="rating" type="number" min="0" max="5" step="0.1" defaultValue="4.8" /></label>
          <label>Nº reseñas<input name="reviewsCount" type="number" min="0" defaultValue="127" /></label>
          <label className="studio-full">Descripción<textarea name="description" defaultValue="Servicios de fontanería para hogares y negocios, con atención rápida, trabajo limpio y presupuestos claros." rows={4} /></label>

          <div className="studio-full">
            <div className="studio-label-row"><span>Servicios</span><button type="button" className="studio-mini-btn" onClick={addService}>+ Añadir</button></div>
            <div className="service-inputs">
              {services.map((service, index) => (
                <div className="service-input-row" key={`${index}-${service}`}>
                  <input value={service} onChange={(event) => updateService(index, event.target.value)} />
                  <button type="button" className="studio-remove" onClick={() => removeService(index)} aria-label={`Eliminar servicio ${index + 1}`}>×</button>
                </div>
              ))}
            </div>
          </div>

          <label className="studio-check studio-full"><input name="emergency24h" type="checkbox" defaultChecked /> Atención de urgencias 24h</label>

          <button className="studio-generate" disabled={loading}>{loading ? 'Generando…' : 'GENERAR WEB'}</button>
          {error && <div className="studio-error">{error}</div>}
        </form>

        <div className="studio-status">
          <div><span>Motor</span><strong>Gemini + fallback local</strong></div>
          <div><span>Renderer</span><strong>Next.js</strong></div>
          <div><span>Layouts</span><strong>5</strong></div>
          <div><span>Paletas</span><strong>6</strong></div>
          <button type="button" className="studio-mini-btn studio-test-btn" onClick={testGemini} disabled={testingGemini}>
            {testingGemini ? 'Probando Gemini…' : 'Probar Gemini'}
          </button>
          {geminiTest && (
            <div className={`studio-gemini-test ${geminiTest.ok ? 'is-ok' : 'is-error'}`}>
              <strong>{geminiTest.ok ? '✓ Gemini responde' : '⚠ Gemini no responde'}</strong>
              <span>{geminiTest.model}{typeof geminiTest.latencyMs === 'number' ? ` · ${geminiTest.latencyMs} ms` : ''}</span>
              {geminiTest.error && <small>{geminiTest.error}</small>}
            </div>
          )}
        </div>
      </section>

      <section className="studio-preview">
        {generated ? (
          <>
            <div className="studio-preview-bar"><div><strong>Preview generada</strong><span> · {generated.design.layout} · {generated.design.palette}</span></div><div className={`studio-pill ${generated.mode === 'ai' ? 'is-ai' : 'is-fallback'}`}>{generated.mode === 'ai' ? `IA · ${generated.model ?? 'modelo'} · ${generated.diagnostics?.latencyMs ?? '?'} ms` : `LOCAL · FALLBACK${generated.diagnostics?.error ? ` · ${generated.diagnostics.error}` : ''}`}</div></div>
            <GeneratedSite business={generated.business} design={generated.design} />
          </>
        ) : (
          <div className="studio-empty">
            <div className="studio-empty-card">
              <span className="kicker">PREVIEW</span>
              <h2>Tu web aparecerá aquí.</h2>
              <p>Introduce los datos de un fontanero y pulsa <strong>Generar web</strong>. El sistema elegirá automáticamente el layout más adecuado.</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
