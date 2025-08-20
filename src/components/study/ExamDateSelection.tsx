
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarIcon, Clock, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, differenceInDays, differenceInWeeks, differenceInMonths, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ExamDateSelectionProps {
  examDate: Date | undefined;
  setExamDate: (date: Date | undefined) => void;
  onNext: () => void;
  onBack: () => void;
}

const ExamDateSelection = ({ examDate, setExamDate, onNext, onBack }: ExamDateSelectionProps) => {
  // Calcular dias restantes corretamente: começar do início do dia da prova vs início do dia atual
  const daysUntilExam = examDate ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const examDateStart = new Date(examDate);
    examDateStart.setHours(0, 0, 0, 0);
    
    return differenceInDays(examDateStart, today);
  })() : 0;
  
  const weeksUntilExam = examDate ? differenceInWeeks(examDate, new Date()) : 0;
  const monthsUntilExam = examDate ? differenceInMonths(examDate, new Date()) : 0;

  const getUrgencyLevel = (days: number) => {
    if (days < 0) return 'expired';
    if (days < 30) return 'critical';
    if (days < 60) return 'urgent';
    if (days < 120) return 'moderate';
    return 'comfortable';
  };

  const getUrgencyColor = (level: string) => {
    const colors = {
      expired: 'text-red-600 bg-red-50 border-red-200',
      critical: 'text-red-500 bg-red-50 border-red-200',
      urgent: 'text-orange-500 bg-orange-50 border-orange-200',
      moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      comfortable: 'text-green-600 bg-green-50 border-green-200'
    };
    return colors[level as keyof typeof colors] || colors.comfortable;
  };

  const getUrgencyMessage = (days: number) => {
    if (days < 0) return {
      title: 'Data já passou!',
      message: 'Selecione uma nova data para sua prova',
      icon: AlertTriangle
    };
    if (days === 0) return {
      title: 'Prova é hoje!',
      message: 'Boa sorte! Foque na revisão final',
      icon: Target
    };
    if (days === 1) return {
      title: 'Prova é amanhã!',
      message: 'Último dia de preparação - revisão intensiva',
      icon: Clock
    };
    if (days < 7) return {
      title: `Apenas ${days} dias restantes!`,
      message: 'Foque nos pontos mais importantes e revisão',
      icon: AlertTriangle
    };
    if (days < 30) return {
      title: `${days} dias - Reta final!`,
      message: 'Intensificar estudos e fazer simulados',
      icon: Target
    };
    if (days < 60) return {
      title: `${days} dias - Preparação intensiva`,
      message: 'Bom tempo para estudos focados e exercícios',
      icon: Clock
    };
    if (days < 120) return {
      title: `${days} dias - Preparação consistente`,
      message: 'Tempo adequado para estudar com tranquilidade',
      icon: CheckCircle2
    };
    return {
      title: `${days} dias - Tempo confortável`,
      message: 'Excelente tempo para preparação completa',
      icon: CheckCircle2
    };
  };

  const getStudyIntensity = (days: number) => {
    if (days < 30) return { level: 'Muito Alta', hours: '6-8h/dia', color: 'text-red-600' };
    if (days < 60) return { level: 'Alta', hours: '4-6h/dia', color: 'text-orange-500' };
    if (days < 120) return { level: 'Moderada', hours: '3-4h/dia', color: 'text-yellow-600' };
    return { level: 'Relaxada', hours: '2-3h/dia', color: 'text-green-600' };
  };

  const getSuggestedMilestones = (examDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const examDateStart = new Date(examDate);
    examDateStart.setHours(0, 0, 0, 0);
    
    const totalDays = differenceInDays(examDateStart, today);
    
    if (totalDays <= 0) return [];
    
    const milestones = [];
    
    if (totalDays > 90) {
      milestones.push({
        date: addDays(today, Math.floor(totalDays * 0.3)),
        title: 'Primeira Revisão Geral',
        description: 'Completar primeira rodada de todos os conteúdos'
      });
    }
    
    if (totalDays > 60) {
      milestones.push({
        date: addDays(today, Math.floor(totalDays * 0.6)),
        title: 'Intensificar Exercícios',
        description: 'Focar em questões e simulados'
      });
    }
    
    if (totalDays > 30) {
      milestones.push({
        date: addDays(today, Math.floor(totalDays * 0.8)),
        title: 'Revisão Final',
        description: 'Revisar pontos fracos e fazer últimos simulados'
      });
    }
    
    milestones.push({
      date: addDays(examDate, -7),
      title: 'Semana Final',
      description: 'Revisão leve e descanso mental'
    });
    
    return milestones;
  };

  const urgencyLevel = getUrgencyLevel(daysUntilExam);
  const urgencyInfo = getUrgencyMessage(daysUntilExam);
  const studyIntensity = getStudyIntensity(daysUntilExam);
  const milestones = examDate ? getSuggestedMilestones(examDate) : [];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CalendarIcon className="h-5 w-5 text-study-primary" />
          <span>Data da Prova</span>
        </CardTitle>
        <CardDescription>
          Defina a data do seu exame para otimizar o plano de estudos e acompanhar o countdown
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calendar Selection */}
        <div className="flex flex-col items-center space-y-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full max-w-sm justify-start text-left font-normal",
                  !examDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {examDate ? format(examDate, "PPP", { locale: ptBR }) : "Selecione a data da prova"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={examDate}
                onSelect={setExamDate}
                disabled={(date) => date < new Date()}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        {examDate && (
          <div className="space-y-6">
            {/* Countdown Display */}
            <Card className={`p-6 border-2 ${getUrgencyColor(urgencyLevel)}`}>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <urgencyInfo.icon className="h-6 w-6" />
                  <span className="text-xl font-semibold">{urgencyInfo.title}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold">{Math.abs(daysUntilExam)}</div>
                    <div className="text-sm opacity-75">dias</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{Math.abs(weeksUntilExam)}</div>
                    <div className="text-sm opacity-75">semanas</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{Math.abs(monthsUntilExam)}</div>
                    <div className="text-sm opacity-75">meses</div>
                  </div>
                </div>
                
                <p className="text-sm opacity-90">{urgencyInfo.message}</p>
              </div>
            </Card>

            {/* Study Intensity Recommendation */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Intensidade Recomendada</span>
                </h3>
                <Badge variant="outline" className={studyIntensity.color}>
                  {studyIntensity.level}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Horas por dia:</span>
                  <div className="font-medium">{studyIntensity.hours}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Progresso sugerido:</span>
                  <div className="font-medium">
                    {daysUntilExam > 0 ? Math.round(100 / daysUntilExam * 7) : 100}% por semana
                  </div>
                </div>
              </div>
            </Card>

            {/* Timeline Milestones */}
            {milestones.length > 0 && (
              <Card className="p-4">
                <h3 className="font-medium flex items-center space-x-2 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>Marcos Importantes</span>
                </h3>
                <div className="space-y-3">
                  {milestones.map((milestone, index) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    const milestoneStart = new Date(milestone.date);
                    milestoneStart.setHours(0, 0, 0, 0);
                    
                    const daysToMilestone = differenceInDays(milestoneStart, today);
                    const isUpcoming = daysToMilestone <= 7 && daysToMilestone >= 0;
                    
                    return (
                      <div 
                        key={index}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          isUpcoming ? 'bg-study-primary/10 border-study-primary/30' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            isUpcoming ? 'bg-study-primary' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{milestone.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {daysToMilestone > 0 ? `${daysToMilestone} dias` : 'Agora'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {milestone.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(milestone.date, "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={!examDate}
            className="bg-study-primary hover:bg-study-primary/90"
          >
            Próximo: Configurar Matérias
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExamDateSelection;
