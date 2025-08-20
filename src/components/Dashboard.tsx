import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, Target, BookOpen, TrendingUp, CheckCircle2 } from 'lucide-react';
import { StudySession, StudySubject, StudyPlan } from '@/types/study';
import { differenceInDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardProps {
  studySessions: StudySession[];
  subjects: StudySubject[];
  studyPlan: StudyPlan | null;
  examDate?: Date;
  selectedExam: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  studySessions, 
  subjects, 
  studyPlan, 
  examDate, 
  selectedExam 
}) => {
  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todaySessions = studySessions.filter(session => 
      session.startTime.toDateString() === today
    );
    
    const totalTime = todaySessions.reduce((sum, session) => sum + session.duration, 0);
    const completedSessions = todaySessions.filter(session => session.completed).length;
    
    return { totalTime, completedSessions, sessions: todaySessions.length };
  };

  const getWeekStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = studySessions.filter(session => 
      session.startTime >= weekAgo
    );
    
    const totalTime = weekSessions.reduce((sum, session) => sum + session.duration, 0);
    const avgPerDay = Math.round(totalTime / 7);
    
    return { totalTime, avgPerDay, sessions: weekSessions.length };
  };

  const getSubjectProgress = () => {
    if (studySessions.length === 0) return [];
    
    const subjectTime = studySessions.reduce((acc, session) => {
      acc[session.subject] = (acc[session.subject] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

    const totalTime = Object.values(subjectTime).reduce((sum, time) => sum + time, 0);

    return Object.entries(subjectTime).map(([subject, time]) => ({
      subject,
      time,
      percentage: totalTime > 0 ? Math.round((time / totalTime) * 100) : 0
    }));
  };

  const todayStats = getTodayStats();
  const weekStats = getWeekStats();
  const subjectProgress = getSubjectProgress();
  // Calcular dias restantes corretamente: começar do início do dia da prova vs início do dia atual
  const daysUntilExam = examDate ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const examDateStart = new Date(examDate);
    examDateStart.setHours(0, 0, 0, 0);
    
    return differenceInDays(examDateStart, today);
  })() : null;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-study-primary" />
              <div className="text-2xl font-bold text-study-primary">{todayStats.totalTime}</div>
            </div>
            <p className="text-xs text-muted-foreground">minutos hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-study-success" />
              <div className="text-2xl font-bold text-study-success">{todayStats.completedSessions}</div>
            </div>
            <p className="text-xs text-muted-foreground">sessões completas</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-study-accent" />
              <div className="text-2xl font-bold text-study-accent">{weekStats.avgPerDay}</div>
            </div>
            <p className="text-xs text-muted-foreground">min/dia (média)</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-study-warning" />
              <div className="text-2xl font-bold text-study-warning">
                {daysUntilExam !== null ? (daysUntilExam < 0 ? `+${Math.abs(daysUntilExam)}` : daysUntilExam) : '--'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {daysUntilExam !== null ? (daysUntilExam < 0 ? 'dias após' : 'dias restantes') : 'sem exame'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Subject */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-study-primary" />
              <span>Progresso por Matéria</span>
            </CardTitle>
            <CardDescription>Distribuição do tempo de estudo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subjectProgress.length > 0 ? (
                subjectProgress.map(({ subject, time, percentage }) => (
                  <div key={subject} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{subject}</span>
                      <span className="text-sm text-muted-foreground">{time}min ({percentage}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma sessão de estudo registrada ainda
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-study-accent" />
              <span>Informações do Plano</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studyPlan ? (
                <>
                  <div className="flex justify-between items-center p-3 bg-study-primary/10 rounded-lg">
                    <span className="text-sm font-medium">Tipo de Plano</span>
                    <Badge variant="outline" className="bg-study-primary/20 text-study-primary border-study-primary/30">
                      {studyPlan.type === 'cycle' ? 'Ciclo de Estudos' : 'Cronograma Linear'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-study-accent/10 rounded-lg">
                      <span className="text-sm font-medium">Horas Semanais</span>
                      <span className="font-bold text-study-accent">{studyPlan.totalHours}h</span>
                    </div>
                    
                    {examDate && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-study-warning/10 rounded-lg">
                          <span className="text-sm font-medium">Dias Restantes</span>
                          <span className="font-bold text-study-warning">
                            {daysUntilExam !== null ? (daysUntilExam < 0 ? `+${Math.abs(daysUntilExam)}` : daysUntilExam) : '--'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center p-3 bg-study-success/10 rounded-lg">
                          <span className="text-sm font-medium">Data da Prova</span>
                          <span className="font-bold text-study-success text-sm">
                            {format(examDate, "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-study-success/10 rounded-lg">
                    <span className="text-sm font-medium">Matérias</span>
                    <span className="font-bold text-study-success">{studyPlan.subjects?.length || 0}</span>
                  </div>
                  
                  {studyPlan.intensity && (
                    <div className="flex justify-between items-center p-3 bg-study-warning/10 rounded-lg">
                      <span className="text-sm font-medium">Intensidade</span>
                      <Badge variant="outline" className={`
                        ${studyPlan.intensity === 'high' ? 'bg-study-danger/20 text-study-danger border-study-danger/30' : 
                          studyPlan.intensity === 'medium' ? 'bg-study-warning/20 text-study-warning border-study-warning/30' : 
                          'bg-study-success/20 text-study-success border-study-success/30'}
                      `}>
                        {studyPlan.intensity === 'high' ? 'Alta' : 
                         studyPlan.intensity === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Nenhum plano criado ainda</p>
                  <p className="text-sm text-muted-foreground">Complete o assistente para gerar seu plano personalizado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      {studySessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sessões Recentes</CardTitle>
            <CardDescription>Últimas 5 sessões de estudo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {studySessions.slice(-5).reverse().map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      session.completed ? 'bg-study-success' : 'bg-study-warning'
                    }`}></div>
                    <div>
                      <div className="font-medium text-sm">{session.subject}</div>
                      {session.topic && (
                        <div className="text-xs text-muted-foreground">📖 {session.topic}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{session.duration}min</div>
                    <div className="text-xs text-muted-foreground">
                      {format(session.startTime, 'dd/MM HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;