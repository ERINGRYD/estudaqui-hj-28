import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, AlertTriangle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExamType } from '@/types/study';
interface StudyHeaderInfoProps {
  examDate?: Date;
  selectedExam: string;
  examTypes: ExamType[];
  currentSubject?: string;
  currentTopic?: string;
  currentSubtopic?: string;
  nextSuggestion?: string;
  compact?: boolean;
}
const StudyHeaderInfo: React.FC<StudyHeaderInfoProps> = ({
  examDate,
  selectedExam,
  examTypes,
  currentSubject,
  currentTopic,
  currentSubtopic,
  nextSuggestion,
  compact = false
}) => {
  if (!examDate) return null;
  // Calcular dias restantes corretamente: começar do início do dia da prova vs início do dia atual
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const examDateStart = new Date(examDate);
  examDateStart.setHours(0, 0, 0, 0);
  
  const daysRemaining = differenceInDays(examDateStart, today);
  const examType = examTypes.find(e => e.id === selectedExam);
  const getUrgencyLevel = (days: number) => {
    if (days < 0) return {
      level: 'past',
      color: 'bg-gray-500',
      text: 'Exame passou'
    };
    if (days === 0) return {
      level: 'today',
      color: 'bg-red-600',
      text: 'Hoje!'
    };
    if (days <= 7) return {
      level: 'urgent',
      color: 'bg-red-500',
      text: 'Muito Urgente'
    };
    if (days <= 30) return {
      level: 'high',
      color: 'bg-orange-500',
      text: 'Alta Prioridade'
    };
    if (days <= 60) return {
      level: 'medium',
      color: 'bg-yellow-500',
      text: 'Médio Prazo'
    };
    return {
      level: 'low',
      color: 'bg-green-500',
      text: 'Longo Prazo'
    };
  };
  const urgency = getUrgencyLevel(daysRemaining);
  const isToday = daysRemaining === 0;
  const isPast = daysRemaining < 0;
  if (compact) {
    return <div className="bg-gradient-to-r from-study-primary/10 to-study-accent/10 border border-study-primary/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-study-primary" />
            <div>
              <div className="font-medium text-study-primary">
                {examType?.name || 'Exame Personalizado'}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(examDate, "d 'de' MMMM", {
                locale: ptBR
              })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className={`text-2xl font-bold ${isToday ? 'text-red-600 animate-pulse' : isPast ? 'text-gray-500' : 'text-study-primary'}`}>
                {isPast ? `+${Math.abs(daysRemaining)}` : daysRemaining}
              </div>
              <div className="text-xs text-muted-foreground">
                {isPast ? 'dias após' : 'dias restantes'}
              </div>
            </div>
            
            <Badge className={`${urgency.color} text-white border-none`}>
              {urgency.text}
            </Badge>
          </div>
        </div>

        {(currentSubject || nextSuggestion) && <div className="mt-3 pt-3 border-t border-study-primary/20">
            <div className="flex items-center space-x-2 text-sm">
              <Target className="h-3 w-3 text-study-accent" />
              <span className="text-muted-foreground">
                {currentSubject ? 'Estudando:' : 'Próximo:'}
              </span>
              <span className="font-medium text-study-primary">
                {currentSubject || nextSuggestion}
              </span>
            </div>
            {currentTopic && <div className="text-xs text-muted-foreground pl-5">
                📖 {currentTopic}
                {currentSubtopic && <span className="pl-2">• {currentSubtopic}</span>}
              </div>}
          </div>}

        {isToday && <div className="mt-3 pt-3 border-t border-red-500/20">
            <div className="flex items-center justify-center space-x-2 text-red-600 font-medium text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>É hoje! Boa sorte! 🍀</span>
            </div>
          </div>}
      </div>;
  }
  return;
};
export default StudyHeaderInfo;