import type { BusinessData, DesignSpec } from '../types/design';

export const DESIGN_DIRECTOR_SYSTEM = `You are a design director for a Spanish plumbing-business website factory.\nReturn ONLY valid JSON. Use IDs from the closed catalog. Never invent colors, components or IDs. Prioritize conversion clarity, trust and mobile-first CTAs. Never invent business facts, prices, awards or certifications.`;

export function designDirectorInput(business: BusinessData): string {
  return JSON.stringify({
    businessName: business.businessName,
    city: business.city,
    services: business.services,
    rating: business.rating,
    reviewsCount: business.reviewsCount,
    serviceAreas: business.serviceAreas,
    emergency24h: business.emergency24h,
    differentiators: business.differentiators
  }, null, 2);
}

export function isDesignSpec(value: unknown): value is DesignSpec {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.layout === 'string' && typeof v.palette === 'string' && typeof v.font === 'string' && typeof v.hero === 'object' && typeof v.services === 'object' && typeof v.reviews === 'object' && typeof v.faq === 'object' && typeof v.contact === 'object' && typeof v.footer === 'object';
}
