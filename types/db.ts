export type MascotKey = 'focus' | 'calm' | 'joy' | 'swift' | 'memo' | 'loci' | 'boss';

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar: MascotKey;
  avatar_url?: string | null;
  bio: string;
  level: number;
  xp: number;
  streak: number;
  last_active: string | null;
  created_at: string;
  subscription_tier?: string;
  subscription_status?: string;
  subscription_expires_at?: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  exercise_id: ExerciseId;
  level: number;
  started_at: string | null;
  finished_at: string;
  score: number;
  errors: number;
  time_seconds: number;
  wpm: number | null;
  comprehension: number | null;
  xp_earned: number;
}

export interface ExerciseProgress {
  user_id: string;
  exercise_id: ExerciseId;
  current_level: number;
  best_score: number;
  last_score: number;
  total_sessions: number;
  mastery: number;
  updated_at: string;
}

export interface LibraryItem {
  id: string;
  user_id: string;
  kind: 'book' | 'text';
  title: string;
  author: string | null;
  content: string | null;
  words: number;
  progress: number;
  last_read_at: string | null;
  cover_color: string;
  source: 'catalog' | 'custom' | 'imported';
  created_at: string;
}

export interface UserPrefs {
  user_id: string;
  wpm_default: number;
  font_family: 'Lexend' | 'Nunito' | 'Georgia';
  font_size: number;
  theme_color: string;
  dyslexia_font: boolean;
  high_contrast: boolean;
  reduce_motion: boolean;
  daily_xp_goal: number;
  daily_minutes_goal: number;
  daily_exercises_goal: number;
  notifications_enabled: boolean;
  notifications_time: string;
  updated_at: string;
  loci_palace?: 'casa' | 'oficina' | 'naturaleza' | 'cuerpo' | 'mano' | 'custom';
}

export interface OwnedReward {
  user_id: string;
  reward_id: string;
  equipped: boolean;
  acquired_at: string;
}

export type ExerciseId = 'schulte' | 'reading' | 'wordspan' | 'loci' | 'comprehension' | 'boss' | 'freereading' | 'flashcards' | 'reading_test' | 'focus_circle';

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  is_ai_generated: boolean;
  created_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  hint: string;
  interval: number;
  repetitions: number;
  ease_factor: number;
  next_due: string;
  created_at: string;
}

export interface FlashcardSession {
  id: string;
  user_id: string;
  deck_id: string;
  started_at: string | null;
  finished_at: string;
  cards_reviewed: number;
  xp_earned: number;
}
