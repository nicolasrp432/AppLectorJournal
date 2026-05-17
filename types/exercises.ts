import type { ExerciseId, MascotKey } from './db';

export type { ExerciseId };

export interface ExerciseMeta {
  id: ExerciseId;
  title: string;
  category: string;
  mascot: MascotKey;
  color: string;
  xp: number;
  duration: string;
  difficulty: 'Fácil' | 'Medio' | 'Difícil';
  improves: string;
  description: string;
  whyEffective: string;
  steps: string[];
}

export interface ExerciseResult {
  passed: boolean;
  headline: string | null;
  xpEarned: number;
  stats: ResultStat[];
  insight: string;
}

export interface ResultStat {
  icon: string;
  value: number | string;
  unit: string;
  label: string;
  color: string;
}

// Difficulty configs per exercise
export interface SchulteLevel { level: number; label: string; size: number; target_time: number }
export interface WordSpanLevel { level: number; label: string; count: number; show_ms: number }
export interface LociLevel    { level: number; label: string; count: number }
export interface ComprehensionLevel { level: number; label: string; length: 'short'|'medium'|'long'; q_count: number }
export interface ReadingLevel { level: number; label: string; wpm: number }
export interface BossLevel    { level: number; label: string; zone: string }

export type AnyLevel = SchulteLevel | WordSpanLevel | LociLevel | ComprehensionLevel | ReadingLevel | BossLevel;
