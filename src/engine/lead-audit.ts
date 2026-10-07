import type { LeadWebsiteAudit } from '../types/leads';

function cleanText(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/\s+/g, ' ').trim().slice(0, 500);
}

function absoluteUrl(input: string): URL {
  const raw = input.trim();
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Solo se permiten URLs HTTP/HTTPS.');
  return url;
}

function assertSafeHost(url: URL) {
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' || host.endsWith('.local')) {
    throw new Error('La URL apunta a un host local y no se puede auditar.');
  }
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) {
    throw new Error('La URL apunta a una red privada y no se puede auditar.');
  }
  const m = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const octets = m.slice(1).map(Number);
    const [a, b] = octets;
    if (a === 172 && b >= 16 && b <= 31) throw new Error('La URL apunta a una red privada.');
    if (a === 100 && b >= 64 && b <= 127) throw new Error('La URL apunta a una red privada.');
  }
}

function scoreAudit(args: {
  reachable: boolean;
  https: boolean;
  title?: string;
  description?: string;
  viewport: boolean;
  h1: boolean;
  phone: boolean;
  whatsapp: boolean;
  bytes?: number;
}): { score: number; reasons: string[] } {
  if (!args.reachable) {
    return {
      score: 95,
      reasons: ['La web no se ha podido cargar: requiere revisión o parece inexistente.'],
    };
  }

  let score = 18;
  const reasons: string[] = [];
  if (!args.https) { score += 10; reasons.push('No usa HTTPS.'); }
  if (!args.viewport) { score += 16; reasons.push('No se detecta viewport móvil.'); }
  if (!args.title) { score += 8; reasons.push('Falta un title claro.'); }
  if (!args.description) { score += 8; reasons.push('Falta meta description.'); }
  if (!args.h1) { score += 6; reasons.push('No se detecta H1.'); }
  if (!args.phone) { score += 6; reasons.push('No se detecta un CTA telefónico.'); }
  if (!args.whatsapp) { score += 5; reasons.push('No se detecta WhatsApp.'); }
  if (typeof args.bytes === 'number' && args.bytes < 7000) { score += 8; reasons.push('El HTML es muy pequeño; puede ser una web muy básica.'); }
  if (reasons.length === 0) reasons.push('La web parece razonablemente completa; oportunidad menor.');
  return { score: Math.max(0, Math.min(100, score)), reasons: reasons.slice(0, 8) };
}

export async function auditWebsite(input: string): Promise<LeadWebsiteAudit> {
  const started = Date.now();
  let url: URL;
  try {
    url = absoluteUrl(input);
    assertSafeHost(url);
  } catch (error) {
    return {
      checked: true,
      reachable: false,
      hasViewport: false,
      hasH1: false,
      hasPhone: false,
      hasWhatsApp: false,
      hasHttps: false,
      opportunityScore: 100,
      reasons: [error instanceof Error ? error.message : 'URL no válida.'],
      responseMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'URL no válida.',
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'WebFactoryLeadAuditor/1.0 (+local prospect research)',
        'Accept': 'text/html,application/xhtml+xml',
      },
    });
    const finalUrl = response.url;
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      return {
        checked: true,
        reachable: false,
        status: response.status,
        finalUrl,
        hasViewport: false,
        hasH1: false,
        hasPhone: false,
        hasWhatsApp: false,
        hasHttps: finalUrl.startsWith('https://'),
        opportunityScore: 88,
        reasons: ['La URL responde, pero no parece una página HTML pública.'],
        responseMs: Date.now() - started,
      };
    }

    const html = (await response.text()).slice(0, 700_000);
    const title = cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]);
    const description = cleanText(
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)?.[1]
      ?? html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i)?.[1],
    );
    const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
    const hasH1 = /<h1\b/i.test(html);
    const hasPhone = /(tel:|\+34\s?[6789]\d{8}|\b9\d{8}\b|\b8\d{8}\b)/i.test(html);
    const hasWhatsApp = /(wa\.me\/|api\.whatsapp\.com|whatsapp)/i.test(html);
    const hasHttps = finalUrl.startsWith('https://');
    const { score, reasons } = scoreAudit({
      reachable: response.ok,
      https: hasHttps,
      title,
      description,
      viewport: hasViewport,
      h1: hasH1,
      phone: hasPhone,
      whatsapp: hasWhatsApp,
      bytes: html.length,
    });

    return {
      checked: true,
      reachable: response.ok,
      status: response.status,
      finalUrl,
      title,
      metaDescription: description,
      hasViewport,
      hasH1,
      hasPhone,
      hasWhatsApp,
      hasHttps,
      htmlBytes: html.length,
      responseMs: Date.now() - started,
      opportunityScore: score,
      reasons,
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo auditar la URL.';
    return {
      checked: true,
      reachable: false,
      hasViewport: false,
      hasH1: false,
      hasPhone: false,
      hasWhatsApp: false,
      hasHttps: url.protocol === 'https:',
      opportunityScore: 95,
      reasons: ['No se pudo cargar la web.', message],
      responseMs: Date.now() - started,
      error: message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function auditWithoutWebsite(): LeadWebsiteAudit {
  return {
    checked: true,
    reachable: false,
    hasViewport: false,
    hasH1: false,
    hasPhone: false,
    hasWhatsApp: false,
    hasHttps: false,
    opportunityScore: 96,
    reasons: ['El negocio no tiene una web indicada: candidato prioritario para una demo.'],
  };
}
