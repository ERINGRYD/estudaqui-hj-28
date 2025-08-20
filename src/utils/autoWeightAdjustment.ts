import { StudyTopic, StudySubject, WeightAdjustmentReason } from '@/types/study';
import { differenceInDays, differenceInHours } from 'date-fns';
import { loadPerformanceMetrics, PerformanceMetric } from '@/utils/sqlitePersistence';

export interface AutoAdjustmentConfig {
  enablePerformanceAdjustment: boolean;
  enableRecencyAdjustment: boolean;
  enableExamProximityAdjustment: boolean;
  maxAutoAdjustment: number; // Máximo de pontos que podem ser ajustados automaticamente
  adjustmentThreshold: number; // Intervalo mínimo entre ajustes (em horas)
}

export const defaultAutoAdjustmentConfig: AutoAdjustmentConfig = {
  enablePerformanceAdjustment: true,
  enableRecencyAdjustment: true,
  enableExamProximityAdjustment: true,
  maxAutoAdjustment: 3,
  adjustmentThreshold: 24 // 24 horas
};

// Analisar performance de um tópico baseado nas métricas e dados de performance
export const analyzeTopicPerformance = (topicId: string): {
  averageScore: number;
  totalSessions: number;
  trend: 'improving' | 'declining' | 'stable';
} => {
  try {
    // Pegar métricas de sessão que podem conter dados específicos do tópico
    const sessionMetrics = loadPerformanceMetrics('session');
    
    // Filtrar métricas que contêm dados sobre este tópico específico
    const topicMetrics = sessionMetrics.filter((m: PerformanceMetric) => {
      const topicData = m.performanceData[`topic_${topicId}`];
      return topicData !== undefined;
    });
    
    if (topicMetrics.length === 0) {
      // Fallback: usar dados gerais se não há dados específicos do tópico
      const generalMetrics = loadPerformanceMetrics('session', undefined, undefined).slice(0, 10);
      const averageProductivity = generalMetrics.length > 0 
        ? generalMetrics.reduce((sum, m) => sum + m.productivityScore, 0) / generalMetrics.length / 100
        : 0;
        
      return { 
        averageScore: averageProductivity, 
        totalSessions: generalMetrics.length, 
        trend: 'stable' 
      };
    }
    
    // Extrair scores específicos do tópico das métricas
    const scores = topicMetrics.map((m: PerformanceMetric) => {
      const topicData = m.performanceData[`topic_${topicId}`];
      return topicData?.accuracy || topicData?.score || m.productivityScore / 100 || 0;
    });
    
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calcular tendência comparando últimas 3 sessões com as 3 anteriores
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (scores.length >= 6) {
      const recent = scores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
      const previous = scores.slice(-6, -3).reduce((sum, score) => sum + score, 0) / 3;
      
      if (recent > previous + 0.1) trend = 'improving';
      else if (recent < previous - 0.1) trend = 'declining';
    }
    
    return {
      averageScore,
      totalSessions: topicMetrics.length,
      trend
    };
  } catch (error) {
    console.error('Erro ao analisar performance:', error);
    return { averageScore: 0, totalSessions: 0, trend: 'stable' };
  }
};

// Calcular ajuste automático baseado em performance
export const calculatePerformanceAdjustment = (
  topic: StudyTopic,
  config: AutoAdjustmentConfig
): { adjustment: number; reason: WeightAdjustmentReason | null } => {
  if (!config.enablePerformanceAdjustment) {
    return { adjustment: 0, reason: null };
  }
  
  const performance = analyzeTopicPerformance(topic.id);
  
  // Performance muito baixa - aumentar peso
  if (performance.averageScore < 0.3 && performance.totalSessions >= 3) {
    const adjustment = Math.min(config.maxAutoAdjustment, 3);
    return { adjustment, reason: 'low_performance' };
  }
  
  // Performance consistentemente baixa e em declínio
  if (performance.averageScore < 0.5 && performance.trend === 'declining' && performance.totalSessions >= 5) {
    const adjustment = Math.min(config.maxAutoAdjustment, 2);
    return { adjustment, reason: 'low_performance' };
  }
  
  // Performance muito alta e estável - pode reduzir peso
  if (performance.averageScore > 0.85 && performance.trend !== 'declining' && performance.totalSessions >= 5) {
    const adjustment = Math.max(-config.maxAutoAdjustment, -1);
    return { adjustment, reason: 'high_performance' };
  }
  
  return { adjustment: 0, reason: null };
};

// Calcular ajuste baseado em recência de estudo
export const calculateRecencyAdjustment = (
  topic: StudyTopic,
  config: AutoAdjustmentConfig,
  currentDate: Date = new Date()
): { adjustment: number; reason: WeightAdjustmentReason | null } => {
  if (!config.enableRecencyAdjustment || !topic.lastStudied) {
    return { adjustment: 0, reason: null };
  }
  
  const hoursSinceLastStudy = differenceInHours(currentDate, topic.lastStudied);
  
  // Não estudado há mais de uma semana
  if (hoursSinceLastStudy > 168) {
    const adjustment = Math.min(config.maxAutoAdjustment, 2);
    return { adjustment, reason: 'not_studied_recently' };
  }
  
  // Não estudado há mais de 3 dias
  if (hoursSinceLastStudy > 72) {
    const adjustment = Math.min(config.maxAutoAdjustment, 1);
    return { adjustment, reason: 'not_studied_recently' };
  }
  
  return { adjustment: 0, reason: null };
};

// Calcular ajuste baseado na proximidade do exame
export const calculateExamProximityAdjustment = (
  topic: StudyTopic,
  examDate: Date | undefined,
  config: AutoAdjustmentConfig,
  currentDate: Date = new Date()
): { adjustment: number; reason: WeightAdjustmentReason | null } => {
  if (!config.enableExamProximityAdjustment || !examDate) {
    return { adjustment: 0, reason: null };
  }
  
  const daysUntilExam = differenceInDays(examDate, currentDate);
  
  // Últimas duas semanas antes do exame - aumentar peso de tópicos críticos
  if (daysUntilExam <= 14 && (topic.weight || 1) >= 7) {
    const adjustment = Math.min(config.maxAutoAdjustment, 2);
    return { adjustment, reason: 'exam_proximity' };
  }
  
  // Última semana - ajuste mais agressivo
  if (daysUntilExam <= 7 && (topic.weight || 1) >= 6) {
    const adjustment = Math.min(config.maxAutoAdjustment, 3);
    return { adjustment, reason: 'exam_proximity' };
  }
  
  return { adjustment: 0, reason: null };
};

// Aplicar todos os ajustes automáticos a um tópico
export const applyAutoWeightAdjustments = (
  topic: StudyTopic,
  examDate: Date | undefined,
  config: AutoAdjustmentConfig = defaultAutoAdjustmentConfig,
  currentDate: Date = new Date()
): StudyTopic => {
  // Verificar se já houve ajuste recente
  if (topic.lastStudied) {
    const hoursSinceLastAdjustment = differenceInHours(currentDate, topic.lastStudied);
    if (hoursSinceLastAdjustment < config.adjustmentThreshold) {
      return topic; // Não fazer ajustes muito frequentes
    }
  }
  
  const performanceAdjustment = calculatePerformanceAdjustment(topic, config);
  const recencyAdjustment = calculateRecencyAdjustment(topic, config, currentDate);
  const examProximityAdjustment = calculateExamProximityAdjustment(topic, examDate, config, currentDate);
  
  // Selecionar o ajuste mais significativo
  const adjustments = [performanceAdjustment, recencyAdjustment, examProximityAdjustment]
    .filter(adj => adj.adjustment !== 0)
    .sort((a, b) => Math.abs(b.adjustment) - Math.abs(a.adjustment));
  
  if (adjustments.length === 0) {
    return topic;
  }
  
  const selectedAdjustment = adjustments[0];
  const currentWeight = topic.weight || 1;
  const suggestedWeight = Math.max(1, Math.min(10, currentWeight + selectedAdjustment.adjustment));
  
  return {
    ...topic,
    autoWeightAdjustment: selectedAdjustment.adjustment,
    weightReason: selectedAdjustment.reason!
  };
};

// Aplicar ajustes automáticos a todos os tópicos de um subject
export const applySubjectAutoAdjustments = (
  subject: StudySubject,
  examDate: Date | undefined,
  config: AutoAdjustmentConfig = defaultAutoAdjustmentConfig
): StudySubject => {
  if (!subject.topics) return subject;
  
  const updatedTopics = subject.topics.map(topic => 
    applyAutoWeightAdjustments(topic, examDate, config)
  );
  
  return {
    ...subject,
    topics: updatedTopics
  };
};

// Analisar performance de um subject baseado nos tópicos
export const analyzeSubjectPerformance = (subject: StudySubject): {
  averageScore: number;
  totalSessions: number;
  trend: 'improving' | 'declining' | 'stable';
} => {
  if (!subject.topics || subject.topics.length === 0) {
    return { averageScore: 0.5, totalSessions: 0, trend: 'stable' };
  }

  // Analisar performance dos tópicos do subject
  const topicPerformances = subject.topics.map(topic => analyzeTopicPerformance(topic.id));
  
  const averageScore = topicPerformances.length > 0 
    ? topicPerformances.reduce((sum, perf) => sum + perf.averageScore, 0) / topicPerformances.length
    : 0.5;
    
  const totalSessions = topicPerformances.reduce((sum, perf) => sum + perf.totalSessions, 0);
  
  // Determinar tendência geral do subject
  const trends = topicPerformances.map(p => p.trend);
  const improvingCount = trends.filter(t => t === 'improving').length;
  const decliningCount = trends.filter(t => t === 'declining').length;
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (improvingCount > decliningCount) trend = 'improving';
  else if (decliningCount > improvingCount) trend = 'declining';
  
  return { averageScore, totalSessions, trend };
};

// Calcular ajuste para subject baseado na análise dos tópicos
export const calculateSubjectAdjustment = (
  subject: StudySubject,
  examDate: Date | undefined,
  config: AutoAdjustmentConfig = defaultAutoAdjustmentConfig,
  currentDate: Date = new Date()
): { adjustment: number; reason: WeightAdjustmentReason | null } => {
  const performance = analyzeSubjectPerformance(subject);
  
  // Ajuste por performance
  if (config.enablePerformanceAdjustment) {
    if (performance.averageScore < 0.3 && performance.totalSessions >= 3) {
      return { adjustment: 2, reason: 'low_performance' };
    }
    if (performance.averageScore > 0.8 && performance.totalSessions >= 5) {
      return { adjustment: -1, reason: 'high_performance' };
    }
  }
  
  // Ajuste por recência
  if (config.enableRecencyAdjustment && subject.lastStudied) {
    const hoursSinceLastStudy = differenceInHours(currentDate, subject.lastStudied);
    if (hoursSinceLastStudy > 168) {
      return { adjustment: 2, reason: 'not_studied_recently' };
    }
  }
  
  // Ajuste por proximidade do exame
  if (config.enableExamProximityAdjustment && examDate) {
    const daysUntilExam = differenceInDays(examDate, currentDate);
    if (daysUntilExam <= 14 && (subject.weight || 1) >= 7) {
      return { adjustment: 1, reason: 'exam_proximity' };
    }
  }
  
  return { adjustment: 0, reason: null };
};

// Gerar relatório de ajustes sugeridos para subjects
export const generateAdjustmentReport = (
  subjects: StudySubject[],
  examDate: Date | undefined,
  config: AutoAdjustmentConfig = defaultAutoAdjustmentConfig
): {
  totalSuggestions: number;
  criticalAdjustments: number;
  moderateAdjustments: number;
  suggestions: Array<{
    subjectName: string;
    currentWeight: number;
    suggestedAdjustment: number;
    reason: WeightAdjustmentReason;
    impact: 'high' | 'medium' | 'low';
  }>;
} => {
  const suggestions = [];
  let criticalAdjustments = 0;
  let moderateAdjustments = 0;
  
  for (const subject of subjects) {
    const adjustment = calculateSubjectAdjustment(subject, examDate, config);
    
    if (adjustment.adjustment !== 0) {
      const impact = Math.abs(adjustment.adjustment) >= 2 ? 'high' : 
                    Math.abs(adjustment.adjustment) >= 1 ? 'medium' : 'low';
      
      if (impact === 'high') criticalAdjustments++;
      else if (impact === 'medium') moderateAdjustments++;
      
      suggestions.push({
        subjectName: subject.name,
        currentWeight: subject.weight || 1,
        suggestedAdjustment: adjustment.adjustment,
        reason: adjustment.reason!,
        impact
      });
    }
  }
  
  return {
    totalSuggestions: suggestions.length,
    criticalAdjustments,
    moderateAdjustments,
    suggestions
  };
};