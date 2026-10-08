import { notFound } from 'next/navigation';
import { GeneratedSite } from '../../../src/engine/renderer';
import { ProposalLeadForm } from '../../../src/components/proposal-lead-form';
import { getDemo } from '../../../src/server/demo-store';

export const dynamic = 'force-dynamic';

export default async function ProposalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = await getDemo(slug);
  if (!demo) notFound();

  const highlights = [
    'Diseñada para móvil',
    'Botón de llamada y WhatsApp',
    'Formulario de contacto',
    'SEO técnico básico',
  ];

  return (
    <div className="proposal-page">
      <section className="proposal-intro">
        <div className="proposal-intro-inner">
          <div className="proposal-copy">
            <span className="kicker">PROPUESTA PERSONALIZADA</span>
            <h1>Una nueva web para {demo.business.businessName}.</h1>
            <p>Hemos preparado esta versión a partir de la información pública de tu negocio, pensando en que más personas puedan encontrarte, entender lo que haces y contactarte rápidamente.</p>
            <div className="proposal-trust-row">
              <span>✓ Sin compromiso</span><span>✓ Propuesta personalizada</span><span>✓ Lista para móvil</span>
            </div>
          </div>
          <div className="proposal-actions" id="contacto-propuesta">
            <a className="proposal-btn proposal-btn-primary" href="#quiero-esta-web">Quiero esta web</a>
            <a className="proposal-btn proposal-btn-secondary" href={`/demo/${demo.slug}`} target="_blank" rel="noreferrer">Ver solo la web</a>
          </div>
        </div>
      </section>

      <div className="proposal-note">Vista previa · {demo.business.city} · Generada automáticamente · {demo.design.layout} / {demo.design.palette}</div>
      <div className="proposal-site"><GeneratedSite business={demo.business} design={demo.design} /></div>

      <section className="proposal-offer">
        <div>
          <span className="kicker">HECHA PARA ESTE NEGOCIO</span>
          <h2>No es una plantilla genérica.</h2>
          <p>La propuesta utiliza los servicios, ubicación, reputación y datos disponibles de {demo.business.businessName}. Si te encaja, podemos adaptarla con tu dominio, tus fotos y la información definitiva.</p>
          <div className="proposal-highlights">
            {highlights.map((item) => <span key={item}>✓ {item}</span>)}
          </div>
        </div>
        <div className="proposal-offer-card">
          <span className="proposal-offer-label">SIGUIENTE PASO</span>
          <strong>¿Te gusta cómo ha quedado?</strong>
          <p>Déjanos tus datos y te contactaremos para terminar de adaptar la propuesta y explicarte cómo ponerla online.</p>
          <a className="proposal-btn proposal-btn-primary" href="#quiero-esta-web">Hablar sobre la propuesta</a>
        </div>
      </section>

      <section className="proposal-contact" id="quiero-esta-web">
        <div className="proposal-contact-inner">
          <div>
            <span className="kicker">SIN COMPROMISO</span>
            <h2>¿Quieres que la preparemos para publicar?</h2>
            <p>Déjanos un contacto y te respondemos para concretar los últimos detalles.</p>
          </div>
          <div className="proposal-contact-card">
            <ProposalLeadForm slug={demo.slug} />
          </div>
        </div>
      </section>

      <a className="proposal-mobile-cta" href="#quiero-esta-web">Quiero esta web →</a>
    </div>
  );
}
