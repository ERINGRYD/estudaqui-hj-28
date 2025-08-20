import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, Target, Brain, TrendingUp, ArrowLeft, Play, Settings2 } from 'lucide-react';
import { StudySubject, StudyTopic, StudySubtopic } from '@/types/study';
import AddSubjectModal from './AddSubjectModal';
import AddTopicModal from './AddTopicModal';
import AddSubtopicModal from './AddSubtopicModal';
import TimeRedistributionModal from './TimeRedistributionModal';
import SubjectTopicManager from './SubjectTopicManager';
interface StudyPlanManagementButtonsProps {
  subjects: StudySubject[];
  onUpdateSubjects: (subjects: StudySubject[]) => void;
  totalWeeklyHours: number;
  onRedistributeTime: (subjects: StudySubject[]) => void;
  onBack?: () => void;
  onStartStudy?: () => void;
  examDate?: Date;
}
const StudyPlanManagementButtons = ({
  subjects,
  onUpdateSubjects,
  totalWeeklyHours,
  onRedistributeTime,
  onBack,
  onStartStudy,
  examDate
}: StudyPlanManagementButtonsProps) => {
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isSubtopicModalOpen, setIsSubtopicModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const handleAddSubject = (newSubject: StudySubject) => {
    onUpdateSubjects([...subjects, newSubject]);
  };
  const handleAddTopic = (subjectId: string, newTopic: StudyTopic) => {
    const updatedSubjects = subjects.map(subject => subject.id === subjectId ? {
      ...subject,
      topics: [...(subject.topics || []), newTopic]
    } : subject);
    onUpdateSubjects(updatedSubjects);
  };
  const handleAddSubtopic = (subjectId: string, topicId: string, newSubtopic: StudySubtopic) => {
    const updatedSubjects = subjects.map(subject => subject.id === subjectId ? {
      ...subject,
      topics: subject.topics?.map(topic => topic.id === topicId ? {
        ...topic,
        subtopics: [...(topic.subtopics || []), newSubtopic]
      } : topic) || []
    } : subject);
    onUpdateSubjects(updatedSubjects);
  };
  return <>
      <Card className="mb-6">
        
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
            {onBack && <Button onClick={onBack} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-dashed border-muted-foreground/50 text-muted-foreground hover:bg-muted/10">
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Voltar</span>
              </Button>}
            <Button onClick={() => setIsSubjectModalOpen(true)} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-dashed border-study-primary/50 text-study-primary hover:bg-study-primary/10">
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium">Matéria</span>
            </Button>

            <Button onClick={() => setIsTopicModalOpen(true)} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-dashed border-study-accent/50 text-study-accent hover:bg-study-accent/10" disabled={subjects.length === 0}>
              <Target className="h-5 w-5" />
              <span className="text-sm font-medium">Tópico</span>
            </Button>

            <Button onClick={() => setIsSubtopicModalOpen(true)} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-dashed border-study-success/50 text-study-success hover:bg-study-success/10" disabled={subjects.length === 0 || !subjects.some(s => s.topics && s.topics.length > 0)}>
              <Brain className="h-5 w-5" />
              <span className="text-sm font-medium">Subtópico</span>
            </Button>

            <Button onClick={() => setIsTimeModalOpen(true)} variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 border-dashed border-study-warning/50 text-study-warning hover:bg-study-warning/10" disabled={subjects.length === 0}>
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm font-medium">Redistribuir Tempo</span>
            </Button>

            <SubjectTopicManager 
              subjects={subjects}
              onUpdateSubjects={onUpdateSubjects}
              trigger={
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col items-center justify-center space-y-2 border-dashed border-study-info/50 text-study-info hover:bg-study-info/10"
                >
                  <Settings2 className="h-5 w-5" />
                  <span className="text-sm font-medium">Gerenciar Conteúdo</span>
                </Button>
              }
            />

            {onStartStudy && <Button onClick={onStartStudy} className="h-20 flex flex-col items-center justify-center space-y-2 bg-study-primary hover:bg-study-primary/90 text-study-primary-foreground">
                <Play className="h-5 w-5" />
                <span className="text-sm font-medium">Começar Estudo</span>
              </Button>}
          </div>
        </CardContent>
      </Card>

      <AddSubjectModal onAddSubject={handleAddSubject} isOpen={isSubjectModalOpen} onOpenChange={setIsSubjectModalOpen} />

      <AddTopicModal subjects={subjects} onAddTopic={handleAddTopic} isOpen={isTopicModalOpen} onOpenChange={setIsTopicModalOpen} />

      <AddSubtopicModal subjects={subjects} onAddSubtopic={handleAddSubtopic} isOpen={isSubtopicModalOpen} onOpenChange={setIsSubtopicModalOpen} />

      <TimeRedistributionModal subjects={subjects} onRedistribute={onRedistributeTime} isOpen={isTimeModalOpen} onOpenChange={setIsTimeModalOpen} totalWeeklyHours={totalWeeklyHours} examDate={examDate} />
    </>;
};
export default StudyPlanManagementButtons;