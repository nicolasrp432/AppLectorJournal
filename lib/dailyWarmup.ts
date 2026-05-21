import { ExerciseId } from '../types/db';

export interface ExerciseProgress {
  exercise_id: ExerciseId;
  current_level: number;
  best_score: number;
  last_score: number;
  total_sessions: number;
  mastery: number;
}

/**
 * Selects 2-3 recommended exercises for the daily warmup session.
 * prioritizes exercises with:
 * 1. Lower mastery (highest mastery gap).
 * 2. Lower number of completed sessions.
 */
export function selectWarmupExercises(progressMap: Record<string, any>): ExerciseId[] {
  const EX_IDS: ExerciseId[] = ['schulte', 'reading', 'wordspan', 'loci', 'comprehension', 'boss'];
  
  const scored = EX_IDS.map(exId => {
    const p = progressMap[exId] || { mastery: 0, total_sessions: 0 };
    const masteryGap = 1 - (p.mastery ?? 0);
    const sessionsScore = 1 / ((p.total_sessions ?? 0) + 1);
    
    // Scored by combination of mastery gap and lack of practice sessions
    const score = (masteryGap * 1.6) + (sessionsScore * 1.0);
    return { exercise_id: exId, score };
  });

  // Sort descending by priority score
  scored.sort((a, b) => b.score - a.score);
  
  // Return top 2-3 exercise IDs
  return scored.slice(0, 3).map(s => s.exercise_id);
}
