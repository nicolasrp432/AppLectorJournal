/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm
 * 
 * Quality values:
 * 5: perfect response
 * 4: correct response after a hesitation
 * 3: correct response recalled with serious difficulty
 * 2: incorrect response; where the correct one seemed easy to recall
 * 1: incorrect response; the correct one remembered
 * 0: complete blackout.
 */
export interface SM2Result {
  interval: number;      // in days
  repetitions: number;   // number of consecutive correct reviews
  easeFactor: number;    // ease factor (EF)
  nextDue: Date;         // Next scheduled review date
}

export function calculateSM2(
  quality: number,
  prevInterval: number,
  prevRepetitions: number,
  prevEaseFactor: number
): SM2Result {
  let interval = 1;
  let repetitions = 0;
  let easeFactor = prevEaseFactor;

  if (quality >= 3) {
    if (prevRepetitions === 0) {
      interval = 1;
    } else if (prevRepetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * prevEaseFactor);
    }
    repetitions = prevRepetitions + 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  // Adjust Ease Factor (EF) according to standard SM-2 formula
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Cap ease factor at minimum 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate next due date
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + interval);

  return {
    interval,
    repetitions,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    nextDue,
  };
}
