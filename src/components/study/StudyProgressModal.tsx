import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock, BookOpen, Target, X, BarChart3, Pause, MapPin, Calendar } from 'lucide-react';
import { StudyPlan, StudySession } from '@/types/study';

interface StudyProgressModalProps {
  open: boolean;
  onClose: () => void;
  studyPlan: StudyPlan;
  studySessions: StudySession[];
  weeklyHourLimit?: number;
}

const StudyProgressModal: React.FC<StudyProgressModalProps> = ({
  open,
  onClose,
  studyPlan,
  studySessions,
  weeklyHourLimit = 0
}) => {
  const calculateStudyTime = (sessions: StudySession[]): number => {
    return sessions.reduce((total, session) => {
      if (session.notes) {
        try {
          const notesData = JSON.parse(session.notes);
          const netSeconds = notesData.times?.netSeconds || (session.duration * 60);
          return total + (netSeconds / 60);
        } catch {
          return total + session.duration;
        }
      }
      return total + session.duration;
    }, 0);
  };

  const getSubjectShare = (subjectName: string): number => {
    const dataMap = new Map();
    if (studyPlan.data && Array.isArray(studyPlan.data)) {
      studyPlan.data.forEach((item: any) => {
        if (item.subject) {
          dataMap.set(item.subject, item);
        }
      });
    }

    const totalHoursFromData = studyPlan.data ? 
      studyPlan.data.reduce((sum: number, item: any) => sum + (item.hours || 0), 0) : 0;
    
    // Priority 1: For cycle plans, use percentages from data
    if (studyPlan.type === 'cycle') {
      const dataEntry = dataMap.get(subjectName) as any;
      if (dataEntry?.percentage) {
        return dataEntry.percentage / 100;
      }
    }
    
    // Priority 2: For schedule plans, use hours from data
    if (studyPlan.type === 'schedule' && totalHoursFromData > 0) {
      const dataEntry = dataMap.get(subjectName) as any;
      if (dataEntry?.hours) {
        return dataEntry.hours / totalHoursFromData;
      }
    }
    
    // Priority 3: Use weights from subjects
    const subject = studyPlan.subjects.find(s => s.name === subjectName);
    if (subject?.weight) {
      const totalWeight = studyPlan.subjects.reduce((sum, s) => sum + (s.weight || 1), 0);
      return subject.weight / totalWeight;
    }
    
    // Priority 4: Equal distribution
    return 1 / studyPlan.subjects.length;
  };

  const formatExactTime = (minutes: number): string => {
    const totalSeconds = Math.round(minutes * 60);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return s > 0 ? `${m}m${s.toString().padStart(2, '0')}s` : `${m}min`;
  };

  // Extract additional data from study sessions
  const getSessionAnalytics = (subjectSessions: StudySession[]) => {
    const analytics = {
      studyTypes: new Map<string, number>(),
      totalPauseTime: 0,
      stopPoints: [] as string[],
      totalNetTime: 0,
      totalSessions: subjectSessions.length
    };

    subjectSessions.forEach(session => {
      if (session.notes) {
        try {
          const notesData = JSON.parse(session.notes);
          
          // Study type analysis
          if (notesData.studyType) {
            const current = analytics.studyTypes.get(notesData.studyType) || 0;
            analytics.studyTypes.set(notesData.studyType, current + 1);
          }
          
          // Pause time accumulation
          if (notesData.times?.pauseSeconds) {
            analytics.totalPauseTime += notesData.times.pauseSeconds;
          }
          
          // Net time accumulation
          if (notesData.times?.netSeconds) {
            analytics.totalNetTime += notesData.times.netSeconds;
          } else {
            analytics.totalNetTime += session.duration * 60;
          }
          
          // Stop points collection
          if (notesData.stopPoint && notesData.stopPoint.trim()) {
            analytics.stopPoints.push(notesData.stopPoint);
          }
        } catch {
          // If notes parsing fails, just add duration
          analytics.totalNetTime += session.duration * 60;
        }
      } else {
        analytics.totalNetTime += session.duration * 60;
      }
    });

    return analytics;
  };

  const currentWeekStart = new Date();
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
  currentWeekStart.setHours(0, 0, 0, 0);
  
  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  const weekSessions = studySessions.filter(session => {
    const sessionDate = new Date(session.startTime);
    return sessionDate >= currentWeekStart && sessionDate <= currentWeekEnd;
  });

  const totalStudyTime = calculateStudyTime(weekSessions);
  const weeklyProgress = weeklyHourLimit > 0 ? (totalStudyTime / (weeklyHourLimit * 60)) * 100 : 0;

  const subjectProgress = studyPlan.subjects.map(subject => {
    const subjectSessions = weekSessions.filter(session => session.subject === subject.name);
    const subjectTime = calculateStudyTime(subjectSessions);
    const share = getSubjectShare(subject.name);
    const targetMinutes = weeklyHourLimit * 60 * share;
    const progress = targetMinutes > 0 ? (subjectTime / targetMinutes) * 100 : 0;
    const analytics = getSessionAnalytics(subjectSessions);

    return {
      subject,
      time: subjectTime,
      target: targetMinutes,
      progress: Math.min(progress, 100),
      share,
      analytics
    };
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Progresso Semanal dos Estudos</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Visão Geral da Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Meta semanal: {weeklyHourLimit}h ({weeklyHourLimit * 60}min)
                  </span>
                  <span className="text-sm font-medium">
                    {Math.floor(totalStudyTime / 60)}h {Math.floor(totalStudyTime % 60)}min
                  </span>
                </div>
                <Progress value={weeklyProgress} className="h-2" />
                <div className="text-center">
                  <span className="text-2xl font-bold">{weeklyProgress.toFixed(1)}%</span>
                  <p className="text-sm text-muted-foreground">da meta semanal concluída</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Progress with Analytics */}
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Progresso por Matéria</h3>
            {subjectProgress.map(({ subject, time, target, progress, share, analytics }) => (
              <Card key={subject.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{subject.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              {(share * 100).toFixed(1)}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Proporção da meta semanal</p>
                            <p>{weeklyHourLimit * 60} min × {(share * 100).toFixed(1)}% = {formatExactTime(target)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Meta individual: {formatExactTime(target)} ({(share * 100).toFixed(1)}%)
                    </span>
                    <span className="font-medium">
                      {Math.floor(time / 60)}h {Math.floor(time % 60)}min
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  
                  {/* Analytics Section */}
                  {analytics.totalSessions > 0 && (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {/* Study Types */}
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">Tipos de estudo</p>
                            {Array.from(analytics.studyTypes.entries()).map(([type, count]) => (
                              <p key={type} className="text-muted-foreground text-xs">
                                {type}: {count}x
                              </p>
                            ))}
                          </div>
                        </div>

                        {/* Pause Time */}
                        <div className="flex items-center gap-2">
                          <Pause className="h-4 w-4 text-accent-foreground" />
                          <div>
                            <p className="font-medium">Tempo de pausa</p>
                            <p className="text-muted-foreground text-xs">
                              {Math.floor(analytics.totalPauseTime / 60)}min
                            </p>
                          </div>
                        </div>

                        {/* Net Study Time */}
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium">Tempo líquido</p>
                            <p className="text-muted-foreground text-xs">
                              {Math.floor(analytics.totalNetTime / 60)}min
                            </p>
                          </div>
                        </div>

                        {/* Sessions Count */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-secondary-foreground" />
                          <div>
                            <p className="font-medium">Sessões</p>
                            <p className="text-muted-foreground text-xs">
                              {analytics.totalSessions} sessão{analytics.totalSessions !== 1 ? 'ões' : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stop Points */}
                      {analytics.stopPoints.length > 0 && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-destructive mt-1" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">Pontos de parada</p>
                            <div className="space-y-1">
                              {analytics.stopPoints.slice(-3).map((point, index) => (
                                <p key={index} className="text-muted-foreground text-xs bg-muted/50 rounded px-2 py-1">
                                  {point}
                                </p>
                              ))}
                              {analytics.stopPoints.length > 3 && (
                                <p className="text-muted-foreground text-xs italic">
                                  +{analytics.stopPoints.length - 3} ponto{analytics.stopPoints.length - 3 !== 1 ? 's' : ''} anterior{analytics.stopPoints.length - 3 !== 1 ? 'es' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-center">
                    <span className="text-lg font-bold">{progress.toFixed(1)}%</span>
                    <p className="text-xs text-muted-foreground">da meta individual</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudyProgressModal;
