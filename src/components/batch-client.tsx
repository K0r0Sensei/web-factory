'use client';

import { useEffect, useMemo, useState } from 'react';
import { GeneratedSite } from '../engine/renderer';
import type { BusinessData, DesignSpec } from '../types/design';
import { savePublicDemo } from './demo-client';

type Diagnostics = { configured: boolean; attempted: boolean; ok: boolean; latencyMs: number; httpStatus?: number; error?: string };
type Generated = { business: BusinessData; design: DesignSpec; copy?: BusinessData['copy']; mode?: 'ai' | 'fallback'; model?: string; diagnostics?: Diagnostics };

type LeadRow = {
  businessName: string;
  city: string;
  phone: string;
  whatsapp?: string;
  rating?: number;
  reviewsCount?: number;
  description?: string;
  services: string[];
  emergency24h?: boolean;
  serviceAreas?: string[];
};

type RowState = { status: 'queued' | 'generating' | 'done' | 'error'; result?: Generated; error?: string; attempts?: number; startedAt?: number; demoPath?: string; proposalPath?: string };

type BatchItem = LeadRow & RowState;

const SAMPLE_CSV = `businessName,city,phone,whatsapp,rating,reviewsCount,description,services,emergency24h,serviceAreas\nFontanería García,Madrid,+34 910 000 000,+34 600 000 000,4.8,127,"Fontanería para hogares y negocios.","Urgencias 24h|Desatascos|Reparación de fugas|Instalaciones",true,"Madrid|Chamartín|Retiro"\nFontanería López,Alcalá de Henares,+34 910 111 111,+34 600 111 111,4.7,84,"Reparaciones e instalaciones de fontanería.","Desatascos|Fugas de agua|Grifería|Instalaciones",true,"Alcalá de Henares|Torrejón"\nFontanería Norte,Getafe,+34 910 222 222,+34 600 222 222,4.9,203,"Servicio local para viviendas y comercios.","Urgencias|Calderas|Fugas|Mantenimiento",true,"Getafe|Leganés|Alcorcón"`;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): LeadRow[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('El CSV necesita una cabecera y al menos una fila.');
  const headers = parseCsvLine(lines[0]).map((x) => x.trim());
  const required = ['businessName', 'city', 'phone', 'services'];
  for (const key of required) if (!headers.includes(key)) throw new Error(`Falta la columna obligatoria: ${key}`);

  return lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const record: Record<string, string> = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const services = (record.services ?? '').split('|').map((x) => x.trim()).filter(Boolean).slice(0, 6);
    if (!record.businessName || !record.city || !record.phone || services.length < 2) {
      throw new Error(`Fila ${rowIndex + 2}: necesita businessName, city, phone y al menos 2 servicios.`);
    }
    return {
      businessName: record.businessName,
      city: record.city,
      phone: record.phone,
      whatsapp: record.whatsapp || undefined,
      rating: record.rating ? Number(record.rating) : undefined,
      reviewsCount: record.reviewsCount ? Number(record.reviewsCount) : undefined,
      description: record.description || undefined,
      services,
      emergency24h: /^(true|1|sí|si)$/i.test(record.emergency24h ?? ''),
      serviceAreas: (record.serviceAreas ?? '').split('|').map((x) => x.trim()).filter(Boolean).slice(0, 8),
    };
  });
}

function downloadText(filename: string, content: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

class BatchGenerationError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'BatchGenerationError';
    this.status = status;
  }
}

async function generateOne(row: LeadRow): Promise<Generated> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...row, strictAI: true }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new BatchGenerationError(data.error || 'No se pudo generar con Gemini.', response.status);
  }
  if (data?.mode !== 'ai') {
    throw new BatchGenerationError(
      data?.diagnostics?.error || 'El servidor no devolvió una generación de IA.',
      503,
    );
  }
  return data as Generated;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown) {
  if (!(error instanceof BatchGenerationError)) return false;
  return [408, 409, 429, 500, 502, 503, 504].includes(error.status)
    || /high demand|temporar|overload|rate.?limit/i.test(error.message);
}

function slugFor(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

export function BatchClient() {
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [limit, setLimit] = useState(10);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const completed = useMemo(() => items.filter((item) => item.status === 'done').length, [items]);
  const failed = useMemo(() => items.filter((item) => item.status === 'error').length, [items]);
  const aiCount = useMemo(() => items.filter((item) => item.result?.mode === 'ai').length, [items]);

  function loadCsv() {
    setError('');
    try {
      const parsed = parseCsv(csv).slice(0, Math.max(1, Math.min(100, limit)));
      setItems(parsed.map((row) => ({ ...row, status: 'queued' })));
      setSelectedPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CSV inválido.');
    }
  }

  async function runBatch() {
    if (!items.length) {
      setError('Carga primero una lista de negocios.');
      return;
    }
    setRunning(true);
    setError('');
    for (let index = 0; index < items.length; index += 1) {
      setItems((current) => current.map((item, i) => i === index
        ? { ...item, status: 'generating', error: undefined, attempts: 0, startedAt: Date.now() }
        : item));

      let result: Generated | null = null;
      let lastError: unknown = null;
      const retryDelays = [4000, 10000];

      for (let attempt = 0; attempt < 3; attempt += 1) {
        setItems((current) => current.map((item, i) => i === index
          ? { ...item, status: 'generating', attempts: attempt + 1, startedAt: item.startedAt ?? Date.now() }
          : item));
        try {
          result = await generateOne(items[index]);
          break;
        } catch (err) {
          lastError = err;
          if (!isRetryable(err) || attempt === 2) break;
          await sleep(retryDelays[attempt]);
        }
      }

      if (result) {
        try {
          const publicDemo = await savePublicDemo(result);
          setItems((current) => current.map((item, i) => i === index
            ? { ...item, status: 'done', result, error: undefined, demoPath: publicDemo.demoPath, proposalPath: publicDemo.proposalPath }
            : item));
        } catch (saveError) {
          const message = saveError instanceof Error ? saveError.message : 'No se pudo guardar la demo pública.';
          setItems((current) => current.map((item, i) => i === index
            ? { ...item, status: 'error', result, error: `La IA generó la web, pero no se pudo crear el enlace: ${message}` }
            : item));
        }
      } else {
        const message = lastError instanceof Error ? lastError.message : 'Error desconocido.';
        setItems((current) => current.map((item, i) => i === index
          ? { ...item, status: 'error', error: `Gemini no generó la web: ${message}` }
          : item));
      }

      // Give free-tier Gemini a small breathing window between businesses.
      if (index < items.length - 1) await sleep(1500);
    }
    setRunning(false);
  }

  function exportResults() {
    const payload = items.filter((item) => item.result).map((item) => ({
      businessName: item.businessName,
      city: item.city,
      slug: slugFor(item.businessName),
      mode: item.result?.mode,
      model: item.result?.model,
      latencyMs: item.result?.diagnostics?.latencyMs,
      layout: item.result?.design.layout,
      palette: item.result?.design.palette,
      font: item.result?.design.font,
      proposalPath: item.proposalPath || '',
    }));
    downloadText('web-factory-batch-results.json', JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  }

  const selected = selectedPreview == null ? null : items[selectedPreview]?.result ?? null;

  return (
    <div className="batch-shell">
      <aside className="batch-sidebar">
        <div className="studio-head">
          <span className="kicker">WEB FACTORY · BATCH</span>
          <h1>Genera muchas webs de una vez.</h1>
          <p>Sube un CSV, procesa los negocios de uno en uno y conserva la preview de cada resultado. La cola secuencial reduce errores de cuota de Gemini.</p>
        </div>

        <label className="batch-field">Límite por ejecución
          <input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 1)} />
        </label>

        <label className="batch-field">CSV de negocios
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={18} spellCheck={false} />
        </label>

        <div className="batch-actions">
          <button className="studio-mini-btn" type="button" onClick={() => setCsv(SAMPLE_CSV)}>Cargar ejemplo</button>
          <button className="studio-mini-btn" type="button" onClick={() => downloadText('web-factory-template.csv', SAMPLE_CSV)}>Descargar plantilla</button>
        </div>

        <button className="studio-generate" type="button" onClick={loadCsv} disabled={running}>1 · CARGAR NEGOCIOS</button>
        <button className="studio-generate batch-run" type="button" onClick={runBatch} disabled={running || !items.length}>{running ? 'Generando cola…' : '2 · GENERAR TODAS'}</button>
        {error && <div className="studio-error">{error}</div>}

        <div className="batch-stats">
          <div><span>Negocios</span><strong>{items.length}</strong></div>
          <div><span>Completadas</span><strong>{completed}</strong></div>
          <div><span>Con IA</span><strong>{aiCount}</strong></div>
          <div><span>Fallos</span><strong>{failed}</strong></div>
        </div>

        <button type="button" className="studio-mini-btn batch-export" onClick={exportResults} disabled={!completed}>Exportar resultados JSON</button>
      </aside>

      <main className="batch-main">
        <div className="batch-topbar">
          <div><strong>Cola de generación</strong><span>{completed}/{items.length || 0} completadas</span></div>
          <div className="batch-progress"><span style={{ width: `${items.length ? Math.round((completed / items.length) * 100) : 0}%` }} /></div>
        </div>

        {!items.length ? (
          <div className="studio-empty"><div className="studio-empty-card"><span className="kicker">BATCH GENERATOR</span><h2>Carga un CSV para empezar.</h2><p>El sistema generará cada negocio con el mismo motor que ya tienes funcionando en <strong>/studio</strong>.</p></div></div>
        ) : (
          <div className="batch-grid">
            {items.map((item, index) => (
              <article className={`batch-card status-${item.status}`} key={`${item.businessName}-${index}`}>
                <div className="batch-card-top"><span className="batch-index">{String(index + 1).padStart(2, '0')}</span><span className="batch-status">{item.status === 'queued' ? 'En cola' : item.status === 'generating' ? `Gemini…${item.attempts ? ` intento ${item.attempts}/3` : ''}` : item.status === 'done' ? 'IA' : 'Error IA'}</span></div>
                <h3>{item.businessName}</h3>
                <p>{item.city} · {item.services.slice(0, 3).join(' · ')}</p>
                {item.result && <div className="batch-meta"><span>{item.result.design.layout}</span><span>{item.result.design.palette}</span><span>{item.result.diagnostics?.latencyMs ?? '?'} ms</span></div>}
                {item.error && <small className="batch-error">{item.error}</small>}
                {item.result && <div className="batch-demo-actions"><button className="studio-mini-btn" type="button" onClick={() => setSelectedPreview(index)}>Ver preview</button>{item.proposalPath && <a className="studio-mini-btn" href={item.proposalPath} target="_blank" rel="noreferrer">Abrir propuesta</a>}{item.proposalPath && <button className="studio-mini-btn" type="button" onClick={() => navigator.clipboard.writeText(new URL(item.proposalPath!, window.location.origin).toString())}>Copiar enlace</button>}</div>}
              </article>
            ))}
          </div>
        )}
      </main>

      {selected && (
        <div className="batch-preview-overlay" role="dialog" aria-modal="true">
          <div className="batch-preview-modal">
            <div className="batch-preview-head"><div><strong>{selected.business.businessName}</strong><span> · {selected.design.layout} · {selected.design.palette}</span></div><button className="studio-mini-btn" onClick={() => setSelectedPreview(null)}>Cerrar</button></div>
            <div className="batch-preview-site"><GeneratedSite business={selected.business} design={selected.design} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
