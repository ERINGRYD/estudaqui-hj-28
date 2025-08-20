export type Room = 'triagem' | 'vermelha' | 'amarela' | 'verde';
export type ConfidenceLevel = 'certeza' | 'duvida' | 'chute';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ErrorType = 'interpretacao' | 'conteudo' | 'distracao' | 'nao_definido';

export interface Question {
  id: string;
  topicId: string;
  title: string;
  content: string;
  options?: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  difficulty: Difficulty;
  tags?: string[];
  images?: string[];
  examiningBoard?: string;
  position?: string;
  examYear?: string;
  institution?: string;
  timesAnswered: number;
  timesCorrect: number;
  accuracyRate: number;
  room: Room;
  createdAt: Date;
  updatedAt: Date;
  // Metadata from relations
  topicName?: string;
  subjectName?: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  content: string;
  isCorrect: boolean;
}

export interface QuestionAttempt {
  id: string;
  questionId: string;
  battleSessionId?: string;
  answer: string;
  isCorrect: boolean;
  confidenceLevel: ConfidenceLevel;
  errorType?: ErrorType;
  timeTaken?: number;
  xpEarned: number;
  createdAt: Date;
}

export interface BattleSession {
  id: string;
  room: Room;
  totalQuestions: number;
  correctAnswers: number;
  totalXp: number;
  accuracyRate: number;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProgress {
  id: string;
  totalXp: number;
  currentLevel: number;
  xpForNextLevel: number;
  battlesWon: number;
  questionsAnswered: number;
  questionsCorrect: number;
  streakDays: number;
  lastBattleDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BattleStats {
  totalQuestions: number;
  questionsByRoom: Record<Room, number>;
  accuracyByRoom: Record<Room, number>;
  recentBattles: BattleSession[];
}

// XP calculation constants
export const XP_BASE = {
  correct: 10,
  confidence_bonus: {
    certeza: 5,
    duvida: 3,
    chute: 1
  },
  difficulty_multiplier: {
    easy: 1,
    medium: 1.5,
    hard: 2
  }
};

// Level calculation
export const calculateXpForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

export const calculateLevel = (totalXp: number): { level: number; xpForNext: number } => {
  let level = 1;
  let xpRequired = 0;
  
  while (xpRequired <= totalXp) {
    level++;
    xpRequired += calculateXpForLevel(level - 1);
  }
  
  level--;
  const currentLevelXp = xpRequired - calculateXpForLevel(level);
  const xpForNext = calculateXpForLevel(level + 1) - (totalXp - currentLevelXp);
  
  return { level, xpForNext };
};