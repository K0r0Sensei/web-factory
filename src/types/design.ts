import type { SiteCopy } from './site-content';
export type LayoutId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type PaletteId = 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6';
export type FontId = 'F1' | 'F2' | 'F3' | 'F4';
export type HeroId = 'H1' | 'H2' | 'H3' | 'H4';
export type ServicesId = 'S1' | 'S2' | 'S3' | 'S4';
export type ReviewsId = 'R1' | 'R2' | 'R3';
export type FaqId = 'Q1' | 'Q2';
export type ContactId = 'C1' | 'C2' | 'C3';
export type FooterId = 'T1' | 'T2';
export type Radius = 'sharp' | 'medium' | 'round';
export type Density = 'compact' | 'medium' | 'airy';

export interface BusinessData {
  id: string;
  businessName: string;
  city: string;
  province?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  hours?: string[];
  description?: string;
  services: Array<{ name: string; description?: string }>;
  serviceAreas?: string[];
  rating?: number;
  reviewsCount?: number;
  logoUrl?: string;
  imageUrls?: string[];
  differentiators?: string[];
  emergency24h?: boolean;
  copy?: SiteCopy;
}

export interface DesignSpec {
  layout: LayoutId;
  palette: PaletteId;
  font: FontId;
  hero: {
    variant: HeroId;
    imagePosition: 'right' | 'below' | 'background' | 'side';
    overlay: boolean;
    ctaPrimary: 'phone' | 'whatsapp' | 'quote';
    ctaSecondary?: 'phone' | 'whatsapp' | 'quote';
  };
  services: {
    variant: ServicesId;
    columns: 1 | 2 | 3 | 4;
  };
  reviews: {
    variant: ReviewsId;
    showRating: boolean;
  };
  faq: {
    variant: FaqId;
  };
  contact: {
    variant: ContactId;
  };
  footer: {
    variant: FooterId;
  };
  density: Density;
  radius: Radius;
}
