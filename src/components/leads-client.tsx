'use client';

import { useMemo, useState } from 'react';
import { GeneratedSite } from '../engine/renderer';
import type { BusinessData, DesignSpec } from '../types/design';
import type { Lead, LeadWebsiteAudit } from '../types/leads';
import { savePublicDemo } from './demo-client';

type Generated = {
  business: BusinessData;
  design: DesignSpec;
  copy?: BusinessData['copy'];
  mode?: 'ai' | 'fallback';
  model?: string;
  diagnostics?: { latencyMs: number };
};

type LeadInput = Omit<Lead, 'id' | 'status' | 'audit' | 'demo' | 'error'>;

const SAMPLE_CSV = `businessName,city,phone,whatsapp,email,website,rating,reviewsCount,description,services,emergency24h,serviceAreas
Fontanería Norte,Madrid,+34 910 000 100,+34 600 000 100,info@ejemplo.es,https://example.com,4.7,128,"Fontanería para hogares y comercios.","Urgencias 24h|Desatascos|Fugas|Instalaciones",true,"Madrid|Chamartín|Retiro"
Fontanería López,Alcalá de Henares,+34 910 000 200,+34 600 000 200,contacto@ejemplo.es,,4.8,86,"Reparaciones e instalaciones.","Desatascos|Fugas|Grifería|Instalaciones",true,"Alcalá de Henares|Torrejón"
Fontanería Central,Getafe,+34 910 000 300,+34 600 000 300,hello@ejemplo.es,https://example.org,4.5,41,"Servicio de fontanería local.","Fugas|Calderas|Mantenimiento|Urgencias",false,"Getafe|Leganés"`;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { current += '"'; i += 1; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { cells.push(current.trim()); current = ''; }
    else current += c;
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(text: string): LeadInput[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('El CSV necesita cabecera y al menos una fila.');
  const headers = parseCsvLine(lines[0]);
  for (const required of ['businessName', 'city', 'phone', 'services']) {
    if (!headers.includes(required)) throw new Error(`Falta la columna: ${required}`);
  }
  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const record = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    const services = String(record.services || '').split('|').map((x) => x.trim()).filter(Boolean).slice(0, 6);
    if (!record.businessName || !record.city || !record.phone || services.length < 2) {
      throw new Error(`Fila ${index + 2}: faltan datos obligatorios.`);
    }
    return {
      businessName: record.businessName,
      city: record.city,
      province: record.province || undefined,
      phone: record.phone,
      whatsapp: record.whatsapp || undefined,
      email: record.email || undefined,
      website: record.website || undefined,
      rating: record.rating ? Number(record.rating) : undefined,
      reviewsCount: record.reviewsCount ? Number(record.reviewsCount) : undefined,
      description: record.description || undefined,
      services,
      emergency24h: /^(true|1|sí|si)$/i.test(record.emergency24h || ''),
      serviceAreas: String(record.serviceAreas || '').split('|').map((x) => x.trim()).filter(Boolean).slice(0, 8),
    };
  });
}

function slug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'negocio';
}

function toBusiness(row: LeadInput): BusinessData {
  return {
    id: slug(row.businessName),
    businessName: row.businessName,
    city: row.city,
    province: row.province,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    website: row.website,
    rating: row.rating,
    reviewsCount: row.reviewsCount,
    description: row.description,
    services: row.services.map((name) => ({ name })),
    serviceAreas: row.serviceAreas?.length ? row.serviceAreas : [row.city],
    emergency24h: row.emergency24h,
  };
}

async function auditLead(lead: Lead): Promise<LeadWebsiteAudit> {
  const response = await fetch('/api/audit', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ website: lead.website || '' }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Falló la auditoría.');
  return data as LeadWebsiteAudit;
}

async function generateLead(lead: Lead): Promise<Generated> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: lead.businessName,
      city: lead.city,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      website: lead.website,
      rating: lead.rating,
      reviewsCount: lead.reviewsCount,
      description: lead.description,
      services: lead.services,
      emergency24h: lead.emergency24h,
      serviceAreas: lead.serviceAreas,
      strictAI: true,
    }),
  });
  const data = await response.json();
  if (!response.ok || data?.mode !== 'ai') throw new Error(data?.error || 'Gemini no generó la demo.');
  return data as Generated;
}

function scoreClass(score?: number) {
  if (score == null) return 'lead-score neutral';
  if (score >= 70) return 'lead-score hot';
  if (score >= 45) return 'lead-score warm';
  return 'lead-score cold';
}

function previewFromResult(lead: Lead): Generated {
  if (lead.demo?.business && lead.demo.design) {
    return { business: lead.demo.business, design: lead.demo.design };
  }
  return { business: toBusiness(lead), design: {
    layout: 'L1', palette: 'P1', font: 'F1',
    hero: { variant: 'H1', imagePosition: 'right', overlay: false, ctaPrimary: 'phone' },
    services: { variant: 'S1', columns: 3 }, reviews: { variant: 'R1', showRating: true },
    faq: { variant: 'Q1' }, contact: { variant: 'C1' }, footer: { variant: 'T1' },
    density: 'medium', radius: 'medium',
  } };
}

export function LeadsClient() {
  const [csv, setCsv] = useState(SAMPLE_CSV);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [threshold, setThreshold] = useState(55);
  const [limit, setLimit] = useState(10);
  const [preview, setPreview] = useState<Generated | null>(null);

  const ready = useMemo(() => leads.filter((x) => (x.audit?.opportunityScore ?? 0) >= threshold).length, [leads, threshold]);
  const audited = useMemo(() => leads.filter((x) => x.audit?.checked).length, [leads]);
  const demos = useMemo(() => leads.filter((x) => x.status === 'demo').length, [leads]);

  function load() {
    setMessage('');
    try {
      const rows = parseCsv(csv).slice(0, Math.max(1, Math.min(100, limit)));
      setLeads(rows.map((row, i) => ({ ...row, id: `${slug(row.businessName)}-${i + 1}`, status: 'new' })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'CSV inválido.');
    }
  }

  async function auditAll() {
    if (!leads.length) { setMessage('Carga primero los negocios.'); return; }
    setRunning(true);
    setMessage('Auditando webs…');
    for (let i = 0; i < leads.length; i += 1) {
      setLeads((current) => current.map((lead, index) => index === i ? { ...lead, status: 'audited', error: undefined } : lead));
      try {
        const audit = await auditLead(leads[i]);
        setLeads((current) => current.map((lead, index) => index === i ? { ...lead, audit, status: audit.opportunityScore >= threshold ? 'ready' : 'audited' } : lead));
      } catch (error) {
        setLeads((current) => current.map((lead, index) => index === i ? { ...lead, status: 'error', error: error instanceof Error ? error.message : 'Error de auditoría.' } : lead));
      }
    }
    setRunning(false);
    setMessage('Auditoría terminada.');
  }

  async function generateTop() {
    const candidates = [...leads]
      .filter((x) => (x.audit?.opportunityScore ?? 0) >= threshold)
      .sort((a, b) => (b.audit?.opportunityScore ?? 0) - (a.audit?.opportunityScore ?? 0))
      .slice(0, Math.max(1, Math.min(20, limit)));
    if (!candidates.length) {
      setMessage('No hay candidatos por encima del umbral. Ejecuta primero la auditoría.');
      return;
    }
    setRunning(true);
    setMessage(`Generando ${candidates.length} demos con Gemini…`);
    for (const candidate of candidates) {
      setLeads((current) => current.map((lead) => lead.id === candidate.id ? { ...lead, status: 'generating', error: undefined } : lead));
      try {
        const generated = await generateLead(candidate);
        const publicDemo = await savePublicDemo(generated);
        setLeads((current) => current.map((lead) => lead.id === candidate.id ? {
          ...lead,
          status: 'demo',
          demo: {
            mode: generated.mode || 'ai',
            model: generated.model,
            layout: generated.design.layout,
            palette: generated.design.palette,
            latencyMs: generated.diagnostics?.latencyMs ?? 0,
            business: generated.business,
            design: generated.design,
            demoPath: publicDemo.demoPath,
            proposalPath: publicDemo.proposalPath,
          },
        } : lead));
        setPreview(generated);
      } catch (error) {
        setLeads((current) => current.map((lead) => lead.id === candidate.id ? {
          ...lead,
          status: 'error',
          error: error instanceof Error ? error.message : 'Gemini no generó la demo.',
        } : lead));
      }
    }
    setRunning(false);
    setMessage('Generación terminada.');
  }

  function exportLeads() {
    const payload = leads.map((lead) => ({
      businessName: lead.businessName,
      city: lead.city,
      phone: lead.phone,
      email: lead.email || '',
      website: lead.website || '',
      opportunityScore: lead.audit?.opportunityScore ?? '',
      status: lead.status,
      reasons: lead.audit?.reasons?.join(' | ') || '',
      demoLayout: lead.demo?.layout || '',
      demoPalette: lead.demo?.palette || '',
      proposalPath: lead.demo?.proposalPath || '',
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'web-factory-leads.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="lead-shell">
      <aside className="lead-sidebar">
        <span className="kicker">WEB FACTORY · LEAD FACTORY</span>
        <h1>Encuentra primero los negocios con más oportunidad.</h1>
        <p>Importa una lista, audita las webs de forma ligera, prioriza los candidatos con margen de mejora y genera demos con Gemini solo donde tiene sentido.</p>
        <label className="lead-field">Umbral de oportunidad
          <input type="number" min={0} max={100} value={threshold} onChange={(e) => setThreshold(Number(e.target.value) || 0)} />
        </label>
        <label className="lead-field">Máximo de negocios
          <input type="number" min={1} max={100} value={limit} onChange={(e) => setLimit(Number(e.target.value) || 1)} />
        </label>
        <label className="lead-field">CSV de negocios
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={14} spellCheck={false} />
        </label>
        <div className="lead-actions">
          <button className="studio-mini-btn" onClick={() => setCsv(SAMPLE_CSV)} disabled={running}>Ejemplo</button>
          <button className="studio-mini-btn" onClick={exportLeads} disabled={!leads.length || running}>Exportar</button>
        </div>
        <button className="studio-generate" onClick={load} disabled={running}>1 · CARGAR LEADS</button>
        <button className="studio-generate" onClick={auditAll} disabled={running || !leads.length}>2 · AUDITAR WEBS</button>
        <button className="studio-generate lead-generate" onClick={generateTop} disabled={running || !leads.length}>3 · GENERAR TOP DEMOS</button>
        {message && <div className="studio-gemini-test">{message}</div>}
        <div className="lead-stats">
          <div><span>Leads</span><strong>{leads.length}</strong></div>
          <div><span>Auditados</span><strong>{audited}</strong></div>
          <div><span>Top</span><strong>{ready}</strong></div>
          <div><span>Demos</span><strong>{demos}</strong></div>
        </div>
      </aside>

      <main className="lead-main">
        <div className="lead-topbar"><div><strong>Prioridad comercial</strong><span>{ready} por encima de {threshold}/100</span></div></div>
        {!leads.length ? (
          <div className="studio-empty"><div className="studio-empty-card"><span className="kicker">LEAD FACTORY</span><h2>Primero carga una lista.</h2><p>V13 empieza controlado: la fuente de leads es un CSV y la auditoría solo revisa la página principal pública de cada web.</p></div></div>
        ) : (
          <div className="lead-table-wrap">
            <table className="lead-table">
              <thead><tr><th>Negocio</th><th>Web</th><th>Oportunidad</th><th>Señales</th><th>Estado</th><th></th></tr></thead>
              <tbody>{leads.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.businessName}</strong><small>{lead.city} · {lead.phone}</small></td>
                  <td>{lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">{lead.website}</a> : <span className="muted">Sin web</span>}</td>
                  <td><span className={scoreClass(lead.audit?.opportunityScore)}>{lead.audit?.opportunityScore ?? '—'}</span></td>
                  <td>{lead.audit ? <div className="lead-flags"><span>{lead.audit.hasViewport ? '✓ móvil' : '✕ móvil'}</span><span>{lead.audit.hasPhone ? '✓ teléfono' : '✕ teléfono'}</span><span>{lead.audit.hasWhatsApp ? '✓ WhatsApp' : '✕ WhatsApp'}</span></div> : <span className="muted">Pendiente</span>}</td>
                  <td><span className={`lead-status status-${lead.status}`}>{lead.status === 'new' ? 'Nuevo' : lead.status === 'audited' ? 'Auditado' : lead.status === 'ready' ? 'Prioridad' : lead.status === 'generating' ? 'Gemini…' : lead.status === 'demo' ? 'Demo IA' : 'Error'}</span>{lead.error && <small className="lead-error">{lead.error}</small>}</td>
                  <td>{lead.demo && <div className="lead-demo-actions"><button className="studio-mini-btn" onClick={() => setPreview(previewFromResult(lead))}>Ver demo</button>{lead.demo.proposalPath && <a className="studio-mini-btn" href={lead.demo.proposalPath} target="_blank" rel="noreferrer">Abrir propuesta</a>}{lead.demo.proposalPath && <button className="studio-mini-btn" onClick={() => navigator.clipboard.writeText(new URL(lead.demo!.proposalPath!, window.location.origin).toString())}>Copiar enlace</button>}</div>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </main>

      {preview && <div className="batch-preview-overlay" role="dialog" aria-modal="true"><div className="batch-preview-modal"><div className="batch-preview-head"><div><strong>{preview.business.businessName}</strong><span> · {preview.design.layout} · {preview.design.palette}</span></div><button className="studio-mini-btn" onClick={() => setPreview(null)}>Cerrar</button></div><div className="batch-preview-site"><GeneratedSite business={preview.business} design={preview.design} /></div></div></div>}
    </div>
  );
}
