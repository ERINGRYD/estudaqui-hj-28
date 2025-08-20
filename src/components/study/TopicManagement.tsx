
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, ChevronDown, ChevronRight, Trash2, BookOpen } from 'lucide-react';
import { StudySubject, StudyTopic, StudySubtopic } from '@/types/study';

interface TopicManagementProps {
  subjects: StudySubject[];
  setSubjects: (subjects: StudySubject[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const TopicManagement = ({ subjects, setSubjects, onNext, onBack }: TopicManagementProps) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [newTopicName, setNewTopicName] = useState('');
  const [newSubtopicName, setNewSubtopicName] = useState('');
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const addTopic = (subjectId: string) => {
    if (newTopicName.trim()) {
      const newTopic: StudyTopic = {
        id: Date.now().toString(),
        name: newTopicName.trim(),
        subjectId,
        subtopics: [],
        weight: 1
      };

      setSubjects(
        subjects.map(subject =>
          subject.id === subjectId
            ? { ...subject, topics: [...(subject.topics || []), newTopic] }
            : subject
        )
      );
      setNewTopicName('');
      setActiveSubject(null);
    }
  };

  const addSubtopic = (subjectId: string, topicId: string) => {
    if (newSubtopicName.trim()) {
      const newSubtopic: StudySubtopic = {
        id: Date.now().toString(),
        name: newSubtopicName.trim(),
        topicId,
        weight: 1
      };

      setSubjects(
        subjects.map(subject =>
          subject.id === subjectId
            ? {
                ...subject,
                topics: subject.topics?.map(topic =>
                  topic.id === topicId
                    ? { ...topic, subtopics: [...(topic.subtopics || []), newSubtopic] }
                    : topic
                ) || []
              }
            : subject
        )
      );
      setNewSubtopicName('');
      setActiveTopic(null);
    }
  };

  const removeTopic = (subjectId: string, topicId: string) => {
    setSubjects(
      subjects.map(subject =>
        subject.id === subjectId
          ? { ...subject, topics: subject.topics?.filter(t => t.id !== topicId) || [] }
          : subject
      )
    );
  };

  const removeSubtopic = (subjectId: string, topicId: string, subtopicId: string) => {
    setSubjects(
      subjects.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: subject.topics?.map(topic =>
                topic.id === topicId
                  ? { ...topic, subtopics: topic.subtopics?.filter(st => st.id !== subtopicId) || [] }
                  : topic
              ) || []
            }
          : subject
      )
    );
  };

  const hasContent = subjects.some(subject => 
    (subject.topics && subject.topics.length > 0)
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-study-primary" />
          <span>Organizar Tópicos e Subtópicos</span>
        </CardTitle>
        <CardDescription>
          Opcional: Organize suas matérias em tópicos específicos para um estudo mais direcionado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.map(subject => (
          <Card key={subject.id} className="border border-study-primary/20">
            <Collapsible 
              open={expandedSubjects.has(subject.id)}
              onOpenChange={() => toggleSubject(subject.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-study-info/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-study-primary">{subject.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {subject.topics?.length || 0} tópicos
                      </Badge>
                      {expandedSubjects.has(subject.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent>
                  {/* Add topic */}
                  <div className="mb-4">
                    {activeSubject === subject.id ? (
                      <div className="flex space-x-2">
                        <Input
                          value={newTopicName}
                          onChange={(e) => setNewTopicName(e.target.value)}
                          placeholder="Nome do tópico..."
                          onKeyPress={(e) => e.key === 'Enter' && addTopic(subject.id)}
                          autoFocus
                        />
                        <Button 
                          onClick={() => addTopic(subject.id)}
                          disabled={!newTopicName.trim()}
                          size="sm"
                          className="bg-study-primary hover:bg-study-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button 
                          onClick={() => {
                            setActiveSubject(null);
                            setNewTopicName('');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setActiveSubject(subject.id)}
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed border-study-primary/50 text-study-primary hover:bg-study-primary/10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Tópico
                      </Button>
                    )}
                  </div>

                  {/* Topics list */}
                  <div className="space-y-3">
                    {subject.topics?.map(topic => (
                      <div key={topic.id} className="pl-4 border-l-2 border-study-primary/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-study-primary">{topic.name}</span>
                          <Button
                            onClick={() => removeTopic(subject.id, topic.id)}
                            variant="ghost"
                            size="sm"
                            className="text-study-danger hover:text-study-danger hover:bg-study-danger/10"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Add subtopic */}
                        <div className="mb-2">
                          {activeTopic === topic.id ? (
                            <div className="flex space-x-2">
                              <Input
                                value={newSubtopicName}
                                onChange={(e) => setNewSubtopicName(e.target.value)}
                                placeholder="Nome do subtópico..."
                                onKeyPress={(e) => e.key === 'Enter' && addSubtopic(subject.id, topic.id)}
                                className="text-sm"
                                autoFocus
                              />
                              <Button 
                                onClick={() => addSubtopic(subject.id, topic.id)}
                                disabled={!newSubtopicName.trim()}
                                size="sm"
                                className="bg-study-accent hover:bg-study-accent/90"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button 
                                onClick={() => {
                                  setActiveTopic(null);
                                  setNewSubtopicName('');
                                }}
                                variant="outline"
                                size="sm"
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setActiveTopic(topic.id)}
                              variant="ghost"
                              size="sm"
                              className="text-xs text-study-accent hover:text-study-accent hover:bg-study-accent/10"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Subtópico
                            </Button>
                          )}
                        </div>

                        {/* Subtopics list */}
                        {topic.subtopics && topic.subtopics.length > 0 && (
                          <div className="space-y-1 pl-4">
                            {topic.subtopics.map(subtopic => (
                              <div key={subtopic.id} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">• {subtopic.name}</span>
                                <Button
                                  onClick={() => removeSubtopic(subject.id, topic.id, subtopic.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-study-danger hover:text-study-danger hover:bg-study-danger/10"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          
          <Button 
            onClick={onNext}
            className="bg-study-primary hover:bg-study-primary/90"
          >
            {hasContent ? 'Próximo: Avaliar Conhecimentos' : 'Pular: Avaliar Conhecimentos'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicManagement;
