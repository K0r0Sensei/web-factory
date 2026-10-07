'use client';

import { useMemo, useState } from 'react';
import { GeneratedSite } from '../engine/renderer';
import type { BusinessData, DesignSpec } from '../types/design';
import type { Lead, LeadWebsiteAudit } from '../types/leads';
import { savePublicDemo } from './demo-client';

type Generated = {
  business: BusinessData;
  design: DesignSpec;
  mode?: 'ai' | 'fallback';
  model?: string;
  diagnostics?: { latencyMs: number };
};

type DiscoveryResponse = {
  provider: 'osm' | 'dataforseo';
  displayLocation: string;
  leads: Lead[];
  note?: string;
  cost?: number;
};

const NICHES = ['fontaneros', 'electricistas', 'climatización', 'carpinteros'];

function scoreClass(score?: number) {
  if (score == null) return 'lead-score neutral';
  if (score >= 70) return 'lead-score hot';
  if (score >= 45) return 'lead-score warm';
  return 'lead-score cold';
}

async function auditLead(lead: Lead): Promise<LeadWebsiteAudit> {
  const response = await fetch('/api/audit', {
    method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ website: lead.website || '' }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Falló la auditoría.');
  return data as LeadWebsiteAudit;
}

async function generateLead(lead: Lead): Promise<Generated> {
  const response = await fetch('/api/generate', {
    method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: lead.businessName,
      city: lead.city,
      phone: lead.phone || '',
      website: lead.website,
      rating: lead.rating,
      reviewsCount: lead.reviewsCount,
      description: lead.description,
      services: lead.services,
      emergency24h: lead.services.some((x) => /urgencia|24h/i.test(x)),
      serviceAreas: lead.serviceAreas,
      strictAI: true,
    }),
  });
  const data = await response.json();
  if (!response.ok || data?.mode !== 'ai') throw new Error(data?.error || 'Gemini no generó la demo.');
  return data as Generated;
}

export function DiscoverClient() {
  const [niche, setNiche] = useState('fontaneros');
  const [location, setLocation] = useState('Madrid, España');
  const [limit, setLimit] = useState(10);
  const [provider, setProvider] = useState<'auto' | 'dataforseo' | 'osm'>('auto');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<Generated | null>(null);
  const [source, setSource] = useState('');
  const [sourceNote, setSourceNote] = useState('');
  const [cost, setCost] = useState<number | null>(null);

  const audited = useMemo(() => leads.filter((x) => x.audit?.checked).length, [leads]);
  const ready = useMemo(() => leads.filter((x) => (x.audit?.opportunityScore ?? 0) >= 60).length, [leads]);
  const demos = useMemo(() => leads.filter((x) => x.status === 'demo').length, [leads]);

  async function discoverAndAudit() {
    setRunning(true); setMessage('Buscando negocios…'); setLeads([]); setPreview(null); setCost(null);
    try {
      const response = await fetch('/api/discover', {
        method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, location, limit, provider }),
      });
      const data = await response.json() as DiscoveryResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || 'No se pudieron descubrir negocios.');
      const initial = data.leads.map((lead) => ({ ...lead, status: 'new' as const }));
      setLeads(initial);
      setSource(data.provider);
      setSourceNote(data.note || '');
      setCost(typeof data.cost === 'number' ? data.cost : null);
      setMessage(`${initial.length} negocios encontrados · auditando webs…`);
      for (const lead of initial) {
        setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: 'audited' } : item));
        try {
          const audit = await auditLead(lead);
          setLeads((current) => current.map((item) => item.id === lead.id ? {
            ...item,
            audit,
            status: audit.opportunityScore >= 60 ? 'ready' : 'audited',
          } : item));
        } catch (error) {
          setLeads((current) => current.map((item) => item.id === lead.id ? {
            ...item,
            status: 'error',
            error: error instanceof Error ? error.message : 'Error de auditoría.',
          } : item));
        }
      }
      setMessage('Descubrimiento + auditoría terminados.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error de descubrimiento.');
    } finally {
      setRunning(false);
    }
  }

  async function generateTop() {
    const candidates = [...leads]
      .filter((x) => (x.audit?.opportunityScore ?? 0) >= 60 && x.phone)
      .sort((a, b) => (b.audit?.opportunityScore ?? 0) - (a.audit?.opportunityScore ?? 0))
      .slice(0, 3);
    if (!candidates.length) {
      setMessage('No hay candidatos con teléfono y oportunidad suficiente.');
      return;
    }
    setRunning(true); setMessage(`Generando ${candidates.length} demos con Gemini…`);
    for (const candidate of candidates) {
      setLeads((current) => current.map((item) => item.id === candidate.id ? { ...item, status: 'generating', error: undefined } : item));
      try {
        const generated = await generateLead(candidate);
        const publicDemo = await savePublicDemo(generated);
        setLeads((current) => current.map((item) => item.id === candidate.id ? {
          ...item,
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
        } : item));
        setPreview(generated);
      } catch (error) {
        setLeads((current) => current.map((item) => item.id === candidate.id ? {
          ...item,
          status: 'error',
          error: error instanceof Error ? error.message : 'Gemini no generó la demo.',
        } : item));
      }
    }
    setRunning(false); setMessage('Generación terminada.');
  }

  return (
    <div className="lead-shell">
      <aside className="lead-sidebar">
        <span className="kicker">WEB FACTORY · DISCOVERY</span>
        <h1>Descubre oportunidades sin preparar el CSV.</h1>
        <p>Introduce un nicho y una ciudad. La máquina encuentra candidatos, audita su web y deja arriba los que parecen tener más margen de mejora.</p>
        <label className="lead-field">Nicho
          <select value={niche} onChange={(e) => setNiche(e.target.value)}>
            {NICHES.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="lead-field">Ciudad / ubicación
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Madrid, España" />
        </label>
        <label className="lead-field">Máximo de negocios
          <input type="number" min={1} max={20} value={limit} onChange={(e) => setLimit(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
        </label>
        <label className="lead-field">Fuente
          <select value={provider} onChange={(e) => setProvider(e.target.value as 'auto' | 'dataforseo' | 'osm')}>
            <option value="auto">Automática</option>
            <option value="dataforseo">DataForSEO</option>
            <option value="osm">OpenStreetMap · experimental</option>
          </select>
        </label>
        <button className="studio-generate lead-generate" onClick={discoverAndAudit} disabled={running}>1 · DESCUBRIR + AUDITAR</button>
        <button className="studio-generate" onClick={generateTop} disabled={running || !leads.length}>2 · GENERAR TOP 3 DEMOS</button>
        {source && <div className="studio-gemini-test"><strong>Fuente: {source === 'dataforseo' ? 'DataForSEO' : 'OpenStreetMap'}</strong>{cost != null && <small>Coste de la consulta: ${cost.toFixed(4)}</small>}<small>{sourceNote}</small></div>}
        {source === 'osm' && <div className="studio-gemini-test"><small>© OpenStreetMap contributors · ODbL. Este modo está limitado a búsquedas iniciadas por el usuario y sirve como prueba del flujo.</small></div>}
        {message && <div className="studio-gemini-test">{message}</div>}
        <div className="lead-stats"><div><span>Leads</span><strong>{leads.length}</strong></div><div><span>Auditados</span><strong>{audited}</strong></div><div><span>Top</span><strong>{ready}</strong></div><div><span>Demos</span><strong>{demos}</strong></div></div>
      </aside>

      <main className="lead-main">
        <div className="lead-topbar"><div><strong>Discovery Engine</strong><span>{ready} candidatos prioritarios · {audited} auditados</span></div></div>
        {!leads.length ? (
          <div className="studio-empty"><div className="studio-empty-card"><span className="kicker">DISCOVERY</span><h2>Elige nicho y ciudad.</h2><p>V15 separa la fuente de datos del motor de webs. Para producción comercial conviene usar un proveedor con licencia y revisar sus condiciones de uso; el modo OSM es deliberadamente experimental.</p></div></div>
        ) : (
          <div className="lead-table-wrap">
            <table className="lead-table">
              <thead><tr><th>Negocio</th><th>Web</th><th>Oportunidad</th><th>Señales</th><th>Estado</th></tr></thead>
              <tbody>{leads.map((lead) => (
                <tr key={lead.id}>
                  <td><strong>{lead.businessName}</strong><small>{lead.city} · {lead.phone || 'sin teléfono'}</small></td>
                  <td>{lead.website ? <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">{lead.website}</a> : <span className="muted">Sin web</span>}</td>
                  <td><span className={scoreClass(lead.audit?.opportunityScore)}>{lead.audit?.opportunityScore ?? '—'}</span></td>
                  <td>{lead.audit ? <div className="lead-flags"><span>{lead.audit.hasViewport ? '✓ móvil' : '✕ móvil'}</span><span>{lead.audit.hasPhone ? '✓ teléfono' : '✕ teléfono'}</span><span>{lead.audit.hasWhatsApp ? '✓ WhatsApp' : '✕ WhatsApp'}</span></div> : <span className="muted">Pendiente</span>}</td>
                  <td><span className={`lead-status status-${lead.status}`}>{lead.status === 'new' ? 'Nuevo' : lead.status === 'audited' ? 'Auditado' : lead.status === 'ready' ? 'Prioridad' : lead.status === 'generating' ? 'Gemini…' : lead.status === 'demo' ? 'Demo IA' : 'Error'}</span>{lead.error && <small className="lead-error">{lead.error}</small>}{lead.demo && <div className="lead-demo-actions"><button className="studio-mini-btn" onClick={() => setPreview({ business: lead.demo!.business, design: lead.demo!.design })}>Ver demo</button>{lead.demo.proposalPath && <a className="studio-mini-btn" href={lead.demo.proposalPath} target="_blank" rel="noreferrer">Abrir propuesta</a>}{lead.demo.proposalPath && <button className="studio-mini-btn" onClick={() => navigator.clipboard.writeText(new URL(lead.demo!.proposalPath!, window.location.origin).toString())}>Copiar enlace</button>}</div>}</td>
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
