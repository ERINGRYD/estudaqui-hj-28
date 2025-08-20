
export interface StudySubject {
  id: string;
  name: string;
  topics?: StudyTopic[];
  weight?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  color?: string;
  priority?: number;
  lastStudied?: Date;
  totalTime?: number;
  customSubject?: boolean;
}

export interface StudyTopic {
  id: string;
  name: string;
  subjectId?: string;
  subtopics?: StudySubtopic[];
  weight?: number;
  completed?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  lastStudied?: Date;
  totalTime?: number;
  calculatedPriority?: number;
  autoWeightAdjustment?: number;
  weightReason?: WeightAdjustmentReason;
}

export interface StudySubtopic {
  id: string;
  name: string;
  topicId?: string;
  weight?: number;
  completed?: boolean;
  difficulty?: 'easy' | 'medium' | 'hard';
  lastStudied?: Date;
  totalTime?: number;
  calculatedPriority?: number;
  autoWeightAdjustment?: number;
  weightReason?: WeightAdjustmentReason;
}

export interface TopicPriority {
  weight: number;           // Peso definido pelo usuário (1-10)
  urgency: number;         // Baseado na proximidade do exame
  performance: number;     // Baseado no histórico de acertos
  recency: number;        // Tempo desde o último estudo
  difficulty: number;     // Nível de dificuldade do tópico
}

export enum PriorityLevel {
  CRITICAL = 'critical',
  IMPORTANT = 'important', 
  MODERATE = 'moderate',
  UNDEFINED = 'undefined'
}

export type WeightAdjustmentReason = 
  | 'low_performance' 
  | 'high_performance' 
  | 'not_studied_recently' 
  | 'exam_proximity'
  | 'manual_adjustment'
  | 'auto_rebalance';


export interface StudySession {
  id: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  completed: boolean;
  notes?: string;
  performance?: 'low' | 'medium' | 'high';
  taskId?: string;
}

export interface PomodoroSettings {
  studyTime: number;
  breakTime: number;
  longBreakTime: number;
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartSessions: boolean;
  soundEnabled: boolean;
}

export interface StudyPlan {
  id?: string;
  type: 'cycle' | 'schedule';
  examDate?: Date;
  daysUntilExam?: number;
  subjects: StudySubject[];
  data?: any;
  cycle?: CycleDay[];
  weekly?: WeeklySchedule[];
  totalHours: number;
  focusAreas: string[];
  intensity?: 'low' | 'medium' | 'high';
  methodology?: 'pomodoro' | 'timeboxing' | 'custom';
  weeklyHourLimit?: number;
  cycleStart?: Date;
}

export interface CycleDay {
  day: number;
  dayName: string;
  subject: string;
  topic?: string;
  subtopic?: string;
  color: string;
  duration: string;
  focus: string;
  priority: number;
  tasks: any[];
  totalPlannedHours: number;
}

export interface WeeklySchedule {
  day: string;
  subjects: {
    name: string;
    topic?: string;
    color: string;
    duration: string;
    priority: string;
    timeSlot?: string;
  }[];
  tasks: any[];
  totalPlannedHours: number;
}

export interface ExamType {
  id: string;
  name: string;
  description: string;
  defaultSubjects?: string[];
  recommendedHours?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface StudyGoal {
  id: string;
  subject: string;
  topic?: string;
  targetHours: number;
  deadline: Date;
  completed: boolean;
  progress: number;
}
