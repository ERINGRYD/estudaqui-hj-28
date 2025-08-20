
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Clock, Target } from 'lucide-react';
import { StudySession, StudySubject } from '@/types/study';

interface StudyProgressWidgetProps {
  studySessions: StudySession[];
  subjects: StudySubject[];
}

const StudyProgressWidget: React.FC<StudyProgressWidgetProps> = ({ 
  studySessions, 
  subjects 
}) => {
  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todaySessions = studySessions.filter(session => 
      session.startTime.toDateString() === today
    );
    
    const totalTime = todaySessions.length > 0 ? todaySessions.reduce((sum, session) => sum + session.duration, 0) : 0;
    const completedSessions = todaySessions.filter(session => session.completed).length;
    
    return { totalTime, completedSessions, totalSessions: todaySessions.length };
  };

  const getWeekStats = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekSessions = studySessions.filter(session => 
      session.startTime >= weekAgo
    );
    
    const totalTime = weekSessions.length > 0 ? weekSessions.reduce((sum, session) => sum + session.duration, 0) : 0;
    const avgPerDay = Math.round(totalTime / 7);
    
    return { totalTime, avgPerDay };
  };

  const getSubjectProgress = () => {
    if (studySessions.length === 0) return [];
    
    const subjectTime = studySessions.reduce((acc, session) => {
      acc[session.subject] = (acc[session.subject] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

    return subjects.map(subject => ({
      name: subject.name,
      time: subjectTime[subject.name] || 0,
      color: subject.color
    })).sort((a, b) => b.time - a.time);
  };

  const todayStats = getTodayStats();
  const weekStats = getWeekStats();
  const subjectProgress = getSubjectProgress();
  const totalStudyTime = studySessions.length > 0 ? studySessions.reduce((sum, session) => sum + session.duration, 0) : 0;

  return (
    <Card className="bg-gradient-to-br from-study-secondary/20 to-study-accent/10 border-study-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-study-primary">
          <TrendingUp className="h-5 w-5" />
          <span>Progresso dos Estudos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today's Progress */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-study-primary/10 rounded-lg border border-study-primary/20">
            <div className="text-2xl font-bold text-study-primary">{todayStats.totalTime}</div>
            <div className="text-sm text-muted-foreground">min hoje</div>
          </div>
          <div className="text-center p-3 bg-study-accent/10 rounded-lg border border-study-accent/20">
            <div className="text-2xl font-bold text-study-accent">{todayStats.completedSessions}</div>
            <div className="text-sm text-muted-foreground">sessões</div>
          </div>
        </div>

        {/* Weekly Average */}
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="h-4 w-4 text-study-primary" />
          <span className="text-muted-foreground">Média semanal:</span>
          <span className="font-medium text-study-primary">{weekStats.avgPerDay} min/dia</span>
        </div>

        {/* Subject Progress */}
        {subjectProgress.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Target className="h-4 w-4 text-study-primary" />
              <span>Por Matéria:</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {subjectProgress.slice(0, 5).map(subject => (
                <div key={subject.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate flex-1">{subject.name}</span>
                    <span className="font-medium text-study-primary">{subject.time}min</span>
                  </div>
                  <Progress 
                    value={totalStudyTime > 0 ? (subject.time / totalStudyTime) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudyProgressWidget;
