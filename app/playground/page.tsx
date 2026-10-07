import Link from 'next/link';
import { GeneratedSite } from '../../src/engine/renderer';
import { exampleBusiness, getDesignForLayout } from '../../src/data/example-business';
import type { LayoutId } from '../../src/types/design';

const layouts: LayoutId[] = ['L1', 'L2', 'L3', 'L4', 'L5'];

export default async function Playground({ searchParams }: { searchParams: Promise<{ layout?: string }> }) {
  const params = await searchParams;
  const layout = layouts.includes(params.layout as LayoutId) ? (params.layout as LayoutId) : 'L3';
  const design = getDesignForLayout(layout);

  return (
    <div>
      <div className="playground-toolbar">
        <div className="playground-toolbar-inner">
          <div><strong>Web Factory · Design Playground</strong><span> / {layout}</span></div>
          <div className="playground-tabs">
            {layouts.map((id) => <Link className={id === layout ? 'active' : ''} key={id} href={`/playground?layout=${id}`}>{id}</Link>)}
          </div>
        </div>
      </div>
      <GeneratedSite business={exampleBusiness} design={design} />
    </div>
  );
}
