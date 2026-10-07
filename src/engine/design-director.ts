import type { BusinessData, DesignSpec } from '../types/design';

/**
 * V1: deterministic design selection.
 * Later, the AI can replace this function while keeping the same DesignSpec contract.
 */
export function chooseDesign(business: BusinessData): DesignSpec {
  const emergency = Boolean(business.emergency24h);
  const manyReviews = (business.reviewsCount ?? 0) >= 80 && (business.rating ?? 0) >= 4.5;
  const premiumSignals = business.services.some((service) => /instal|reforma|aerotermia|caldera/i.test(service.name));

  if (emergency) {
    return {
      layout: 'L3', palette: 'P1', font: 'F1',
      hero: { variant: 'H3', imagePosition: 'background', overlay: true, ctaPrimary: 'phone', ctaSecondary: 'whatsapp' },
      services: { variant: 'S1', columns: 3 }, reviews: { variant: 'R1', showRating: true },
      faq: { variant: 'Q1' }, contact: { variant: 'C3' }, footer: { variant: 'T1' }, density: 'medium', radius: 'medium'
    };
  }

  if (premiumSignals) {
    return {
      layout: 'L5', palette: 'P4', font: 'F4',
      hero: { variant: 'H4', imagePosition: 'side', overlay: false, ctaPrimary: 'quote' },
      services: { variant: 'S2', columns: 2 }, reviews: { variant: 'R2', showRating: true },
      faq: { variant: 'Q1' }, contact: { variant: 'C1' }, footer: { variant: 'T1' }, density: 'airy', radius: 'medium'
    };
  }

  if (manyReviews) {
    return {
      layout: 'L4', palette: 'P6', font: 'F3',
      hero: { variant: 'H1', imagePosition: 'right', overlay: false, ctaPrimary: 'phone', ctaSecondary: 'quote' },
      services: { variant: 'S4', columns: 3 }, reviews: { variant: 'R1', showRating: true },
      faq: { variant: 'Q1' }, contact: { variant: 'C1' }, footer: { variant: 'T1' }, density: 'compact', radius: 'sharp'
    };
  }

  return {
    layout: 'L1', palette: 'P1', font: 'F2',
    hero: { variant: 'H1', imagePosition: 'right', overlay: false, ctaPrimary: 'phone', ctaSecondary: 'whatsapp' },
    services: { variant: 'S1', columns: 3 }, reviews: { variant: 'R1', showRating: true },
    faq: { variant: 'Q1' }, contact: { variant: 'C1' }, footer: { variant: 'T1' }, density: 'medium', radius: 'medium'
  };
}
