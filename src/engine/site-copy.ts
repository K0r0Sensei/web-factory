import type { BusinessData } from '../types/design';
import type { SiteCopy } from '../types/site-content';

export function fallbackCopy(business: BusinessData): SiteCopy {
  const emergency = Boolean(business.emergency24h);
  return {
    heroEyebrow: emergency ? `Urgencias 24h en ${business.city}` : `Fontanería profesional en ${business.city}`,
    heroTitle: emergency ? 'Una avería no puede esperar.' : 'Fontanería clara, profesional y bien resuelta.',
    heroDescription: business.description || `Servicios de fontanería para hogares y negocios en ${business.city}. Atención directa, trabajo limpio y presupuestos claros.`,
    servicesTitle: 'Soluciones de fontanería sin complicaciones.',
    servicesLead: 'Desde una urgencia hasta una instalación completa, con atención directa y presupuestos claros.',
    reviewsTitle: 'Lo que dicen nuestros clientes.',
    contactTitle: '¿Tienes una avería o necesitas una instalación?',
    contactLead: 'Cuéntanos qué necesitas y te orientamos sobre el siguiente paso.',
    footerTagline: 'Servicio local, atención directa.',
    serviceDescriptions: Object.fromEntries(business.services.map((service) => [service.name, service.description || `Servicio profesional de ${service.name.toLowerCase()} en ${business.city}.`])),
    faq: [
      { question: emergency ? '¿Atendéis urgencias 24h?' : '¿Trabajáis con urgencias?', answer: emergency ? 'Sí. Puedes llamar directamente para confirmar disponibilidad.' : 'Puedes llamar directamente para confirmar disponibilidad.' },
      { question: '¿Hacéis presupuestos?', answer: 'Sí. Te explicamos el trabajo y el siguiente paso antes de empezar.' },
      { question: '¿En qué zonas trabajáis?', answer: `Atendemos ${business.city} y las zonas indicadas en esta web.` },
    ],
  };
}
