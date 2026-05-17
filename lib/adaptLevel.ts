import type { ExerciseId } from '../types/db';
import { DIFFICULTY } from '../constants/difficulty';

export interface AdaptResult {
  newLevel: number;
  masteryDelta: number;
  reason: 'up' | 'down' | 'hold';
}

export function adaptLevel(
  exId: ExerciseId,
  score: number,
  currentLevel: number,
  _mastery = 0,
): AdaptResult {
  const max = DIFFICULTY[exId].length;
  if (score >= 0.85 && currentLevel < max) {
    return { newLevel: currentLevel + 1, masteryDelta: +0.15, reason: 'up' };
  }
  if (score < 0.55 && currentLevel > 1) {
    return { newLevel: currentLevel - 1, masteryDelta: -0.10, reason: 'down' };
  }
  return { newLevel: currentLevel, masteryDelta: score >= 0.7 ? +0.05 : 0, reason: 'hold' };
}
