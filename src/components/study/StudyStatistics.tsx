
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudySession } from '@/types/study';

interface StudyStatisticsProps {
  studySessions: StudySession[];
}

const StudyStatistics: React.FC<StudyStatisticsProps> = ({ studySessions }) => {
  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todaySessions = studySessions.filter(session => 
      session.startTime.toDateString() === today
    );
    
    if (todaySessions.length === 0) {
      return { totalTime: 0, sessions: 0, subjectBreakdown: {} };
    }
    
    const totalTime = todaySessions.reduce((sum, session) => sum + session.duration, 0);
    const sessions = todaySessions.filter(session => session.completed).length;
    
    const subjectBreakdown = todaySessions.reduce((acc, session) => {
      acc[session.subject] = (acc[session.subject] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

    return { totalTime, sessions, subjectBreakdown };
  };

  const stats = getTodayStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estatísticas de Hoje</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center p-4 bg-study-secondary/20 rounded-lg border border-study-primary/20">
            <div className="text-3xl font-bold text-study-primary">
              {stats.totalTime}
            </div>
            <div className="text-sm text-muted-foreground">minutos estudados</div>
          </div>
          
          <div className="text-center p-4 bg-study-accent/20 rounded-lg border border-study-accent/20">
            <div className="text-3xl font-bold text-study-accent">
              {stats.sessions}
            </div>
            <div className="text-sm text-muted-foreground">sessões completas</div>
          </div>

          {Object.keys(stats.subjectBreakdown).length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Por Matéria:</h4>
              <div className="space-y-2">
                {Object.entries(stats.subjectBreakdown).map(([subject, minutes]) => (
                  <div key={subject} className="flex justify-between text-sm">
                    <span className="truncate">{subject}</span>
                    <span className="font-medium text-study-primary">{minutes}min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudyStatistics;
