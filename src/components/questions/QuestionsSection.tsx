import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, AlertTriangle, FileText, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Subject, Topic, Question } from '@/types/questions';

interface QuestionsSectionProps {
  subject: Subject;
  onAddQuestion: (topicId: string) => void;
  onViewQuestion?: (question: Question) => void;
  onEditQuestion?: (question: Question) => void;
  onDeleteQuestion?: (questionId: string) => void;
}

interface TopicCardProps {
  topic: Topic;
  subjectColor: string;
  onAddQuestion: (topicId: string) => void;
  onViewQuestion?: (question: Question) => void;
  onEditQuestion?: (question: Question) => void;
  onDeleteQuestion?: (questionId: string) => void;
}

interface QuestionItemProps {
  question: Question;
  onEdit?: (question: Question) => void;
  onDelete?: (questionId: string) => void;
  onView?: (question: Question) => void;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-study-success/10 text-study-success border-study-success/20';
    case 'medium':
      return 'bg-study-warning/10 text-study-warning border-study-warning/20';
    case 'hard':
      return 'bg-study-danger/10 text-study-danger border-study-danger/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'Fácil';
    case 'medium':
      return 'Médio';
    case 'hard':
      return 'Difícil';
    default:
      return difficulty;
  }
};

function QuestionItem({ question, onEdit, onDelete, onView }: QuestionItemProps) {
  return (
    <div className="p-4 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground">{question.title}</h4>
            <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
              {getDifficultyText(question.difficulty)}
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {question.content}
          </p>
          
          {question.tags && question.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {question.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Criada em {question.createdAt.toLocaleDateString('pt-BR')}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView?.(question)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit?.(question)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete?.(question.id)}
            className="h-8 w-8 p-0 text-study-danger hover:text-study-danger"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function TopicCard({ topic, subjectColor, onAddQuestion, onViewQuestion, onEditQuestion, onDeleteQuestion }: TopicCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={cn(
      "transition-all duration-200",
      topic.isEnemy ? "ring-2 ring-study-enemy/20 bg-study-enemy/5" : ""
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <CardTitle className="text-lg flex items-center gap-2">
                    {topic.name}
                    {topic.isEnemy && (
                      <Badge className="gap-1 bg-study-enemy text-study-enemy-foreground">
                        <AlertTriangle className="h-3 w-3" />
                        Inimigo
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getDifficultyColor(topic.difficulty || '')}>
                  {getDifficultyText(topic.difficulty || '')}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {topic.questions.length}
                </Badge>
              </div>
            </div>
            
            <CardDescription className="text-left">
              {topic.questions.length === 0 
                ? "Nenhuma questão adicionada ainda" 
                : `${topic.questions.length} questão${topic.questions.length > 1 ? 'ões' : ''} cadastrada${topic.questions.length > 1 ? 's' : ''}`
              }
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-foreground">Questões do tema</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddQuestion(topic.id)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Questão
                </Button>
              </div>
              
              {topic.questions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Nenhuma questão cadastrada para este tema
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddQuestion(topic.id)}
                    className="mt-2 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar primeira questão
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {topic.questions.map((question) => (
                    <QuestionItem key={question.id} question={question} onView={onViewQuestion} onEdit={onEditQuestion} onDelete={onDeleteQuestion} />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export function QuestionsSection({ subject, onAddQuestion, onViewQuestion, onEditQuestion, onDeleteQuestion }: QuestionsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const totalQuestions = subject.topics.reduce((acc, topic) => acc + topic.questions.length, 0);
  const enemyTopics = subject.topics.filter(topic => topic.isEnemy).length;

  return (
    <Card className="overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: subject.color }}
                />
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {subject.name}
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                  <CardDescription>{subject.description}</CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {enemyTopics > 0 && (
                  <Badge className="gap-1 bg-study-enemy text-study-enemy-foreground">
                    <AlertTriangle className="h-3 w-3" />
                    {enemyTopics} Inimigo{enemyTopics > 1 ? 's' : ''}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {totalQuestions} Questão{totalQuestions > 1 ? 'ões' : ''}
                </Badge>
                <Badge variant="outline">
                  {subject.topics.length} Tema{subject.topics.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {subject.topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  subjectColor={subject.color}
                  onAddQuestion={onAddQuestion}
                  onViewQuestion={onViewQuestion}
                  onEditQuestion={onEditQuestion}
                  onDeleteQuestion={onDeleteQuestion}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}