import type { RewardItem } from '../types/rewards';

export const REWARDS: RewardItem[] = [
  // THEMES
  { id: 'theme-green',  cat: 'themes', type: 'theme', title: 'Esmeralda',   desc: 'El clásico de Focus',          cost: 0,    value: '#22C55E', owned: true, equipped: true },
  { id: 'theme-blue',   cat: 'themes', type: 'theme', title: 'Océano',      desc: 'Calma azul profunda',          cost: 400,  value: '#3B82F6' },
  { id: 'theme-amber',  cat: 'themes', type: 'theme', title: 'Ámbar',       desc: 'Joy en estado puro',           cost: 600,  value: '#EAB308' },
  { id: 'theme-sunset', cat: 'themes', type: 'theme', title: 'Atardecer',   desc: 'La energía de Swift',          cost: 800,  value: '#F97316' },
  { id: 'theme-violet', cat: 'themes', type: 'theme', title: 'Violeta',     desc: 'Concentración cósmica',        cost: 1200, value: '#8B5CF6' },
  { id: 'theme-rose',   cat: 'themes', type: 'theme', title: 'Rosa',        desc: 'Cálido y vibrante',            cost: 1000, value: '#EC4899' },
  { id: 'theme-mint',   cat: 'themes', type: 'theme', title: 'Menta',       desc: 'Frescura serena',              cost: 900,  value: '#10B981' },
  { id: 'theme-night',  cat: 'themes', type: 'theme', title: 'Modo Noche',  desc: 'Para lectores nocturnos',      cost: 2000, value: '#111827', locked: true, requires: 'Nivel 10' },

  // AVATARS
  { id: 'avatar-focus', cat: 'avatars', type: 'avatar', title: 'Focus',  desc: 'El guía del enfoque',     cost: 500,  mascot: 'focus' },
  { id: 'avatar-calm',  cat: 'avatars', type: 'avatar', title: 'Calm',   desc: 'La tranquilidad',         cost: 500,  mascot: 'calm'  },
  { id: 'avatar-joy',   cat: 'avatars', type: 'avatar', title: 'Joy',    desc: 'Alegría brillante',       cost: 700,  mascot: 'joy'   },
  { id: 'avatar-swift', cat: 'avatars', type: 'avatar', title: 'Swift',  desc: 'Velocidad pura',          cost: 700,  mascot: 'swift' },
  { id: 'avatar-memo',  cat: 'avatars', type: 'avatar', title: 'Memo',   desc: 'Memoria afilada',         cost: 900,  mascot: 'memo'  },
  { id: 'avatar-loci',  cat: 'avatars', type: 'avatar', title: 'Loci',   desc: 'Cartógrafo mental',       cost: 900,  mascot: 'loci'  },
  { id: 'avatar-boss',  cat: 'avatars', type: 'avatar', title: 'Sombra', desc: 'El rival vencido',        cost: 1500, mascot: 'boss', locked: true, requires: 'Derrota a un jefe' },

  // POWER-UPS
  { id: 'pw-streak', cat: 'powerups', type: 'powerup', title: 'Congelador de racha', desc: 'Protege tu racha 1 día sin practicar', cost: 350, icon: 'snowflake', color: '#3B82F6', consumable: true },
  { id: 'pw-xp2x',   cat: 'powerups', type: 'powerup', title: 'XP x2',               desc: 'Doble XP en tu próxima sesión',        cost: 500, icon: 'bolt',      color: '#EAB308', consumable: true },
  { id: 'pw-hint',   cat: 'powerups', type: 'powerup', title: 'Pista de loci',        desc: 'Revela 1 habitación durante el recall', cost: 200, icon: 'sparkle',   color: '#8B5CF6', consumable: true },
  { id: 'pw-time',   cat: 'powerups', type: 'powerup', title: '+10s extra',           desc: 'Más tiempo en pruebas cronometradas',  cost: 250, icon: 'clock',     color: '#22C55E', consumable: true },
  { id: 'pw-skip',   cat: 'powerups', type: 'powerup', title: 'Saltar pregunta',      desc: 'Pasa una pregunta sin penalización',   cost: 400, icon: 'arrowRight', color: '#F97316', consumable: true },

  // VIBES
  { id: 'bg-cafe',    cat: 'vibes', type: 'background', title: 'Café lluvioso',       desc: 'Ambiente de cafetería con lluvia',   cost: 600,  color: '#92400E', icon: 'headphones' },
  { id: 'bg-library', cat: 'vibes', type: 'background', title: 'Biblioteca antigua',  desc: 'Madera, polvo y silencio',          cost: 600,  color: '#78350F', icon: 'book'        },
  { id: 'bg-forest',  cat: 'vibes', type: 'background', title: 'Bosque al amanecer',  desc: 'Pájaros y luz suave',               cost: 800,  color: '#16A34A', icon: 'feather'     },
  { id: 'bg-space',   cat: 'vibes', type: 'background', title: 'Cosmos silencioso',   desc: 'Música ambiente espacial',          cost: 1100, color: '#1E3A8A', icon: 'moon', locked: true, requires: 'Racha 14 días' },

  // READING PACKS
  { id: 'pkg-dyslexia',     cat: 'reading', type: 'pack', title: 'Tipografía OpenDyslexic', desc: 'Activa la fuente accesible',          cost: 0,    icon: 'feather', color: '#8B5CF6', owned: true },
  { id: 'pkg-books-classic', cat: 'reading', type: 'pack', title: 'Pack: Clásicos breves',  desc: '12 cuentos en biblioteca',           cost: 900,  icon: 'book',    color: '#B45309' },
  { id: 'pkg-books-science', cat: 'reading', type: 'pack', title: 'Pack: Ciencia',           desc: '8 ensayos cortos de ciencia',        cost: 900,  icon: 'rocket',  color: '#0EA5E9' },
  { id: 'pkg-coach',         cat: 'reading', type: 'pack', title: 'Coach de hábitos',        desc: 'Plan diario personalizado',          cost: 1500, icon: 'target',  color: '#22C55E', locked: true, requires: 'PRO' },

  // BADGES
  { id: 'badge-explorer', cat: 'badges', type: 'badge', title: 'Explorador',    desc: 'Insignia visible en tu perfil', cost: 300,  icon: 'compass', color: '#3B82F6' },
  { id: 'badge-flame',    cat: 'badges', type: 'badge', title: 'Llama eterna',  desc: 'Tu racha brilla más',           cost: 500,  icon: 'flame',   color: '#EF4444' },
  { id: 'badge-medal',    cat: 'badges', type: 'badge', title: 'Medalla dorada', desc: 'Aura de campeón',              cost: 800,  icon: 'medal',   color: '#EAB308' },
  { id: 'badge-crown',    cat: 'badges', type: 'badge', title: 'Corona',        desc: 'Solo para nivel 10+',           cost: 1200, icon: 'crown',   color: '#D97706', locked: true, requires: 'Nivel 10' },
];
