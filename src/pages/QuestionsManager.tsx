import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Filter, Target, AlertTriangle, BookOpen, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionsSection } from '@/components/questions/QuestionsSection';
import { AddQuestionModal } from '@/components/questions/AddQuestionModal';
import { Subject, Topic, Question } from '@/types/questions';
import { useStudyContext } from '@/contexts/StudyContext';
import { getQuestionsByTopic, deleteQuestion } from '@/db/crud/questions';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';


export default function QuestionsManager() {
  // Get subjects from StudyContext (the same ones used in planner)
  const { subjects: studySubjects } = useStudyContext();
  
  // Convert StudySubjects to Question subjects format and manage questions
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Initialize and update subjects when studySubjects change
  useEffect(() => {
    const loadQuestionsForSubjects = () => {
      const convertedSubjects = studySubjects.map(studySubject => ({
        id: studySubject.id,
        name: studySubject.name,
        description: `Tópicos de ${studySubject.name}`,
        color: studySubject.color || 'hsl(var(--study-primary))',
        topics: (studySubject.topics || []).map(topic => {
          // Load questions from database for each topic
          const questions = getQuestionsByTopic(topic.id);
          return {
            id: topic.id,
            name: topic.name,
            subjectId: studySubject.id,
            questions: questions.map(q => ({
              id: q.id,
              topicId: q.topicId,
              title: q.title,
              content: q.content,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: q.difficulty,
              tags: q.tags || [],
              createdAt: q.createdAt,
              updatedAt: q.updatedAt
            })),
            isEnemy: questions.length > 0, // Mark as enemy if has questions
            difficulty: 'medium' as const,
            priority: 1
          };
        })
      }));
      
      setSubjects(convertedSubjects);
    };

    loadQuestionsForSubjects();
  }, [studySubjects]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showEnemiesOnly, setShowEnemiesOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [viewedQuestion, setViewedQuestion] = useState<Question | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);

  const filteredSubjects = useMemo(() => {
    return subjects.filter(subject => {
      const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.topics.some(topic => topic.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSubject = selectedSubject === 'all' || subject.id === selectedSubject;
      
      return matchesSearch && matchesSubject;
    }).map(subject => ({
      ...subject,
      topics: subject.topics.filter(topic => {
        const matchesDifficulty = selectedDifficulty === 'all' || topic.difficulty === selectedDifficulty;
        const matchesEnemyFilter = !showEnemiesOnly || topic.isEnemy;
        
        return matchesDifficulty && matchesEnemyFilter;
      })
    })).filter(subject => subject.topics.length > 0);
  }, [subjects, searchTerm, selectedSubject, selectedDifficulty, showEnemiesOnly]);

  const stats = useMemo(() => {
    const totalTopics = subjects.reduce((acc, subject) => acc + subject.topics.length, 0);
    const totalEnemies = subjects.reduce((acc, subject) => 
      acc + subject.topics.filter(topic => topic.isEnemy).length, 0
    );
    const totalQuestions = subjects.reduce((acc, subject) => 
      acc + subject.topics.reduce((topicAcc, topic) => topicAcc + topic.questions.length, 0), 0
    );
    
    return { totalTopics, totalEnemies, totalQuestions };
  }, [subjects]);

  const handleAddQuestion = (topicId: string) => {
    const topic = subjects
      .flatMap(s => s.topics)
      .find(t => t.id === topicId);
    
    if (topic) {
      setSelectedTopic(topic);
      setIsAddModalOpen(true);
    }
  };

  const handleQuestionAdded = () => {
    // Reload questions from database when a new question is added
    const loadQuestionsForSubjects = () => {
      const convertedSubjects = studySubjects.map(studySubject => ({
        id: studySubject.id,
        name: studySubject.name,
        description: `Tópicos de ${studySubject.name}`,
        color: studySubject.color || 'hsl(var(--study-primary))',
        topics: (studySubject.topics || []).map(topic => {
          // Load questions from database for each topic
          const questions = getQuestionsByTopic(topic.id);
          return {
            id: topic.id,
            name: topic.name,
            subjectId: studySubject.id,
            questions: questions.map(q => ({
              id: q.id,
              topicId: q.topicId,
              title: q.title,
              content: q.content,
              options: q.options,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              difficulty: q.difficulty,
              tags: q.tags || [],
              createdAt: q.createdAt,
              updatedAt: q.updatedAt
            })),
            isEnemy: questions.length > 0, // Mark as enemy if has questions
            difficulty: 'medium' as const,
            priority: 1
          };
        })
      }));
      
      setSubjects(convertedSubjects);
    };

    loadQuestionsForSubjects();
  };

  const handleViewQuestion = (q: Question) => {
    setViewedQuestion(q);
    setIsViewOpen(true);
  };

  const handleDeleteQuestion = (id: string) => {
    const ok = deleteQuestion(id);
    if (ok) {
      toast({ title: 'Sucesso', description: 'Questão excluída com sucesso.' });
      handleQuestionAdded();
    } else {
      toast({ title: 'Erro', description: 'Não foi possível excluir a questão.', variant: 'destructive' });
    }
  };

  const handleEditQuestion = (q: Question) => {
    toast({ title: 'Em breve', description: 'Edição de questões será adicionada em breve.' });
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Target className="h-8 w-8 text-study-primary" />
                Gestão de Questões
              </h1>
              <p className="text-muted-foreground mt-1">
                Gerencie questões por tema e identifique seus inimigos
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Questão
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-study-primary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-study-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTopics}</p>
                    <p className="text-sm text-muted-foreground">Total de Temas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-study-danger/10 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-study-danger" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalEnemies}</p>
                    <p className="text-sm text-muted-foreground">Inimigos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-study-success/10 rounded-lg">
                    <FileText className="h-6 w-6 text-study-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.totalQuestions}</p>
                    <p className="text-sm text-muted-foreground">Total de Questões</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-study-accent/10 rounded-lg">
                    <Users className="h-6 w-6 text-study-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
                    <p className="text-sm text-muted-foreground">Matérias</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por matéria ou tema..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Selecionar matéria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as matérias</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showEnemiesOnly ? "default" : "outline"}
                  onClick={() => setShowEnemiesOnly(!showEnemiesOnly)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Só Inimigos
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          {filteredSubjects.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Nenhum resultado encontrado
                </h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou criar uma nova questão
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSubjects.map(subject => (
              <QuestionsSection
                key={subject.id}
                subject={subject}
                onAddQuestion={handleAddQuestion}
                onViewQuestion={handleViewQuestion}
                onEditQuestion={handleEditQuestion}
                onDeleteQuestion={handleDeleteQuestion}
              />
            ))
          )}
        </div>
      </div>

      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedTopic(null);
        }}
        topic={selectedTopic}
        subjects={subjects}
        onQuestionAdded={handleQuestionAdded}
      />
    </div>
  );
}