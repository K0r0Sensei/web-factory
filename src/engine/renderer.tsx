import type { BusinessData, DesignSpec, LayoutId } from '../types/design';
import type { ReactNode } from 'react';
import { fontMap, paletteMap } from './theme';
import { fallbackCopy } from './site-copy';

type SiteProps = { business: BusinessData; design: DesignSpec };

function copyFor(business: BusinessData) { return business.copy ?? fallbackCopy(business); }

function ctaHref(kind: 'phone' | 'whatsapp' | 'quote', business: BusinessData) {
  if (kind === 'phone') return `tel:${business.phone}`;
  if (kind === 'whatsapp') return business.whatsapp ? `https://wa.me/${business.whatsapp.replace(/\D/g, '')}` : `tel:${business.phone}`;
  return '#contacto';
}

function ctaLabel(kind: 'phone' | 'whatsapp' | 'quote') {
  if (kind === 'phone') return 'Llamar ahora';
  if (kind === 'whatsapp') return 'WhatsApp';
  return 'Solicitar presupuesto';
}

function HeroMedia({ business, className = '' }: { business: BusinessData; className?: string }) {
  const hasImage = Boolean(business.imageUrls?.[0]);
  return (
    <div className={`hero-media ${className}`} aria-label="Imagen del negocio">
      {hasImage ? <img src={business.imageUrls?.[0]} alt="Servicio de fontanería" loading="eager" /> : <div className="hero-media-fallback" />}
      <div className="media-badge">
        <strong>{business.rating?.toFixed(1) ?? '4.8'}</strong>
        <span>★ · {business.reviewsCount ?? 0}+ reseñas</span>
      </div>
    </div>
  );
}

function Header({ business, design }: SiteProps) {
  const copy = copyFor(business);
  return (
    <header className={`site-nav nav-${design.layout}`}>
      <div className="container nav-inner">
        <div className="brand-wrap">
          <div className="brand-mark">FG</div>
          <div>
            <div className="brand">{business.businessName}</div>
            <div className="brand-sub">Fontanería · {business.city}</div>
          </div>
        </div>
        <nav className="nav-links" aria-label="Principal">
          <a href="#servicios">Servicios</a>
          <a href="#opiniones">Opiniones</a>
          <a href="#contacto">Contacto</a>
        </nav>
        <div className="nav-actions">
          <a className="btn btn-secondary" href={ctaHref('whatsapp', business)}>WhatsApp</a>
          <a className="btn btn-primary" href={ctaHref(design.hero.ctaPrimary, business)}>{ctaLabel(design.hero.ctaPrimary)}</a>
        </div>
      </div>
    </header>
  );
}

function TrustStrip({ business }: { business: BusinessData }) {
  return (
    <section className="trust-strip">
      <div className="container trust-inner">
        {(business.differentiators ?? ['Respuesta rápida', 'Presupuesto claro', 'Profesionales con experiencia']).slice(0, 3).map((item, index) => (
          <div className="trust-item" key={item}><span className="trust-icon">0{index + 1}</span><span>{item}</span></div>
        ))}
      </div>
    </section>
  );
}

function Services({ business, variant }: { business: BusinessData; variant: DesignSpec['services']['variant'] }) {
  const copy = copyFor(business);
  const services = business.services.slice(0, 6);
  const className = variant === 'S3' ? 'services-list' : variant === 'S4' ? 'services-featured' : 'grid-3';
  return (
    <section className="section" id="servicios">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="kicker">SERVICIOS</span>
            <h2>{copy.servicesTitle}</h2>
          </div>
          <p className="section-lead">{copy.servicesLead}</p>
        </div>
        <div className={className}>
          {services.map((service, index) => (
            <article className={`service-card service-${index + 1}`} key={service.name}>
              <div className="service-index">0{index + 1}</div>
              <h3>{service.name}</h3>
              <p>{copyFor(business).serviceDescriptions[service.name] ?? service.description ?? `Servicio profesional de ${service.name.toLowerCase()} en ${business.city}.`}</p>
              <a href="#contacto" className="text-link">Quiero información →</a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Reviews({ business, variant, showRating }: { business: BusinessData; variant: DesignSpec['reviews']['variant']; showRating: boolean }) {
  const copy = copyFor(business);
  const quotes = [
    'Rápidos y profesionales. Solucionaron la fuga el mismo día.',
    'Muy buena atención y presupuesto claro desde el principio.',
    'Llegaron puntuales y dejaron todo limpio al terminar.'
  ];
  return (
    <section className={`section section-alt reviews-${variant}`} id="opiniones">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="kicker">CONFIANZA</span>
            <h2>{copy.reviewsTitle}</h2>
          </div>
          {showRating && <div className="rating-lockup"><span className="rating-number">{business.rating?.toFixed(1) ?? '4.8'}</span><span>★ ★ ★ ★ ★<br /><small>{business.reviewsCount ?? 0}+ opiniones</small></span></div>}
        </div>
        <div className="reviews-grid">
          {quotes.map((quote, index) => (
            <article className="review-card" key={quote}>
              <div className="review-stars">★★★★★</div>
              <div className="quote">“{quote}”</div>
              <div className="small">Cliente verificado · {['Madrid', 'Chamartín', 'Retiro'][index]}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Areas({ business }: { business: BusinessData }) {
  if (!business.serviceAreas?.length) return null;
  return (
    <section className="section areas-section">
      <div className="container areas-wrap">
        <div>
          <span className="kicker">ZONA DE SERVICIO</span>
          <h2>Estamos cerca de ti.</h2>
          <p className="section-lead">Atendemos {business.city} y alrededores.</p>
        </div>
        <div className="areas-list">
          {business.serviceAreas.map((area) => <span key={area}>{area}</span>)}
        </div>
      </div>
    </section>
  );
}

function FAQ({ business }: { business: BusinessData }) {
  const items = copyFor(business).faq;
  return (
    <section className="section faq-section">
      <div className="container faq-wrap">
        <div>
          <span className="kicker">PREGUNTAS</span>
          <h2>Antes de llamar.</h2>
        </div>
        <div className="faq-list">
          {items.map(({ question, answer }) => (
            <details key={question}><summary>{question}</summary><p>{answer}</p></details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({ business, variant }: { business: BusinessData; variant: DesignSpec['contact']['variant'] }) {
  const copy = copyFor(business);
  return (
    <section className={`section contact-section contact-${variant}`} id="contacto">
      <div className="container contact-wrap">
        <div className="contact-copy">
          <span className="kicker">CONTACTO</span>
          <h2>{copy.contactTitle}</h2>
          <p className="section-lead">{copy.contactLead}</p>
          <div className="contact-actions">
            <a className="btn btn-primary btn-large" href={ctaHref('phone', business)}>Llamar al {business.phone}</a>
            <a className="btn btn-secondary btn-large" href={ctaHref('whatsapp', business)}>Escribir por WhatsApp</a>
          </div>
          <div className="contact-meta"><strong>{business.city}</strong><span>{business.hours?.join(' · ')}</span></div>
        </div>
        <div className="contact-panel">
          <h3>Solicita presupuesto</h3>
          <p>Déjanos tus datos y te contactamos.</p>
          <form className="form">
            <input className="input" placeholder="Nombre" />
            <input className="input" placeholder="Teléfono" />
            <textarea className="input" rows={5} placeholder="¿Qué necesitas?" />
            <button className="btn btn-primary" type="button">Enviar solicitud</button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer({ business }: { business: BusinessData }) {
  const copy = copyFor(business);
  return <footer className="footer"><div className="container footer-inner"><div><strong>{business.businessName}</strong><span>{business.city} · {business.phone}</span></div><span>{copy.footerTagline}</span></div></footer>;
}

function LayoutL1({ business, design }: SiteProps) {
  return <>
    <section className="hero hero-l1"><div className="container split-hero"><div className="hero-copy"><span className="eyebrow">{copyFor(business).heroEyebrow}</span><h1>{copyFor(business).heroTitle}</h1><p>{copyFor(business).heroDescription}</p><div className="hero-actions"><a className="btn btn-primary btn-large" href={ctaHref(design.hero.ctaPrimary, business)}>{ctaLabel(design.hero.ctaPrimary)}</a><a className="btn btn-secondary btn-large" href="#contacto">Ver servicios</a></div><div className="hero-proof">{business.rating?.toFixed(1) ?? '4.8'} ★ · {business.reviewsCount ?? 0}+ opiniones</div></div><HeroMedia business={business} /></div></section>
    <TrustStrip business={business} /><Services business={business} variant="S1" /><Reviews business={business} variant="R1" showRating /><Areas business={business} /><FAQ business={business} /><Contact business={business} variant="C1" />
  </>;
}

function LayoutL2({ business, design }: SiteProps) {
  return <>
    <section className="hero hero-l2"><div className="container centered-hero"><span className="eyebrow">{copyFor(business).heroEyebrow}</span><h1>{copyFor(business).heroTitle}</h1><p>{copyFor(business).heroDescription}</p><div className="hero-actions centered"><a className="btn btn-primary btn-large" href={ctaHref('quote', business)}>Solicitar presupuesto</a><a className="btn btn-secondary btn-large" href={ctaHref('phone', business)}>Hablar ahora</a></div><div className="hero-stat-row"><div><strong>{business.rating?.toFixed(1) ?? '4.8'}</strong><span>valoración media</span></div><div><strong>{business.reviewsCount ?? 0}+</strong><span>opiniones</span></div><div><strong>{business.services.length}</strong><span>servicios</span></div></div></div></section>
    <Services business={business} variant="S2" /><Reviews business={business} variant="R2" showRating /><Areas business={business} /><FAQ business={business} /><Contact business={business} variant="C2" />
  </>;
}

function LayoutL3({ business, design }: SiteProps) {
  return <>
    <section className="hero hero-l3"><HeroMedia business={business} className="hero-media-bg" /><div className="hero-overlay" /><div className="container emergency-hero"><span className="eyebrow eyebrow-alert">{copyFor(business).heroEyebrow}</span><h1>{copyFor(business).heroTitle}</h1><p>{copyFor(business).heroDescription}</p><div className="hero-actions"><a className="btn btn-primary btn-large" href={ctaHref('phone', business)}>Llamar ahora</a><a className="btn btn-secondary btn-large" href={ctaHref('whatsapp', business)}>WhatsApp</a></div><div className="hero-emergency-note">Respuesta rápida · {business.city} · 24 horas</div></div></section>
    <TrustStrip business={business} /><Services business={business} variant="S1" /><Reviews business={business} variant="R1" showRating /><FAQ business={business} /><Contact business={business} variant="C3" />
  </>;
}

function LayoutL4({ business, design }: SiteProps) {
  return <>
    <section className="hero hero-l4"><div className="container split-hero reverse"><div className="hero-copy"><span className="eyebrow">{copyFor(business).heroEyebrow}</span><h1>{copyFor(business).heroTitle}</h1><p>{copyFor(business).heroDescription}</p><div className="hero-actions"><a className="btn btn-primary btn-large" href={ctaHref('phone', business)}>Llamar ahora</a><a className="btn btn-secondary btn-large" href="#opiniones">Ver opiniones</a></div></div><div className="local-proof"><div className="local-score">{business.rating?.toFixed(1) ?? '4.8'}<span>/5</span></div><div className="review-stars">★★★★★</div><p>{business.reviewsCount ?? 0}+ clientes nos han valorado.</p><div className="mini-areas">{business.serviceAreas?.slice(0, 5).map((area) => <span key={area}>{area}</span>)}</div></div></div></section>
    <Reviews business={business} variant="R1" showRating /><Services business={business} variant="S4" /><Areas business={business} /><FAQ business={business} /><Contact business={business} variant="C1" />
  </>;
}

function LayoutL5({ business, design }: SiteProps) {
  return <>
    <section className="hero hero-l5"><div className="container editorial-hero"><div className="editorial-copy"><span className="eyebrow">{copyFor(business).heroEyebrow}</span><h1>{copyFor(business).heroTitle}</h1><p>{copyFor(business).heroDescription}</p><div className="hero-actions"><a className="btn btn-primary btn-large" href={ctaHref('quote', business)}>Solicitar presupuesto</a></div></div><HeroMedia business={business} /></div></section>
    <section className="editorial-intro"><div className="container"><span className="kicker">SERVICIO</span><p>Reparación, mantenimiento e instalaciones para hogares y negocios que valoran un trabajo bien hecho.</p></div></section>
    <Services business={business} variant="S2" /><Reviews business={business} variant="R2" showRating /><FAQ business={business} /><Contact business={business} variant="C1" />
  </>;
}

const layouts: Record<LayoutId, (props: SiteProps) => ReactNode> = { L1: LayoutL1, L2: LayoutL2, L3: LayoutL3, L4: LayoutL4, L5: LayoutL5 };

export function GeneratedSite({ business, design }: SiteProps) {
  const palette = paletteMap[design.palette];
  const font = fontMap[design.font];
  const Layout = layouts[design.layout] ?? LayoutL3;
  const cssVars = {
    '--surface': palette.surface,
    '--text': palette.text,
    '--primary': palette.primary,
    '--accent': palette.accent,
    '--muted': palette.muted,
    '--card': palette.card,
    '--border': palette.border,
    '--font-heading': font.heading,
    '--font-body': font.body,
    '--radius': design.radius === 'sharp' ? '8px' : design.radius === 'round' ? '28px' : '16px',
    '--section-space': design.density === 'compact' ? '64px' : design.density === 'airy' ? '108px' : '84px',
  } as React.CSSProperties;

  return <div style={cssVars} className={`site-root ${design.layout.toLowerCase()} density-${design.density} radius-${design.radius}`}>
    <Header business={business} design={design} />
    <main><Layout business={business} design={design} /></main>
    <Footer business={business} />
  </div>;
}
