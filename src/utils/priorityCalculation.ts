import { StudyTopic, StudySubject, TopicPriority, PriorityLevel, WeightAdjustmentReason } from '@/types/study';
import { differenceInDays, differenceInHours } from 'date-fns';

export interface PriorityContext {
  examDate?: Date;
  currentDate: Date;
  performanceHistory?: Record<string, number>; // topicId -> average performance (0-1)
}

// Calcular multiplicador de urgência baseado na proximidade do exame
export const getUrgencyMultiplier = (examDate?: Date, currentDate: Date = new Date()): number => {
  if (!examDate) return 1;
  
  const daysUntilExam = differenceInDays(examDate, currentDate);
  
  if (daysUntilExam <= 7) return 2.0;      // Última semana - urgência máxima
  if (daysUntilExam <= 14) return 1.8;     // Duas semanas - alta urgência
  if (daysUntilExam <= 30) return 1.5;     // Um mês - urgência moderada
  if (daysUntilExam <= 60) return 1.2;     // Dois meses - baixa urgência
  
  return 1.0; // Mais de dois meses
};

// Calcular boost de performance (tópicos com baixa performance ganham prioridade)
export const getPerformanceBoost = (topicId: string, performanceHistory?: Record<string, number>): number => {
  if (!performanceHistory || !performanceHistory[topicId]) return 0;
  
  const performance = performanceHistory[topicId];
  
  if (performance < 0.3) return 3.0;      // Performance muito baixa - boost alto
  if (performance < 0.5) return 2.0;      // Performance baixa - boost moderado
  if (performance < 0.7) return 1.0;      // Performance média - boost baixo
  
  return -0.5; // Performance alta - reduzir prioridade
};

// Calcular boost de recência (tópicos não estudados recentemente ganham prioridade)
export const getRecencyBoost = (lastStudied?: Date, currentDate: Date = new Date()): number => {
  if (!lastStudied) return 2.0; // Nunca estudado - prioridade alta
  
  const hoursSinceLastStudy = differenceInHours(currentDate, lastStudied);
  
  if (hoursSinceLastStudy > 168) return 1.8;  // Mais de uma semana
  if (hoursSinceLastStudy > 72) return 1.2;   // Mais de 3 dias
  if (hoursSinceLastStudy > 24) return 0.8;   // Mais de 1 dia
  
  return 0.2; // Estudado recentemente
};

// Calcular fator de dificuldade
export const getDifficultyFactor = (difficulty?: 'easy' | 'medium' | 'hard'): number => {
  switch (difficulty) {
    case 'hard': return 1.5;
    case 'medium': return 1.2;
    case 'easy': return 1.0;
    default: return 1.1;
  }
};

// Função principal para calcular prioridade de um tópico
export const calculateTopicPriority = (
  topic: StudyTopic, 
  context: PriorityContext
): number => {
  const baseWeight = topic.weight || 1;
  const urgencyMultiplier = getUrgencyMultiplier(context.examDate, context.currentDate);
  const performanceBoost = getPerformanceBoost(topic.id, context.performanceHistory);
  const recencyBoost = getRecencyBoost(topic.lastStudied, context.currentDate);
  const difficultyFactor = getDifficultyFactor(topic.difficulty);
  
  return (baseWeight * urgencyMultiplier * difficultyFactor) + 
         performanceBoost + 
         recencyBoost;
};

// Determinar nível de prioridade baseado no score calculado
export const getPriorityLevel = (priority: number): PriorityLevel => {
  if (priority >= 15) return PriorityLevel.CRITICAL;
  if (priority >= 8) return PriorityLevel.IMPORTANT;
  if (priority >= 3) return PriorityLevel.MODERATE;
  return PriorityLevel.UNDEFINED;
};

// Calcular prioridade para todos os tópicos de um subject
export const calculateSubjectPriorities = (
  subject: StudySubject,
  context: PriorityContext
): StudyTopic[] => {
  if (!subject.topics) return [];
  
  return subject.topics.map(topic => ({
    ...topic,
    calculatedPriority: calculateTopicPriority(topic, context)
  })).sort((a, b) => (b.calculatedPriority || 0) - (a.calculatedPriority || 0));
};

// Redistribuir tempo baseado em prioridade calculada
export const redistributeTimeByPriority = (
  topics: StudyTopic[], 
  totalHours: number
): StudyTopic[] => {
  const totalPriority = topics.reduce((sum, topic) => sum + (topic.calculatedPriority || 1), 0);
  
  return topics.map(topic => ({
    ...topic,
    allocatedHours: totalPriority > 0 
      ? ((topic.calculatedPriority || 1) / totalPriority) * totalHours
      : totalHours / topics.length
  }));
};

// Sugerir ajustes automáticos de peso
export const suggestWeightAdjustments = (
  topics: StudyTopic[],
  context: PriorityContext
): Array<{
  topicId: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: WeightAdjustmentReason;
  impact: 'low' | 'medium' | 'high';
}> => {
  const suggestions = [];
  
  for (const topic of topics) {
    const currentWeight = topic.weight || 1;
    const performance = context.performanceHistory?.[topic.id];
    const hoursSinceLastStudy = topic.lastStudied 
      ? differenceInHours(context.currentDate, topic.lastStudied)
      : Infinity;
    
    // Sugestão por baixa performance
    if (performance !== undefined && performance < 0.4 && currentWeight < 8) {
      suggestions.push({
        topicId: topic.id,
        currentWeight,
        suggestedWeight: Math.min(currentWeight + 2, 10),
        reason: 'low_performance' as WeightAdjustmentReason,
        impact: performance < 0.2 ? 'high' : 'medium'
      });
    }
    
    // Sugestão por não estudar há muito tempo
    if (hoursSinceLastStudy > 168 && currentWeight < 6) {
      suggestions.push({
        topicId: topic.id,
        currentWeight,
        suggestedWeight: Math.min(currentWeight + 1, 10),
        reason: 'not_studied_recently' as WeightAdjustmentReason,
        impact: 'medium'
      });
    }
    
    // Sugestão por alta performance (reduzir peso)
    if (performance !== undefined && performance > 0.8 && currentWeight > 3) {
      suggestions.push({
        topicId: topic.id,
        currentWeight,
        suggestedWeight: Math.max(currentWeight - 1, 1),
        reason: 'high_performance' as WeightAdjustmentReason,
        impact: 'low'
      });
    }
  }
  
  return suggestions;
};