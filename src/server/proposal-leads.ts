import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

export type ProposalLead = {
  id: string;
  slug: string;
  createdAt: string;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  source?: string;
};

const STORE_DIR = path.join(process.cwd(), '.data', 'proposal-leads');

function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function safeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveProposalLead(input: Omit<ProposalLead, 'id' | 'createdAt'>) {
  const id = safeId();
  const createdAt = new Date().toISOString();
  const record: ProposalLead = { id, createdAt, ...input };

  const supabase = supabaseServer();
  if (supabase) {
    const { error } = await supabase.from('proposal_leads').insert({
      id,
      slug: input.slug,
      created_at: createdAt,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      message: input.message ?? null,
      source: input.source ?? 'proposal',
    });
    if (error) throw new Error(`Supabase: ${error.message}`);
    return record;
  }

  await mkdir(STORE_DIR, { recursive: true });
  const file = path.join(STORE_DIR, `${id}.json`);
  await writeFile(file, JSON.stringify(record, null, 2), 'utf8');
  return record;
}

export async function listProposalLeads(): Promise<ProposalLead[]> {
  const supabase = supabaseServer();
  if (supabase) {
    const { data, error } = await supabase.from('proposal_leads')
      .select('id, slug, created_at, name, email, phone, message, source')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Supabase: ${error.message}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      createdAt: row.created_at,
      name: row.name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      message: row.message ?? undefined,
      source: row.source ?? undefined,
    }));
  }

  try {
    const files = (await import('node:fs')).readdirSync(STORE_DIR).filter((f) => f.endsWith('.json'));
    const rows = await Promise.all(files.map(async (f) => JSON.parse(await readFile(path.join(STORE_DIR, f), 'utf8')) as ProposalLead));
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}
