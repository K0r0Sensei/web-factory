import { fallbackCopy } from './site-copy';
import { chooseDesign } from './design-director';
import { DESIGN_DIRECTOR_SYSTEM, designDirectorInput, isDesignSpec } from './ai-contract';
import type { BusinessData, DesignSpec } from '../types/design';
import type { SiteCopy } from '../types/site-content';

export type GenerationDiagnostics = {
  configured: boolean;
  attempted: boolean;
  ok: boolean;
  latencyMs: number;
  httpStatus?: number;
  error?: string;
  thinkingLevel?: string;
  timeoutMs?: number;
};

export type GenerationResult = {
  business: BusinessData;
  design: DesignSpec;
  copy: SiteCopy;
  mode: 'ai' | 'fallback';
  model?: string;
  diagnostics: GenerationDiagnostics;
};

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const DEFAULT_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
];
const GEMINI_INTERACTIONS_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const GEMINI_TIMEOUT_MS = Math.max(10_000, Number(process.env.GEMINI_TIMEOUT_MS || 45_000));
const GEMINI_THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL?.trim() || 'low';

function configuredModels(): string[] {
  const envList = process.env.GEMINI_MODELS?.split(',').map((x) => x.trim()).filter(Boolean) ?? [];
  const single = process.env.GEMINI_MODEL?.trim();
  const candidates = [single, ...envList, ...DEFAULT_MODELS].filter(Boolean) as string[];
  return [...new Set(candidates)];
}

function isAvailabilityError(status: number, message: string): boolean {
  return [408, 409, 429, 500, 502, 503, 504].includes(status)
    || /high demand|temporar|overload|rate.?limit|unavailable|capacity/i.test(message);
}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}


function enforceTruthfulDesign(design: DesignSpec, business: BusinessData): DesignSpec {
  const next = structuredClone(design);
  if (next.layout === 'L3' && !business.emergency24h) {
    next.layout = business.rating && business.rating >= 4.7 ? 'L4' : 'L1';
    next.hero.ctaPrimary = business.phone ? 'phone' : 'quote';
    if (next.hero.ctaSecondary === 'whatsapp' && !business.whatsapp) next.hero.ctaSecondary = 'quote';
  }
  if (!business.phone && next.hero.ctaPrimary === 'phone') next.hero.ctaPrimary = business.whatsapp ? 'whatsapp' : 'quote';
  if (!business.whatsapp && next.hero.ctaSecondary === 'whatsapp') next.hero.ctaSecondary = business.phone ? 'phone' : 'quote';
  return next;
}

function normalizeCopy(value: unknown, business: BusinessData): SiteCopy | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  const faq = Array.isArray(v.faq)
    ? v.faq.slice(0, 5).map((item) => {
        if (!item || typeof item !== 'object') return null;
        const x = item as Record<string, unknown>;
        return typeof x.question === 'string' && typeof x.answer === 'string'
          ? { question: x.question.trim(), answer: x.answer.trim() }
          : null;
      }).filter(Boolean) as SiteCopy['faq']
    : [];

  const fields = ['heroEyebrow', 'heroTitle', 'heroDescription', 'servicesTitle', 'servicesLead', 'reviewsTitle', 'contactTitle', 'contactLead', 'footerTagline'];
  if (!fields.every((key) => typeof v[key] === 'string' && String(v[key]).trim())) return null;
  if (faq.length < 3) return null;

  const rawDescriptions = Array.isArray(v.serviceDescriptions)
    ? v.serviceDescriptions
    : [];

  const serviceDescriptionMap = new Map<string, string>();
  for (const item of rawDescriptions) {
    if (!item || typeof item !== 'object') continue;
    const x = item as Record<string, unknown>;
    if (typeof x.service === 'string' && typeof x.description === 'string' && x.service.trim() && x.description.trim()) {
      serviceDescriptionMap.set(x.service.trim(), x.description.trim());
    }
  }

  const serviceDescriptions = Object.fromEntries(
    business.services.map((service) => [
      service.name,
      serviceDescriptionMap.get(service.name)
        || service.description
        || `Servicio profesional de ${service.name.toLowerCase()} en ${business.city}.`,
    ]),
  );

  return {
    heroEyebrow: String(v.heroEyebrow).trim(),
    heroTitle: String(v.heroTitle).trim(),
    heroDescription: String(v.heroDescription).trim(),
    servicesTitle: String(v.servicesTitle).trim(),
    servicesLead: String(v.servicesLead).trim(),
    reviewsTitle: String(v.reviewsTitle).trim(),
    contactTitle: String(v.contactTitle).trim(),
    contactLead: String(v.contactLead).trim(),
    footerTagline: String(v.footerTagline).trim(),
    serviceDescriptions,
    faq,
  };
}

/**
 * JSON schema sent to Gemini so the model returns data that matches our renderer contract.
 * Keeping this closed is deliberate: Gemini chooses from our catalog instead of inventing CSS/IDs.
 */
const generationSchema = {
  type: 'object',
  properties: {
    design: {
      type: 'object',
      properties: {
        layout: { type: 'string', enum: ['L1', 'L2', 'L3', 'L4', 'L5'] },
        palette: { type: 'string', enum: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'] },
        font: { type: 'string', enum: ['F1', 'F2', 'F3', 'F4'] },
        hero: {
          type: 'object',
          properties: {
            variant: { type: 'string', enum: ['H1', 'H2', 'H3', 'H4'] },
            imagePosition: { type: 'string', enum: ['right', 'below', 'background', 'side'] },
            overlay: { type: 'boolean' },
            ctaPrimary: { type: 'string', enum: ['phone', 'whatsapp', 'quote'] },
            ctaSecondary: { type: 'string', enum: ['phone', 'whatsapp', 'quote'] },
          },
          required: ['variant', 'imagePosition', 'overlay', 'ctaPrimary'],
        },
        services: {
          type: 'object',
          properties: {
            variant: { type: 'string', enum: ['S1', 'S2', 'S3', 'S4'] },
            columns: { type: 'string', enum: ['1', '2', '3', '4'] },
          },
          required: ['variant', 'columns'],
        },
        reviews: {
          type: 'object',
          properties: {
            variant: { type: 'string', enum: ['R1', 'R2', 'R3'] },
            showRating: { type: 'boolean' },
          },
          required: ['variant', 'showRating'],
        },
        faq: {
          type: 'object',
          properties: { variant: { type: 'string', enum: ['Q1', 'Q2'] } },
          required: ['variant'],
        },
        contact: {
          type: 'object',
          properties: { variant: { type: 'string', enum: ['C1', 'C2', 'C3'] } },
          required: ['variant'],
        },
        footer: {
          type: 'object',
          properties: { variant: { type: 'string', enum: ['T1', 'T2'] } },
          required: ['variant'],
        },
        density: { type: 'string', enum: ['compact', 'medium', 'airy'] },
        radius: { type: 'string', enum: ['sharp', 'medium', 'round'] },
      },
      required: ['layout', 'palette', 'font', 'hero', 'services', 'reviews', 'faq', 'contact', 'footer', 'density', 'radius'],
    },
    copy: {
      type: 'object',
      properties: {
        heroEyebrow: { type: 'string' },
        heroTitle: { type: 'string' },
        heroDescription: { type: 'string' },
        servicesTitle: { type: 'string' },
        servicesLead: { type: 'string' },
        reviewsTitle: { type: 'string' },
        contactTitle: { type: 'string' },
        contactLead: { type: 'string' },
        footerTagline: { type: 'string' },
        serviceDescriptions: {
          type: 'array',
          minItems: 2,
          maxItems: 6,
          items: {
            type: 'object',
            properties: {
              service: { type: 'string' },
              description: { type: 'string' },
            },
            required: ['service', 'description'],
          },
        },
        faq: {
          type: 'array',
          minItems: 3,
          maxItems: 5,
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' },
            },
            required: ['question', 'answer'],
          },
        },
      },
      required: ['heroEyebrow', 'heroTitle', 'heroDescription', 'servicesTitle', 'servicesLead', 'reviewsTitle', 'contactTitle', 'contactLead', 'footerTagline', 'serviceDescriptions', 'faq'],
    },
  },
  required: ['design', 'copy'],
} as const;

function extractInteractionText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return '';
  const root = payload as Record<string, unknown>;
  const steps = Array.isArray(root.steps) ? root.steps : [];
  const chunks: string[] = [];

  for (const step of steps) {
    if (!step || typeof step !== 'object') continue;
    const content = (step as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (!block || typeof block !== 'object') continue;
      const item = block as Record<string, unknown>;
      if (item.type === 'text' && typeof item.text === 'string') chunks.push(item.text);
    }
  }

  return chunks.join('').trim();
}

export async function generateWithAI(business: BusinessData): Promise<GenerationResult> {
  const fallbackDesign = chooseDesign(business);
  const fallback = fallbackCopy(business);
  const key = process.env.GEMINI_API_KEY?.trim();

  if (!key) {
    return {
      business: { ...business, copy: fallback },
      design: fallbackDesign,
      copy: fallback,
      mode: 'fallback',
      diagnostics: {
        configured: false,
        attempted: false,
        ok: false,
        latencyMs: 0,
        error: 'GEMINI_API_KEY no está configurada en .env.local.',
      },
    };
  }

  const prompt = `${DESIGN_DIRECTOR_SYSTEM}\n\nReturn exactly one JSON object with top-level keys 'design' and 'copy'.\nThe design MUST use only IDs from the closed catalog. The copy must contain heroEyebrow, heroTitle, heroDescription, servicesTitle, servicesLead, reviewsTitle, contactTitle, contactLead, footerTagline, serviceDescriptions as an array of objects {service, description}, and 3-5 FAQ entries.\nWrite natural Spanish for Spain. Keep the copy concrete and conversion-focused. Never invent facts, prices, awards, certifications, response times, years in business, guarantees, or service areas. Only use facts from the BUSINESS input.\n\nBUSINESS:\n${designDirectorInput(business)}\n`;

  const models = configuredModels();
  let lastError = 'No se pudo contactar con Gemini.';
  let lastStatus: number | undefined;
  let lastModel = models[0] || DEFAULT_MODEL;
  const startedAll = Date.now();

  for (let modelIndex = 0; modelIndex < models.length; modelIndex += 1) {
    const model = models[modelIndex];
    const started = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
      let response: Response;
      try {
        response = await fetch(GEMINI_INTERACTIONS_ENDPOINT, {
          method: 'POST',
          cache: 'no-store',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            model,
            system_instruction: DESIGN_DIRECTOR_SYSTEM,
            input: prompt,
            generation_config: {
              thinking_level: GEMINI_THINKING_LEVEL,
              max_output_tokens: 2200,
            },
            response_format: {
              type: 'text',
              mime_type: 'application/json',
              schema: generationSchema,
            },
          }),
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const latencyMs = Date.now() - started;

      if (!response.ok) {
        let detail = `Gemini devolvió HTTP ${response.status}.`;
        try {
          const errorPayload = await response.json() as { error?: { message?: string } };
          if (errorPayload?.error?.message) detail = errorPayload.error.message;
        } catch {
          // Keep the generic HTTP error if the body is not JSON.
        }
        lastError = detail;
        lastStatus = response.status;
        lastModel = model;

        if (isAvailabilityError(response.status, detail) && modelIndex < models.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
          continue;
        }

        return {
          business: { ...business, copy: fallback },
          design: fallbackDesign,
          copy: fallback,
          mode: 'fallback',
          model,
          diagnostics: {
            configured: true,
            attempted: true,
            ok: false,
            latencyMs: Date.now() - startedAll,
            httpStatus: response.status,
            error: detail,
          },
        };
      }

      const payload = await response.json();
      const raw = extractInteractionText(payload);
      const parsed = extractJson(raw);

      if (!parsed || typeof parsed !== 'object') {
        lastError = 'Gemini respondió, pero no devolvió el JSON esperado.';
        lastStatus = response.status;
        lastModel = model;
        if (modelIndex < models.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
      } else {
        const root = parsed as Record<string, unknown>;
        let design: DesignSpec | null = null;
        if (root.design && typeof root.design === 'object') {
          const candidate = structuredClone(root.design) as Record<string, any>;
          if (candidate.services && typeof candidate.services === 'object' && typeof candidate.services.columns === 'string') {
            const parsedColumns = Number(candidate.services.columns);
            if (Number.isInteger(parsedColumns)) candidate.services.columns = parsedColumns;
          }
          design = isDesignSpec(candidate) ? enforceTruthfulDesign(candidate, business) : null;
        }
        const copy = normalizeCopy(root.copy, business);

        if (design && copy) {
          return {
            business: { ...business, copy },
            design,
            copy,
            mode: 'ai',
            model,
            diagnostics: {
              configured: true,
              attempted: true,
              ok: true,
              latencyMs: Date.now() - startedAll,
              httpStatus: response.status,
              thinkingLevel: GEMINI_THINKING_LEVEL,
              timeoutMs: GEMINI_TIMEOUT_MS,
            },
          };
        }

        lastError = 'Gemini devolvió JSON, pero no cumple el contrato de diseño/copy.';
        lastStatus = response.status;
        lastModel = model;
        if (modelIndex < models.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
      }

      return {
        business: { ...business, copy: fallback },
        design: fallbackDesign,
        copy: fallback,
        mode: 'fallback',
        model: lastModel,
        diagnostics: {
          configured: true,
          attempted: true,
          ok: false,
          latencyMs: Date.now() - startedAll,
          httpStatus: lastStatus,
          error: lastError,
          thinkingLevel: GEMINI_THINKING_LEVEL,
          timeoutMs: GEMINI_TIMEOUT_MS,
        },
      };
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError';
      const detail = aborted
        ? `Tiempo de espera agotado (${Math.round(GEMINI_TIMEOUT_MS / 1000)} s) al llamar a ${model}.`
        : (error instanceof Error ? error.message : 'Error de red al llamar a Gemini.');
      lastError = detail;
      lastModel = model;
      if (modelIndex < models.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      return {
        business: { ...business, copy: fallback },
        design: fallbackDesign,
        copy: fallback,
        mode: 'fallback',
        model,
        diagnostics: {
          configured: true,
          attempted: true,
          ok: false,
          latencyMs: Date.now() - startedAll,
          error: detail,
          thinkingLevel: GEMINI_THINKING_LEVEL,
          timeoutMs: GEMINI_TIMEOUT_MS,
        },
      };
    }
  }

  return {
    business: { ...business, copy: fallback },
    design: fallbackDesign,
    copy: fallback,
    mode: 'fallback',
    model: lastModel,
    diagnostics: {
      configured: true,
      attempted: true,
      ok: false,
      latencyMs: Date.now() - startedAll,
      httpStatus: lastStatus,
      error: lastError,
    },
  };

}
