import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, AlertTriangle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { StudyPlan, ExamType } from '@/types/study';

interface StudyPlanHeaderProps {
  studyPlan: StudyPlan;
  examDate?: Date;
  selectedExam: string;
  examTypes: ExamType[];
  subjectLevels: Record<string, string>;
}

const StudyPlanHeader: React.FC<StudyPlanHeaderProps> = ({
  studyPlan,
  examDate,
  selectedExam,
  examTypes,
  subjectLevels
}) => {
  const examType = examTypes.find(e => e.id === selectedExam);
  // Calcular dias restantes corretamente: começar do início do dia da prova vs início do dia atual
  const daysRemaining = examDate ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const examDateStart = new Date(examDate);
    examDateStart.setHours(0, 0, 0, 0);
    
    return differenceInDays(examDateStart, today);
  })() : null;
  
  const getUrgencyData = (days: number | null) => {
    if (days === null) return { color: 'bg-gray-500', text: 'Indefinido' };
    if (days < 0) return { color: 'bg-gray-500', text: 'Exame passou' };
    if (days === 0) return { color: 'bg-red-600', text: 'Hoje!' };
    if (days <= 7) return { color: 'bg-red-500', text: 'Muito Urgente' };
    if (days <= 30) return { color: 'bg-orange-500', text: 'Alta Prioridade' };
    if (days <= 60) return { color: 'bg-yellow-500', text: 'Médio Prazo' };
    return { color: 'bg-green-500', text: 'Longo Prazo' };
  };

  const isToday = daysRemaining === 0;
  const isPast = daysRemaining !== null && daysRemaining < 0;
  const urgency = getUrgencyData(daysRemaining);

  const getHeaderStyles = () => {
    if (daysRemaining === null) return 'bg-gradient-to-r from-study-primary to-study-accent text-study-primary-foreground';
    if (daysRemaining < 0) return 'bg-gradient-to-r from-muted to-muted/80 text-muted-foreground';
    if (daysRemaining === 0) return 'bg-gradient-to-r from-study-danger to-red-600 text-white';
    if (daysRemaining <= 7) return 'bg-gradient-to-r from-study-danger to-red-500 text-white';
    if (daysRemaining <= 30) return 'bg-gradient-to-r from-study-warning to-orange-500 text-white';
    if (daysRemaining <= 60) return 'bg-gradient-to-r from-study-warning to-yellow-500 text-black';
    return 'bg-gradient-to-r from-study-success to-green-500 text-white';
  };

  return (
    <div className={`${getHeaderStyles()} rounded-lg p-6`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">
            {studyPlan.type === 'cycle' ? '🔄 Ciclo de Estudos' : '📅 Plano de Estudos'}
          </h2>
          <p className="opacity-90 text-sm mb-3">
            Plano personalizado de estudos
          </p>
          
          {/* Study Plan Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {/* Weekly Hours - Primary metric */}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 opacity-80" />
              <span className="opacity-80">Horas semanais:</span>
              <span className="font-bold text-lg">{studyPlan.totalHours}h</span>
            </div>

            {/* Exam Type */}
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 opacity-80" />
              <span className="opacity-80">Exame:</span>
              <span className="font-medium truncate">
                {examType?.name || 'Personalizado'}
              </span>
            </div>

            {/* Days Remaining */}
            {examDate && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 opacity-80" />
                <span className="opacity-80">Dias restantes:</span>
                <span className={`font-bold ${
                  isToday ? 'animate-pulse' : ''
                }`}>
                  {isPast ? `+${Math.abs(daysRemaining!)}` : daysRemaining}
                </span>
              </div>
            )}

            {/* Exam Date */}
            {examDate && (
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 opacity-80" />
                <span className="opacity-80">Data da prova:</span>
                <span className="font-medium">
                  {format(examDate, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Status Badges */}
        <div className="flex flex-col items-end space-y-2 ml-4">
          {daysRemaining !== null && (
            <Badge className={`${urgency.color} text-white border-none`}>
              {urgency.text}
            </Badge>
          )}
          
          <Badge className="bg-white/20 text-white border-white/30 text-xs">
            {Object.keys(subjectLevels).length} matérias
          </Badge>
        </div>
      </div>

      {/* Alert for today */}
      {isToday && (
        <div className="flex items-center justify-center space-x-2 mt-4 p-3 bg-red-500/20 rounded-lg border border-red-400/30">
          <AlertTriangle className="h-4 w-4 text-red-100" />
          <span className="text-red-100 font-medium text-sm">
            É hoje! Boa sorte! 🍀
          </span>
        </div>
      )}

      {/* Focus areas */}
      <div className="flex flex-wrap gap-2 mt-4">
        <Badge className="bg-white/20 text-white border-white/30 text-xs">
          📚 {studyPlan.focusAreas.length} áreas prioritárias
        </Badge>
        <Badge className="bg-white/20 text-white border-white/30 text-xs">
          🎯 {studyPlan.type === 'cycle' ? 'Ciclo' : 'Linear'}
        </Badge>
      </div>
    </div>
  );
};

export default StudyPlanHeader;