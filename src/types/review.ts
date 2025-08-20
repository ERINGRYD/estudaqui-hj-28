import { ConfidenceLevel, Room, Difficulty } from './battle';

export interface ReviewSchedule {
  id: string;
  itemType: 'question' | 'topic';
  itemId: string;
  topicId?: string;
  subjectId?: string;
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  correctStreak: number;
  lastReview?: Date;
  nextReviewAt: Date;
  lastResult?: number; // Quality 1-5 from SM-2
  lastConfidence?: ConfidenceLevel;
  lastRoom?: Room;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewContext {
  isCorrect: boolean;
  confidence: ConfidenceLevel;
  room: Room;
  difficulty: Difficulty;
}

export interface ReviewScheduleUpdate {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: Date;
  correctStreak: number;
  lastResult: number;
}

export interface DueReviewSummary {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  dueCount: number;
  urgentCount: number; // overdue by more than 1 day
  averageRoom: Room;
}

export interface ReviewStats {
  totalDue: number;
  dueByRoom: Record<Room, number>;
  dueBySubject: Record<string, number>;
  nextReviewDate?: Date;
  streakData: {
    averageStreak: number;
    longestStreak: number;
  };
}