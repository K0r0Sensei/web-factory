import type { BusinessData, DesignSpec, LayoutId } from '../types/design';

export const exampleBusiness: BusinessData = {
  id: 'fontaneria-garcia-madrid',
  businessName: 'Fontanería García',
  city: 'Madrid',
  province: 'Madrid',
  phone: '+34910000000',
  whatsapp: '+34600000000',
  hours: ['Lunes - Viernes: 08:00 - 20:00', 'Urgencias: 24 horas'],
  description: 'Servicios de fontanería para hogares y negocios en Madrid, con atención rápida y presupuestos claros.',
  services: [
    { name: 'Urgencias 24h', description: 'Atención rápida para averías y fugas.' },
    { name: 'Desatascos', description: 'Localización y resolución de atascos.' },
    { name: 'Reparación de fugas', description: 'Detección y reparación de fugas de agua.' },
    { name: 'Instalaciones', description: 'Montaje y renovación de instalaciones.' }
  ],
  serviceAreas: ['Madrid Centro', 'Salamanca', 'Chamartín', 'Retiro', 'Moncloa'],
  rating: 4.8,
  reviewsCount: 127,
  differentiators: ['Respuesta rápida', 'Presupuesto claro', 'Profesionales con experiencia'],
  emergency24h: true
};

const baseDesign: Omit<DesignSpec, 'layout' | 'palette' | 'font' | 'hero'> = {
  services: { variant: 'S1', columns: 3 },
  reviews: { variant: 'R1', showRating: true },
  faq: { variant: 'Q1' },
  contact: { variant: 'C1' },
  footer: { variant: 'T1' },
  density: 'medium',
  radius: 'medium'
};

export function getDesignForLayout(layout: LayoutId): DesignSpec {
  const configs: Record<LayoutId, DesignSpec> = {
    L1: { ...baseDesign, layout: 'L1', palette: 'P1', font: 'F1', hero: { variant: 'H1', imagePosition: 'right', overlay: false, ctaPrimary: 'phone', ctaSecondary: 'whatsapp' } },
    L2: { ...baseDesign, layout: 'L2', palette: 'P3', font: 'F2', hero: { variant: 'H2', imagePosition: 'below', overlay: false, ctaPrimary: 'quote', ctaSecondary: 'phone' }, services: { variant: 'S2', columns: 3 }, reviews: { variant: 'R2', showRating: true }, contact: { variant: 'C2' }, density: 'airy', radius: 'round' },
    L3: { ...baseDesign, layout: 'L3', palette: 'P1', font: 'F1', hero: { variant: 'H3', imagePosition: 'background', overlay: true, ctaPrimary: 'phone', ctaSecondary: 'whatsapp' } },
    L4: { ...baseDesign, layout: 'L4', palette: 'P6', font: 'F3', hero: { variant: 'H1', imagePosition: 'right', overlay: false, ctaPrimary: 'phone', ctaSecondary: 'quote' }, services: { variant: 'S4', columns: 3 }, contact: { variant: 'C1' }, density: 'compact', radius: 'sharp' },
    L5: { ...baseDesign, layout: 'L5', palette: 'P4', font: 'F4', hero: { variant: 'H4', imagePosition: 'side', overlay: false, ctaPrimary: 'quote' }, services: { variant: 'S2', columns: 2 }, reviews: { variant: 'R2', showRating: true }, contact: { variant: 'C1' }, density: 'airy', radius: 'medium' },
  };
  return configs[layout];
}

export const exampleDesign: DesignSpec = getDesignForLayout('L3');
