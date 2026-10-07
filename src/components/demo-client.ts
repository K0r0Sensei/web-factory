import type { BusinessData, DesignSpec } from '../types/design';

export type GeneratedForDemo = { business: BusinessData; design: DesignSpec };

export async function savePublicDemo(generated: GeneratedForDemo) {
  const response = await fetch('/api/demos', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(generated),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo crear el enlace público.');
  return data as { slug: string; demoPath: string; proposalPath: string; createdAt: string };
}
