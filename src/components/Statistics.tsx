import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Clock, Calendar } from 'lucide-react';
import { StudySession, StudySubject } from '@/types/study';
import { differenceInDays, format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatisticsProps {
  studySessions: StudySession[];
  subjects: StudySubject[];
}

const Statistics: React.FC<StatisticsProps> = ({ studySessions, subjects }) => {
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87d068'];

  const getSubjectStatistics = () => {
    if (studySessions.length === 0) return [];
    
    const subjectData = studySessions.reduce((acc, session) => {
      const existing = acc.find(item => item.subject === session.subject);
      if (existing) {
        existing.time += session.duration;
        existing.sessions += 1;
        if (session.completed) existing.completedSessions += 1;
      } else {
        acc.push({
          subject: session.subject,
          time: session.duration,
          sessions: 1,
          completedSessions: session.completed ? 1 : 0
        });
      }
      return acc;
    }, [] as Array<{
      subject: string;
      time: number;
      sessions: number;
      completedSessions: number;
    }>);

    return subjectData.map(item => ({
      ...item,
      completionRate: item.sessions > 0 ? Math.round((item.completedSessions / item.sessions) * 100) : 0
    }));
  };

  const getWeeklyProgress = () => {
    if (studySessions.length === 0) return [];
    
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekData = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayStr = day.toDateString();
      const daySessions = studySessions.filter(session => 
        session.startTime.toDateString() === dayStr
      );
      
      const totalTime = daySessions.reduce((sum, session) => sum + session.duration, 0);
      const completedSessions = daySessions.filter(session => session.completed).length;
      
      weekData.push({
        day: format(day, 'EEE', { locale: ptBR }),
        time: totalTime,
        sessions: completedSessions,
        total: daySessions.length
      });
    }
    
    return weekData;
  };

  const getMonthlyTrends = () => {
    if (studySessions.length === 0) return [];
    
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      
      const daySessions = studySessions.filter(session => 
        session.startTime.toDateString() === dateStr
      );
      
      const totalTime = daySessions.reduce((sum, session) => sum + session.duration, 0);
      
      last30Days.push({
        date: format(date, 'dd/MM'),
        time: totalTime,
        sessions: daySessions.length
      });
    }
    
    return last30Days;
  };

  const getProductivityStats = () => {
    if (studySessions.length === 0) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        totalTime: 0,
        averageSessionTime: 0,
        completionRate: 0,
        mostProductiveDay: '',
        longestStreak: 0
      };
    }

    const totalSessions = studySessions.length;
    const completedSessions = studySessions.filter(session => session.completed).length;
    const totalTime = studySessions.reduce((sum, session) => sum + session.duration, 0);
    const averageSessionTime = totalSessions > 0 ? Math.round(totalTime / totalSessions) : 0;
    const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
    
    // Find most productive day
    const dayStats = studySessions.reduce((acc, session) => {
      const day = format(session.startTime, 'EEEE', { locale: ptBR });
      acc[day] = (acc[day] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);
    
    const mostProductiveDay = Object.keys(dayStats).length > 0 
      ? Object.entries(dayStats).reduce((a, b) => dayStats[a[0]] > dayStats[b[0]] ? a : b)[0]
      : '';

    return {
      totalSessions,
      completedSessions,
      totalTime,
      averageSessionTime,
      completionRate,
      mostProductiveDay,
      longestStreak: 0 // Could implement streak calculation
    };
  };

  const subjectStats = getSubjectStatistics();
  const weeklyData = getWeeklyProgress();
  const monthlyData = getMonthlyTrends();
  const productivityStats = getProductivityStats();

  const pieChartData = subjectStats.map((item, index) => ({
    name: item.subject,
    value: item.time,
    color: COLORS[index % COLORS.length]
  }));

  if (studySessions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                Nenhuma estatística disponível
              </h3>
              <p className="text-muted-foreground">
                Comece a estudar para ver suas estatísticas e progresso
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Productivity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-study-primary" />
              <div className="text-2xl font-bold text-study-primary">{productivityStats.totalTime}</div>
            </div>
            <p className="text-xs text-muted-foreground">minutos totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-study-success" />
              <div className="text-2xl font-bold text-study-success">{productivityStats.completionRate}%</div>
            </div>
            <p className="text-xs text-muted-foreground">taxa de conclusão</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-study-accent" />
              <div className="text-2xl font-bold text-study-accent">{productivityStats.averageSessionTime}</div>
            </div>
            <p className="text-xs text-muted-foreground">min por sessão</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-study-warning" />
              <div className="text-2xl font-bold text-study-warning">{productivityStats.totalSessions}</div>
            </div>
            <p className="text-xs text-muted-foreground">sessões totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5 text-study-primary" />
              <span>Distribuição por Matéria</span>
            </CardTitle>
            <CardDescription>Tempo total dedicado a cada matéria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}min`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} min`, 'Tempo']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Progress Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-study-accent" />
              <span>Progresso Semanal</span>
            </CardTitle>
            <CardDescription>Tempo de estudo por dia da semana</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} min`, 'Tempo']} />
                  <Bar dataKey="time" fill="hsl(var(--study-primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-study-success" />
            <span>Tendência Mensal</span>
          </CardTitle>
          <CardDescription>Progresso diário nos últimos 30 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} min`, 'Tempo']} />
                <Line 
                  type="monotone" 
                  dataKey="time" 
                  stroke="hsl(var(--study-accent))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--study-accent))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Desempenho por Matéria</CardTitle>
          <CardDescription>Estatísticas detalhadas de cada matéria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subjectStats.map((stat, index) => (
              <div key={stat.subject} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">{stat.subject}</h4>
                  <Badge variant="outline" className="bg-study-primary/10 text-study-primary border-study-primary/30">
                    {stat.time} min
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sessões</span>
                    <div className="font-medium">{stat.sessions}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Completas</span>
                    <div className="font-medium text-study-success">{stat.completedSessions}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Taxa de Conclusão</span>
                    <div className="font-medium">{stat.completionRate}%</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <Progress value={stat.completionRate} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights de Produtividade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-study-primary/10 rounded-lg border border-study-primary/20">
              <h4 className="font-medium text-study-primary mb-2">Dia Mais Produtivo</h4>
              <p className="text-lg font-bold">{productivityStats.mostProductiveDay || 'N/A'}</p>
            </div>
            
            <div className="p-4 bg-study-success/10 rounded-lg border border-study-success/20">
              <h4 className="font-medium text-study-success mb-2">Média de Sessão</h4>
              <p className="text-lg font-bold">{productivityStats.averageSessionTime} min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Statistics;