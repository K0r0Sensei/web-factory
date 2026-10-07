import { notFound } from 'next/navigation';
import { GeneratedSite } from '../../../src/engine/renderer';
import { getDemo } from '../../../src/server/demo-store';

export const dynamic = 'force-dynamic';

function contactHref() {
  const email = process.env.WEB_FACTORY_CONTACT_EMAIL;
  return email ? `mailto:${email}?subject=Me interesa la web de mi negocio` : '#contacto-propuesta';
}

export default async function ProposalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = await getDemo(slug);
  if (!demo) notFound();
  const contact = contactHref();
  return (
    <div className="proposal-page">
      <section className="proposal-intro">
        <div className="proposal-intro-inner">
          <div>
            <span className="kicker">PROPUESTA PERSONALIZADA</span>
            <h1>Hemos preparado una nueva web para {demo.business.businessName}.</h1>
            <p>Una propuesta pensada para que los clientes encuentren el negocio, entiendan los servicios y puedan llamar o escribir fácilmente.</p>
          </div>
          <div className="proposal-actions" id="contacto-propuesta">
            <a className="proposal-btn proposal-btn-primary" href={contact}>Quiero esta web</a>
            <a className="proposal-btn proposal-btn-secondary" href={`/demo/${demo.slug}`} target="_blank" rel="noreferrer">Abrir solo la web</a>
          </div>
        </div>
      </section>
      <div className="proposal-note">Vista previa · {demo.business.city} · Generada automáticamente · {demo.design.layout}</div>
      <div className="proposal-site"><GeneratedSite business={demo.business} design={demo.design} /></div>
      <section className="proposal-bottom">
        <div>
          <span className="kicker">SIGUIENTE PASO</span>
          <h2>¿Te gusta esta propuesta?</h2>
          <p>Podemos publicarla con tu dominio, dejarla preparada para móvil y mantenerla actualizada.</p>
        </div>
        <a className="proposal-btn proposal-btn-primary" href={contact}>Quiero esta web</a>
      </section>
    </div>
  );
}
