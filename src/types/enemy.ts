
import { Room, Difficulty } from './battle';

export interface Enemy {
  id: string;
  topicId: string;
  topicName: string;
  subjectName: string;
  subjectColor?: string;
  room: Room;
  totalQuestions: number;
  questionsAnswered: number;
  questionsCorrect: number;
  accuracyRate: number;
  lastBattleDate?: Date;
  averageDifficulty: Difficulty;
  totalXpEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnemyStats {
  triagem: Enemy[];
  vermelha: Enemy[];
  amarela: Enemy[];
  verde: Enemy[];
}

// Classificação de inimigos por sala baseada na taxa de acerto
export const classifyEnemyRoom = (accuracyRate: number, questionsAnswered: number): Room => {
  console.log(`Classifying enemy: accuracyRate=${accuracyRate}, questionsAnswered=${questionsAnswered}`);
  
  // Se ainda não tem estatísticas (nenhuma questão respondida)
  if (questionsAnswered === 0) {
    console.log('Enemy classified as triagem: no questions answered');
    return 'triagem';
  }
  
  // Com pelo menos 1 questão respondida, classifica baseado na taxa de acerto
  if (accuracyRate < 70) {
    console.log('Enemy classified as vermelha: low accuracy rate');
    return 'vermelha';
  } else if (accuracyRate < 85) {
    console.log('Enemy classified as amarela: medium accuracy rate');
    return 'amarela';
  } else {
    console.log('Enemy classified as verde: high accuracy rate');
    return 'verde';
  }
};

export const getRoomColor = (room: Room): string => {
  switch (room) {
    case 'triagem':
      return 'bg-gray-500';
    case 'vermelha':
      return 'bg-red-500';
    case 'amarela':
      return 'bg-yellow-500';
    case 'verde':
      return 'bg-green-500';
  }
};

export const getRoomTextColor = (room: Room): string => {
  switch (room) {
    case 'triagem':
      return 'text-gray-600';
    case 'vermelha':
      return 'text-red-600';
    case 'amarela':
      return 'text-yellow-600';
    case 'verde':
      return 'text-green-600';
  }
};
