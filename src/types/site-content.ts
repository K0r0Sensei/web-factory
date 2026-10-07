export interface SiteCopy {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  servicesTitle: string;
  servicesLead: string;
  reviewsTitle: string;
  contactTitle: string;
  contactLead: string;
  footerTagline: string;
  serviceDescriptions: Record<string, string>;
  faq: Array<{ question: string; answer: string }>;
}
