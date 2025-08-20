import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MultiProgress } from '@/components/ui/multi-progress';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Settings, Clock, Cog, Save, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StudyPlan, StudySession, StudySubject, ExamType } from '@/types/study';
import PlanAdjustmentModal from './PlanAdjustmentModal';
import StudyPlanHeader from './StudyPlanHeader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { saveStudyPlan, getSavedPlans, loadStudyPlan } from '@/utils/studyPlanPersistence';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CycleConfig {
  forceAllSubjects: boolean;
  subjectsPerCycle: number;
  rotationIntensity: number;
  focusMode: 'balanced' | 'priority' | 'difficulty';
  avoidConsecutive: boolean;
}

interface StudyPlanDisplayProps {
  studyPlan: StudyPlan;
  subjectLevels: Record<string, string>;
  studySessions?: StudySession[];
  onBack: () => void;
  onStartTimer: (subject: string, topic?: string, subtopic?: string, taskId?: string) => void;
  onUpdatePlan?: (updatedPlan: StudyPlan) => void;
  onRegenerateCycle?: (config: CycleConfig) => void;
  examDate?: Date;
  selectedExam: string;
  examTypes: ExamType[];
  managementButtons?: React.ReactNode;
}

const StudyPlanDisplay: React.FC<StudyPlanDisplayProps> = ({
  studyPlan,
  subjectLevels,
  studySessions = [],
  onBack,
  onStartTimer,
  onUpdatePlan = () => {},
  onRegenerateCycle,
  examDate,
  selectedExam,
  examTypes,
  managementButtons
}) => {
  const navigate = useNavigate();
  const [savePlanName, setSavePlanName] = React.useState('');
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [showManageDialog, setShowManageDialog] = React.useState(false);
  const [savedPlans, setSavedPlans] = React.useState(getSavedPlans());
  const [topicsExpanded, setTopicsExpanded] = React.useState(true);
  const [subjectExpanded, setSubjectExpanded] = React.useState<Record<string, boolean>>({});
  const [topicExpanded, setTopicExpanded] = React.useState<Record<string, boolean>>({});
  
  // Weekly targets and cycle progress
  const cycleStart = studyPlan.cycleStart ? new Date(studyPlan.cycleStart as any) : undefined;
  const weeklyMinutes = (studyPlan.weeklyHourLimit || 0) * 60;
  const sumWeights = (studyPlan.subjects?.reduce((sum, s) => sum + (s.weight ?? 0), 0)) || 0;
  const dataMap = new Map((studyPlan.data || []).map((d: any) => [d.name, d]));
  
  // Calculate total hours from data for schedule-type plans
  const totalHoursFromData = (studyPlan.data || []).reduce((sum: number, d: any) => {
    return sum + (typeof d.hours === 'number' ? d.hours : 0);
  }, 0);

  const getSubjectShare = (s: StudySubject) => {
    // Priority 1: For cycle plans, use percentages from data
    if (studyPlan.type === 'cycle') {
      const d = dataMap.get(s.name);
      if (d && typeof (d as any).percentage === 'number') {
        return (d as any).percentage / 100;
      }
    }
    
    // Priority 2: For schedule plans, use hours from data
    if (studyPlan.type === 'schedule' && totalHoursFromData > 0) {
      const d = dataMap.get(s.name);
      if (d && typeof (d as any).hours === 'number') {
        return (d as any).hours / totalHoursFromData;
      }
    }
    
    // Priority 3: Use weights if available and sum > 0
    if (sumWeights > 0) {
      return (s.weight ?? 0) / sumWeights;
    }
    
    // Fallback: Equal distribution
    return studyPlan.subjects && studyPlan.subjects.length > 0 ? 1 / studyPlan.subjects.length : 0;
  };

  // Proportional rounding using Hamilton method for integer minutes
  const getDistributedMinutes = () => {
    if (!studyPlan.subjects || weeklyMinutes <= 0) return new Map();
    
    const shares = studyPlan.subjects.map(s => ({ subject: s, share: getSubjectShare(s) }));
    const exactMinutes = shares.map(s => s.share * weeklyMinutes);
    const integerMinutes = exactMinutes.map(m => Math.floor(m));
    const remainders = exactMinutes.map((m, i) => ({ index: i, remainder: m - integerMinutes[i] }));
    
    // Distribute remaining minutes by largest remainder
    const totalAssigned = integerMinutes.reduce((sum, m) => sum + m, 0);
    const remaining = weeklyMinutes - totalAssigned;
    
    remainders.sort((a, b) => b.remainder - a.remainder);
    for (let i = 0; i < remaining && i < remainders.length; i++) {
      if (remainders[i]) {
        integerMinutes[remainders[i].index]++;
      }
    }
    
    const result = new Map();
    shares.forEach((s, i) => {
      result.set(s.subject.name, integerMinutes[i]);
    });
    
    return result;
  };

  const distributedMinutes = getDistributedMinutes();
  const getSubjectTargetMinutes = (subj: StudySubject) => distributedMinutes.get(subj.name) || 0;
  
  // Format time with exact precision for display
  const formatExactTime = (minutes: number): string => {
    if (minutes === 0) return '0min';
    
    const totalSeconds = Math.round(minutes * 60);
    const wholeMinutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (seconds === 0) {
      return `${wholeMinutes}min`;
    }
    
    return `${wholeMinutes}m${seconds.toString().padStart(2, '0')}s`;
  };

  const getStudiedMinutesSinceCycleStart = (subjectName: string) => {
    const sessions = studySessions.filter(s => s.subject === subjectName && (!cycleStart || new Date(s.startTime) >= cycleStart));
    return sessions.reduce((t, s) => t + s.duration, 0);
  };
  
  const isCycleComplete = weeklyMinutes > 0 && (studyPlan.subjects?.every(subj => {
    const target = getSubjectTargetMinutes(subj);
    if (target <= 0) return true;
    const studied = getStudiedMinutesSinceCycleStart(subj.name);
    return studied >= target - 1;
  }) ?? false);

  const handleRestartCycle = () => {
    onUpdatePlan({ ...studyPlan, cycleStart: new Date() });
  };

  // Function to calculate subject progress
  const getSubjectProgress = (subject: StudySubject) => {
    if (!subject.topics || subject.topics.length === 0) return 0;
    const completedTopics = subject.topics.filter(t => t.completed).length;
    return completedTopics / subject.topics.length * 100;
  };

  // Handle start study - simplified without task management
  const handleStartStudy = () => {
    navigate('/study-session');
  };

  // Handle save plan
  const handleSavePlan = () => {
    if (!savePlanName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um nome para o plano.",
        variant: "destructive"
      });
      return;
    }
    const planId = saveStudyPlan(studyPlan, savePlanName.trim());
    if (planId) {
      toast({
        title: "Sucesso",
        description: `Plano "${savePlanName}" salvo com sucesso!`
      });
      setSavePlanName('');
      setShowSaveDialog(false);
      setSavedPlans(getSavedPlans());
    } else {
      toast({
        title: "Erro",
        description: "Falha ao salvar o plano.",
        variant: "destructive"
      });
    }
  };

  // Handle load plan
  const handleLoadPlan = (planId: string) => {
    const plan = loadStudyPlan(planId);
    if (plan) {
      onUpdatePlan?.(plan);
      toast({
        title: "Sucesso",
        description: "Plano carregado com sucesso!"
      });
      setShowManageDialog(false);
      setSavedPlans(getSavedPlans());
    } else {
      toast({
        title: "Erro",
        description: "Falha ao carregar o plano.",
        variant: "destructive"
      });
    }
  };

  // Function to get total time studied for subject
  const getSubjectTime = (subjectName: string) => {
    const subjectSessions = studySessions.filter(session => session.subject === subjectName);
    return subjectSessions.reduce((total, session) => total + session.duration, 0);
  };

  // Function to get time studied for specific topic
  const getTopicTime = (subjectName: string, topicName: string) => {
    const topicSessions = studySessions.filter(session => 
      session.subject === subjectName && session.topic === topicName
    );
    return topicSessions.reduce((total, session) => total + session.duration, 0);
  };

  // Function to get time studied for specific subtopic
  const getSubtopicTime = (subjectName: string, topicName: string, subtopicName: string) => {
    const subtopicSessions = studySessions.filter(session => 
      session.subject === subjectName && 
      session.topic === topicName && 
      session.subtopic === subtopicName
    );
    return subtopicSessions.reduce((total, session) => total + session.duration, 0);
  };

  // Format time in minutes/hours - always return a value for zero
  const formatStudiedTime = (minutes: number) => {
    if (minutes === 0) return '0min';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Handle topic completion
  const handleTopicCompletion = (subjectId: string, topicId: string, completed: boolean) => {
    const updatedPlan = {
      ...studyPlan,
      subjects: studyPlan.subjects.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: subject.topics?.map(topic =>
                topic.id === topicId
                  ? { ...topic, completed }
                  : topic
              )
            }
          : subject
      )
    };
    onUpdatePlan(updatedPlan);
  };

  // Handle subtopic completion
  const handleSubtopicCompletion = (subjectId: string, topicId: string, subtopicId: string, completed: boolean) => {
    const updatedPlan = {
      ...studyPlan,
      subjects: studyPlan.subjects.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: subject.topics?.map(topic =>
                topic.id === topicId
                  ? {
                      ...topic,
                      subtopics: topic.subtopics?.map(subtopic =>
                        subtopic.id === subtopicId
                          ? { ...subtopic, completed }
                          : subtopic
                      )
                    }
                  : topic
              )
            }
          : subject
      )
    };
    onUpdatePlan(updatedPlan);
  };

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <StudyPlanHeader studyPlan={studyPlan} examDate={examDate} selectedExam={selectedExam} examTypes={examTypes} subjectLevels={subjectLevels} />

      {/* Management Buttons - Above Start Button */}
      {managementButtons && managementButtons}

      {isCycleComplete && (
        <Alert>
          <AlertTitle>Ciclo concluído</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            Todas as metas semanais foram atingidas.
            <Button size="sm" variant="secondary" onClick={handleRestartCycle}>
              Reiniciar ciclo
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <Card>
        
      </Card>

      {/* Plan Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={studyPlan.data} cx="50%" cy="50%" labelLine={false} label={({
                  name,
                  percentage
                }) => `${name}: ${percentage}%`} outerRadius={80} fill="#8884d8" dataKey={studyPlan.type === 'cycle' ? 'percentage' : 'hours'}>
                    {studyPlan.data?.map((entry: any, index: number) => <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Subject Progress Cards */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Progresso por Matéria</CardTitle>
                <CardDescription>Marque os tópicos estudados para acompanhar seu progresso</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTopicsExpanded(!topicsExpanded)}
                className="flex items-center space-x-2"
              >
                {topicsExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span>Recolher Tópicos</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span>Expandir Tópicos</span>
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {studyPlan.subjects?.map(subject => {
                const targetMinutes = getSubjectTargetMinutes(subject);
                const studiedMinutes = getStudiedMinutesSinceCycleStart(subject.name);
                const subjectShare = getSubjectShare(subject);
                const subjectPercentage = Math.round(subjectShare * 100);
                const exactTargetMinutes = weeklyMinutes * subjectShare;
                
                return (
                  <Card key={subject.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSubjectExpanded(prev => ({
                            ...prev,
                            [subject.id]: !prev[subject.id]
                          }))}
                          className="p-1"
                        >
                          {subjectExpanded[subject.id] ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="w-4 h-4 rounded-full" style={{
                          backgroundColor: subject.color
                        }} />
                        <h3 className="font-medium">{subject.name}</h3>
                        <div className="text-sm text-muted-foreground">
                          {formatStudiedTime(getSubjectTime(subject.name))}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {Math.round(getSubjectProgress(subject))}% concluído
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <MultiProgress 
                        timeValue={(() => {
                          const target = getSubjectTargetMinutes(subject);
                          const studied = getStudiedMinutesSinceCycleStart(subject.name);
                          return target > 0 ? Math.min(100, Math.round((studied / target) * 100)) : 0;
                        })()} 
                        topicValue={getSubjectProgress(subject)}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>Tópicos: {subject.topics?.filter(t => t.completed).length || 0} de {subject.topics?.length || 0}</span>
                      {weeklyMinutes > 0 ? (
                        <div className="flex items-center space-x-2">
                          <span>Meta individual: {formatExactTime(exactTargetMinutes)} ({subjectPercentage}%)</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Como calculamos: {formatStudiedTime(weeklyMinutes)} × {subjectPercentage}% = {formatExactTime(exactTargetMinutes)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <span>Sem meta semanal definida</span>
                      )}
                    </div>
                    {weeklyMinutes > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span></span>
                        <span>Estudado no ciclo: {formatStudiedTime(studiedMinutes)}</span>
                      </div>
                    )}
                    
                    {/* Topics List */}
                    {topicsExpanded && subjectExpanded[subject.id] !== false && subject.topics && subject.topics.length > 0 && (
                      <div className="space-y-2 pl-2">
                        {subject.topics.map(topic => (
                          <div key={topic.id} className="space-y-1">
                            <div className="flex items-center space-x-2">
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setTopicExpanded(prev => ({
                                    ...prev,
                                    [topic.id]: !prev[topic.id]
                                  }))}
                                  className="p-1"
                                >
                                  {topicExpanded[topic.id] ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                              <Checkbox
                                checked={topic.completed || false}
                                onCheckedChange={(checked) => 
                                  handleTopicCompletion(subject.id, topic.id, !!checked)
                                }
                              />
                              <span className={`text-sm ${topic.completed ? 'line-through text-muted-foreground' : ''}`}>
                                {topic.name}
                              </span>
                              <div className="text-xs text-muted-foreground ml-2">
                                {formatStudiedTime(getTopicTime(subject.name, topic.name))}
                              </div>
                              {topic.completed && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            
                            {/* Subtopics */}
                            {topicExpanded[topic.id] !== false && topic.subtopics && topic.subtopics.length > 0 && (
                              <div className="ml-6 space-y-1">
                                {topic.subtopics.map(subtopic => (
                                  <div key={subtopic.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={subtopic.completed || false}
                                      onCheckedChange={(checked) => 
                                        handleSubtopicCompletion(subject.id, topic.id, subtopic.id, !!checked)
                                      }
                                    />
                                    <span className={`text-xs ${subtopic.completed ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                                      • {subtopic.name}
                                    </span>
                                    <div className="text-xs text-muted-foreground ml-2">
                                      {formatStudiedTime(getSubtopicTime(subject.name, topic.name, subtopic.name))}
                                    </div>
                                    {subtopic.completed && (
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              }) || []}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Content - Simplified */}
    </div>
  );
};

export default StudyPlanDisplay;
