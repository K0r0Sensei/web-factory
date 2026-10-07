import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import type { BusinessData, DesignSpec } from '../types/design';

export type DemoRecord = {
  slug: string;
  createdAt: string;
  business: BusinessData;
  design: DesignSpec;
};

const STORE_DIR = path.join(process.cwd(), '.data', 'demos');

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 72) || 'negocio';
}

function fileFor(slug: string) { return path.join(STORE_DIR, `${slug}.json`); }

function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function saveDemo(input: { business: BusinessData; design: DesignSpec }) {
  const slug = slugify(`${input.business.businessName}-${input.business.city}`);
  const createdAt = new Date().toISOString();
  const record: DemoRecord = { slug, createdAt, business: input.business, design: input.design };

  const supabase = supabaseServer();
  if (supabase) {
    const { error } = await supabase.from('demos').upsert({
      slug,
      created_at: createdAt,
      business: input.business,
      design: input.design,
    });
    if (error) throw new Error(`Supabase: ${error.message}`);
    return record;
  }

  // Local fallback is useful for development only. Production should use Supabase.
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(fileFor(slug), JSON.stringify(record, null, 2), 'utf8');
  return record;
}

export async function getDemo(slug: string): Promise<DemoRecord | null> {
  const supabase = supabaseServer();
  if (supabase) {
    const { data, error } = await supabase.from('demos').select('slug, created_at, business, design').eq('slug', slug).maybeSingle();
    if (error) throw new Error(`Supabase: ${error.message}`);
    if (!data) return null;
    return {
      slug: data.slug,
      createdAt: data.created_at,
      business: data.business as BusinessData,
      design: data.design as DesignSpec,
    };
  }

  try { return JSON.parse(await readFile(fileFor(slug), 'utf8')) as DemoRecord; }
  catch { return null; }
}
