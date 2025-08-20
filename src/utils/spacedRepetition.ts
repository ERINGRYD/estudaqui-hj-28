import { ConfidenceLevel, Room, Difficulty } from '@/types/battle';
import { ReviewContext, ReviewScheduleUpdate } from '@/types/review';

/**
 * Spaced Repetition System based on SM-2 algorithm with adaptations
 * for battle context (room, confidence, difficulty, streak)
 */

export function mapQuality(isCorrect: boolean, confidence: ConfidenceLevel): number {
  if (isCorrect) {
    switch (confidence) {
      case 'certeza': return 5;
      case 'duvida': return 4;
      case 'chute': return 3;
      default: return 4;
    }
  } else {
    return confidence === 'certeza' ? 1 : 2;
  }
}

export function getRoomMultiplier(room: Room): number {
  switch (room) {
    case 'triagem': return 0.6;
    case 'vermelha': return 0.7;
    case 'amarela': return 0.85;
    case 'verde': return 1.15;
    default: return 1.0;
  }
}

export function getDifficultyMultiplier(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'hard': return 0.85;
    case 'easy': return 1.1;
    case 'medium': return 1.0;
    default: return 1.0;
  }
}

export function updateEaseFactor(currentEF: number, quality: number): number {
  const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.min(2.6, Math.max(1.3, newEF));
}

export function calculateBaseInterval(repetitions: number, previousInterval: number, easeFactor: number, quality: number): number {
  if (quality < 3) {
    return 1; // Reset to 1 day if quality is poor
  }

  if (repetitions === 0) {
    return 1;
  } else if (repetitions === 1) {
    return 6;
  } else {
    return Math.round(previousInterval * easeFactor);
  }
}

export function applyContextualAdjustments(
  baseInterval: number,
  context: ReviewContext,
  correctStreak: number
): number {
  const quality = mapQuality(context.isCorrect, context.confidence);
  
  // Apply room and difficulty multipliers
  const roomMultiplier = getRoomMultiplier(context.room);
  const difficultyMultiplier = getDifficultyMultiplier(context.difficulty);
  
  let adjustedInterval = Math.max(1, Math.round(baseInterval * roomMultiplier * difficultyMultiplier));
  
  // Streak bonus: if correct, high confidence, and good streak
  if (context.isCorrect && quality >= 4 && correctStreak >= 3) {
    adjustedInterval = Math.round(adjustedInterval * 1.1);
  }
  
  return adjustedInterval;
}

export function computeNextSchedule(
  previousSchedule: {
    repetitions: number;
    intervalDays: number;
    easeFactor: number;
    correctStreak: number;
  } | null,
  context: ReviewContext
): ReviewScheduleUpdate {
  const quality = mapQuality(context.isCorrect, context.confidence);
  
  // Initialize defaults for new items
  const prevReps = previousSchedule?.repetitions ?? 0;
  const prevInterval = previousSchedule?.intervalDays ?? 1;
  const prevEF = previousSchedule?.easeFactor ?? 2.5;
  const prevStreak = previousSchedule?.correctStreak ?? 0;
  
  // Update ease factor
  const newEF = updateEaseFactor(prevEF, quality);
  
  // Calculate repetitions
  let newRepetitions = prevReps;
  if (quality < 3) {
    newRepetitions = 0; // Reset repetitions for poor performance
  } else {
    newRepetitions = prevReps + 1;
  }
  
  // Calculate base interval using SM-2
  const baseInterval = calculateBaseInterval(newRepetitions, prevInterval, newEF, quality);
  
  // Update correct streak
  const newStreak = context.isCorrect ? prevStreak + 1 : 0;
  
  // Apply contextual adjustments
  const finalInterval = applyContextualAdjustments(baseInterval, context, newStreak);
  
  // Calculate next review date
  const nextReviewAt = new Date(Date.now() + finalInterval * 24 * 60 * 60 * 1000);
  
  return {
    repetitions: newRepetitions,
    intervalDays: finalInterval,
    easeFactor: newEF,
    nextReviewAt,
    correctStreak: newStreak,
    lastResult: quality
  };
}

export function isOverdue(nextReviewAt: Date, threshold: number = 0): boolean {
  const now = new Date();
  const timeDiff = now.getTime() - nextReviewAt.getTime();
  return timeDiff > (threshold * 24 * 60 * 60 * 1000);
}

export function getDaysUntilReview(nextReviewAt: Date): number {
  const now = new Date();
  const timeDiff = nextReviewAt.getTime() - now.getTime();
  return Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
}

export function getUrgencyLevel(nextReviewAt: Date): 'overdue' | 'due-today' | 'due-soon' | 'scheduled' {
  const daysUntil = getDaysUntilReview(nextReviewAt);
  
  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'due-today';
  if (daysUntil <= 2) return 'due-soon';
  return 'scheduled';
}