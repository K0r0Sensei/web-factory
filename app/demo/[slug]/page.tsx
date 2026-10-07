import { notFound } from 'next/navigation';
import { GeneratedSite } from '../../../src/engine/renderer';
import { getDemo } from '../../../src/server/demo-store';

export const dynamic = 'force-dynamic';

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = await getDemo(slug);
  if (!demo) notFound();
  return <GeneratedSite business={demo.business} design={demo.design} />;
}
