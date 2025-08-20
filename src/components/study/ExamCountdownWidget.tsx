
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Target, AlertTriangle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ExamType } from '@/types/study';

interface ExamCountdownWidgetProps {
  examDate: Date;
  selectedExam: string;
  examTypes: ExamType[];
}

const ExamCountdownWidget: React.FC<ExamCountdownWidgetProps> = ({ 
  examDate, 
  selectedExam, 
  examTypes 
}) => {
  // Calcular dias restantes corretamente: começar do início do dia da prova vs início do dia atual
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const examDateStart = new Date(examDate);
  examDateStart.setHours(0, 0, 0, 0);
  
  const daysRemaining = differenceInDays(examDateStart, today);
  const examType = examTypes.find(e => e.id === selectedExam);
  
  const getUrgencyLevel = (days: number) => {
    if (days < 0) return { level: 'past', color: 'bg-gray-500', text: 'Exame passou' };
    if (days === 0) return { level: 'today', color: 'bg-red-600', text: 'Hoje!' };
    if (days <= 7) return { level: 'urgent', color: 'bg-red-500', text: 'Muito Urgente' };
    if (days <= 30) return { level: 'high', color: 'bg-orange-500', text: 'Alta Prioridade' };
    if (days <= 60) return { level: 'medium', color: 'bg-yellow-500', text: 'Médio Prazo' };
    return { level: 'low', color: 'bg-green-500', text: 'Longo Prazo' };
  };

  const urgency = getUrgencyLevel(daysRemaining);
  const isToday = daysRemaining === 0;
  const isPast = daysRemaining < 0;

  return (
    <Card className={`bg-gradient-to-br from-white to-gray-50 border-2 ${
      isToday ? 'border-red-500 animate-pulse' : 
      isPast ? 'border-gray-400' : 'border-study-primary/30'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-study-primary" />
            <span className="text-study-primary">
              {examType?.name || 'Exame Personalizado'}
            </span>
          </div>
          <Badge 
            className={`${urgency.color} text-white border-none`}
            variant="secondary"
          >
            {urgency.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Countdown Display */}
        <div className="text-center">
          <div className={`text-4xl font-bold ${
            isToday ? 'text-red-600 animate-pulse' : 
            isPast ? 'text-gray-500' : 'text-study-primary'
          }`}>
            {isPast ? `+${Math.abs(daysRemaining)}` : daysRemaining}
          </div>
          <div className="text-sm text-muted-foreground">
            {isPast ? 'dias após o exame' : daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
          </div>
        </div>

        {/* Date Information */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          <Clock className="h-4 w-4 text-study-primary" />
          <span className="text-muted-foreground">
            {format(examDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>
        </div>

        {/* Motivational Message */}
        <div className="text-center p-3 bg-study-secondary/20 rounded-lg border border-study-primary/20">
          {isToday && (
            <div className="flex items-center justify-center space-x-2 text-red-600 font-medium">
              <AlertTriangle className="h-4 w-4" />
              <span>É hoje! Boa sorte! 🍀</span>
            </div>
          )}
          {!isToday && !isPast && daysRemaining <= 7 && (
            <div className="flex items-center justify-center space-x-2 text-orange-600 font-medium">
              <Target className="h-4 w-4" />
              <span>Última semana! Foco total! 💪</span>
            </div>
          )}
          {!isToday && !isPast && daysRemaining > 7 && daysRemaining <= 30 && (
            <div className="text-study-primary font-medium">
              <Target className="h-4 w-4 inline mr-2" />
              Intensificar os estudos! 📚
            </div>
          )}
          {!isToday && !isPast && daysRemaining > 30 && (
            <div className="text-study-primary">
              <span>Tempo para se preparar bem! 🎯</span>
            </div>
          )}
          {isPast && (
            <div className="text-gray-500">
              <span>Esperamos que tenha ido bem! 🌟</span>
            </div>
          )}
        </div>

        {/* Study Intensity Recommendation */}
        {!isPast && (
          <div className="text-xs text-center text-muted-foreground">
            Recomendação: {
              daysRemaining <= 30 ? 'Estudo intensivo (4-6h/dia)' :
              daysRemaining <= 60 ? 'Estudo regular (2-4h/dia)' :
              'Estudo constante (1-3h/dia)'
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamCountdownWidget;
