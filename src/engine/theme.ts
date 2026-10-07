import type { FontId, PaletteId } from '../types/design';

export const paletteMap: Record<PaletteId, { surface: string; text: string; primary: string; accent: string; muted: string; card: string; border: string }> = {
  P1: { surface: '#F8FAFC', text: '#0F172A', primary: '#0F3D5E', accent: '#F97316', muted: '#64748B', card: '#FFFFFF', border: '#E2E8F0' },
  P2: { surface: '#FAFAFA', text: '#171717', primary: '#202020', accent: '#FACC15', muted: '#737373', card: '#FFFFFF', border: '#E5E5E5' },
  P3: { surface: '#F7FBFF', text: '#0F172A', primary: '#155EEF', accent: '#06B6D4', muted: '#64748B', card: '#FFFFFF', border: '#DCE6F5' },
  P4: { surface: '#FCFBF5', text: '#18221B', primary: '#1F5A40', accent: '#D5A84B', muted: '#66736A', card: '#FFFFFF', border: '#E1E0D7' },
  P5: { surface: '#F8F8F7', text: '#18181B', primary: '#27272A', accent: '#EA580C', muted: '#71717A', card: '#FFFFFF', border: '#E4E4E7' },
  P6: { surface: '#F8FAFA', text: '#102A2E', primary: '#155E63', accent: '#2DD4BF', muted: '#5B7376', card: '#FFFFFF', border: '#DCE7E8' },
};

export const fontMap: Record<FontId, { heading: string; body: string }> = {
  F1: { heading: 'Arial, Helvetica, sans-serif', body: 'Arial, Helvetica, sans-serif' },
  F2: { heading: 'Arial, Helvetica, sans-serif', body: 'Arial, Helvetica, sans-serif' },
  F3: { heading: 'Verdana, Geneva, sans-serif', body: 'Verdana, Geneva, sans-serif' },
  F4: { heading: 'Trebuchet MS, Arial, sans-serif', body: 'Arial, Helvetica, sans-serif' },
};
