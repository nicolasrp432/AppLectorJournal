export const COLORS = {
  // Exercise / mascot primaries
  focus:   '#22C55E',
  calm:    '#3B82F6',
  swift:   '#F97316',
  joy:     '#EAB308',
  loci:    '#8B5CF6',
  memo:    '#EC4899',
  boss:    '#DC2626',
  // Neutrals
  ink:      '#111827',
  inkLight: '#374151',
  muted:    '#6B7280',
  subtle:   '#9CA3AF',
  border:   '#E5E7EB',
  surface:  '#F3F4F6',
  canvas:   '#FAFAF9',
  white:    '#FFFFFF',
} as const;

export type ColorKey = keyof typeof COLORS;

export function darken(hex: string, amt = 0.18): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.floor(((n >> 16) & 0xff) * (1 - amt)));
  const g = Math.max(0, Math.floor(((n >> 8)  & 0xff) * (1 - amt)));
  const b = Math.max(0, Math.floor(( n         & 0xff) * (1 - amt)));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
