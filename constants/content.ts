export {
  PASSAGES,
  WORD_BANK_BASIC,
  WORD_BANK_MEDIUM,
  LOCI_OBJECTS,
  pickPassage,
  pickWords,
  type Passage,
  type PassageQuestion,
} from './passages';

export const LOCI_ROOMS = [
  { id: 'entrance', label: 'Entrada',    emoji: '🚪' },
  { id: 'kitchen',  label: 'Cocina',     emoji: '🍳' },
  { id: 'bathroom', label: 'Baño',       emoji: '🚿' },
  { id: 'bedroom',  label: 'Dormitorio', emoji: '🛏' },
  { id: 'office',   label: 'Oficina',    emoji: '💻' },
  { id: 'attic',    label: 'Ático',      emoji: '📦' },
] as const;

export type PassageLevel = 'short' | 'medium' | 'long';
