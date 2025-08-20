
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronDown, ChevronRight, Trash2, BookOpen, Target, Brain, CheckCircle2 } from 'lucide-react';
import { StudySubject, StudyTopic, StudySubtopic } from '@/types/study';

interface AdvancedTopicManagementProps {
  subjects: StudySubject[];
  setSubjects: (subjects: StudySubject[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const AdvancedTopicManagement = ({ subjects, setSubjects, onNext, onBack }: AdvancedTopicManagementProps) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('organize');
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

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const addTopic = (subjectId: string) => {
    if (newTopicName.trim()) {
      const newTopic: StudyTopic = {
        id: Date.now().toString(),
        name: newTopicName.trim(),
        subjectId,
        subtopics: [],
        weight: 1,
        completed: false,
        totalTime: 0
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
        weight: 1,
        completed: false,
        totalTime: 0
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

  const updateTopicWeight = (subjectId: string, topicId: string, weight: number) => {
    setSubjects(
      subjects.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: subject.topics?.map(topic =>
                topic.id === topicId ? { ...topic, weight } : topic
              ) || []
            }
          : subject
      )
    );
  };

  const getSubjectProgress = (subject: StudySubject) => {
    if (!subject.topics || subject.topics.length === 0) return 0;
    const completedTopics = subject.topics.filter(t => t.completed).length;
    return (completedTopics / subject.topics.length) * 100;
  };

  const getTopicProgress = (topic: StudyTopic) => {
    if (!topic.subtopics || topic.subtopics.length === 0) return 0;
    const completedSubtopics = topic.subtopics.filter(st => st.completed).length;
    return (completedSubtopics / topic.subtopics.length) * 100;
  };

  const generateSuggestedTopics = (subjectName: string): string[] => {
    const topicSuggestions: Record<string, string[]> = {
      'Matemática': [
        'Álgebra', 'Geometria', 'Trigonometria', 'Estatística', 'Probabilidade',
        'Funções', 'Equações', 'Logaritmos', 'Matrizes', 'Análise Combinatória'
      ],
      'Português': [
        'Gramática', 'Literatura', 'Redação', 'Interpretação de Texto', 'Ortografia',
        'Sintaxe', 'Morfologia', 'Semântica', 'Estilística', 'Figuras de Linguagem'
      ],
      'História': [
        'História do Brasil', 'História Geral', 'Idade Média', 'Idade Moderna',
        'Idade Contemporânea', 'República', 'Império', 'Colonial', 'Revolução Industrial'
      ],
      'Direito Constitucional': [
        'Princípios Constitucionais', 'Direitos Fundamentais', 'Organização do Estado',
        'Poderes', 'Controle de Constitucionalidade', 'Processo Legislativo'
      ]
    };

    return topicSuggestions[subjectName] || [
      'Conceitos Básicos', 'Teoria Avançada', 'Exercícios Práticos', 'Revisão Geral'
    ];
  };

  const generateSuggestedSubtopics = (topicName: string, subjectName: string): string[] => {
    const subtopicSuggestions: Record<string, Record<string, string[]>> = {
      'Matemática': {
        'Álgebra': ['Equações do 1º grau', 'Equações do 2º grau', 'Sistemas lineares', 'Inequações', 'Expressões algébricas'],
        'Geometria': ['Figuras planas', 'Áreas e perímetros', 'Teorema de Pitágoras', 'Geometria espacial', 'Volumes'],
        'Trigonometria': ['Funções trigonométricas', 'Identidades trigonométricas', 'Lei dos senos', 'Lei dos cossenos'],
        'Estatística': ['Medidas de tendência central', 'Medidas de dispersão', 'Distribuição normal', 'Correlação'],
        'Funções': ['Função afim', 'Função quadrática', 'Função exponencial', 'Função logarítmica'],
        'Equações': ['Equações lineares', 'Equações quadráticas', 'Equações exponenciais', 'Sistemas de equações']
      },
      'Português': {
        'Gramática': ['Classes de palavras', 'Sintaxe', 'Concordância', 'Regência', 'Crase'],
        'Literatura': ['Barroco', 'Romantismo', 'Realismo', 'Modernismo', 'Literatura contemporânea'],
        'Redação': ['Dissertação argumentativa', 'Estrutura textual', 'Coesão e coerência', 'Tipos de argumento'],
        'Interpretação de Texto': ['Identificação de ideias', 'Inferências', 'Figuras de linguagem', 'Intertextualidade'],
        'Sintaxe': ['Período simples', 'Período composto', 'Orações subordinadas', 'Orações coordenadas']
      },
      'História': {
        'História do Brasil': ['Brasil Colônia', 'Brasil Império', 'Brasil República', 'Era Vargas', 'Ditadura Militar'],
        'História Geral': ['Antiguidade', 'Idade Média', 'Idade Moderna', 'Idade Contemporânea'],
        'República': ['Primeira República', 'Era Vargas', 'República Liberal', 'Ditadura Militar', 'Nova República'],
        'Revolução Industrial': ['Primeira Revolução', 'Segunda Revolução', 'Consequências sociais', 'Movimento operário']
      },
      'Direito Constitucional': {
        'Princípios Constitucionais': ['Supremacia da Constituição', 'Legalidade', 'Isonomia', 'Proporcionalidade'],
        'Direitos Fundamentais': ['Direitos individuais', 'Direitos sociais', 'Direitos políticos', 'Garantias constitucionais'],
        'Organização do Estado': ['Federalismo', 'União', 'Estados', 'Municípios', 'Distrito Federal'],
        'Poderes': ['Poder Executivo', 'Poder Legislativo', 'Poder Judiciário', 'Funções essenciais'],
        'Controle de Constitucionalidade': ['Controle difuso', 'Controle concentrado', 'ADI', 'ADPF']
      }
    };

    const subjectSuggestions = subtopicSuggestions[subjectName];
    if (subjectSuggestions && subjectSuggestions[topicName]) {
      return subjectSuggestions[topicName];
    }

    // Sugestões genéricas baseadas no tópico
    return [
      'Conceitos fundamentais',
      'Teoria básica',
      'Exercícios práticos',
      'Aplicações',
      'Revisão'
    ];
  };

  const addSuggestedTopics = (subject: StudySubject) => {
    const suggested = generateSuggestedTopics(subject.name);
    const newTopics = suggested.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name,
      subjectId: subject.id,
      subtopics: [],
      weight: 1,
      completed: false,
      totalTime: 0
    }));

    setSubjects(
      subjects.map(s =>
        s.id === subject.id
          ? { ...s, topics: [...(s.topics || []), ...newTopics] }
          : s
      )
    );
  };

  const addSuggestedSubtopics = (subject: StudySubject, topic: StudyTopic) => {
    const suggested = generateSuggestedSubtopics(topic.name, subject.name);
    const existingSubtopics = topic.subtopics || [];
    const existingNames = new Set(existingSubtopics.map(st => st.name.toLowerCase()));
    
    // Filtra sugestões para evitar duplicatas
    const filteredSuggestions = suggested.filter(name => 
      !existingNames.has(name.toLowerCase())
    );
    
    const newSubtopics = filteredSuggestions.map((name, index) => ({
      id: `${Date.now()}-${index}`,
      name,
      topicId: topic.id,
      weight: 1,
      completed: false,
      totalTime: 0
    }));

    setSubjects(
      subjects.map(s =>
        s.id === subject.id
          ? {
              ...s,
              topics: s.topics?.map(t =>
                t.id === topic.id
                  ? { ...t, subtopics: [...existingSubtopics, ...newSubtopics] }
                  : t
              ) || []
            }
          : s
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
          <Brain className="h-5 w-5 text-study-primary" />
          <span>Organizar Tópicos e Subtópicos</span>
        </CardTitle>
        <CardDescription>
          Organize suas matérias em tópicos específicos para um estudo mais direcionado e acompanhe seu progresso
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="organize">Organizar</TabsTrigger>
            <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
          </TabsList>

          <TabsContent value="organize" className="space-y-4">
            {subjects.map(subject => (
              <Card key={subject.id} className="border border-study-primary/20">
                <Collapsible 
                  open={expandedSubjects.has(subject.id)}
                  onOpenChange={() => toggleSubject(subject.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-study-info/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          <CardTitle className="text-lg text-study-primary">{subject.name}</CardTitle>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">
                            {subject.topics?.length || 0} tópicos
                          </Badge>
                          <Progress 
                            value={getSubjectProgress(subject)} 
                            className="w-16 h-2"
                          />
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
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => setActiveSubject(subject.id)}
                              variant="outline"
                              size="sm"
                              className="border-dashed border-study-primary/50 text-study-primary hover:bg-study-primary/10"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Tópico
                            </Button>
                            <Button
                              onClick={() => addSuggestedTopics(subject)}
                              variant="outline"
                              size="sm"
                              className="text-study-accent hover:bg-study-accent/10"
                            >
                              <Target className="h-4 w-4 mr-2" />
                              Sugestões
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Topics list */}
                      <div className="space-y-3">
                        {subject.topics?.map(topic => (
                          <Card key={topic.id} className="border-l-4 border-l-study-primary/50">
                            <Collapsible
                              open={expandedTopics.has(topic.id)}
                              onOpenChange={() => toggleTopic(topic.id)}
                            >
                              <CollapsibleTrigger asChild>
                                <CardHeader className="pb-2 cursor-pointer hover:bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="font-medium text-study-primary">{topic.name}</span>
                                      {topic.completed && (
                                        <CheckCircle2 className="h-4 w-4 text-study-success" />
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs">
                                        {topic.subtopics?.length || 0} subtópicos
                                      </Badge>
                                      <Progress 
                                        value={getTopicProgress(topic)} 
                                        className="w-12 h-2"
                                      />
                                      {expandedTopics.has(topic.id) ? (
                                        <ChevronDown className="h-3 w-3" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3" />
                                      )}
                                      <Button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeTopic(subject.id, topic.id);
                                        }}
                                        variant="ghost"
                                        size="sm"
                                        className="text-study-danger hover:text-study-danger hover:bg-study-danger/10"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <CardContent className="pt-0">
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-4">
                                      <Label className="text-sm">Peso:</Label>
                                      <Select
                                        value={topic.weight?.toString() || '1'}
                                        onValueChange={(value) => updateTopicWeight(subject.id, topic.id, parseInt(value))}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1">Baixo</SelectItem>
                                          <SelectItem value="2">Médio</SelectItem>
                                          <SelectItem value="3">Alto</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {/* Add subtopic */}
                                    <div>
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
                                        <div className="flex space-x-2">
                                          <Button
                                            onClick={() => setActiveTopic(topic.id)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-study-accent hover:text-study-accent hover:bg-study-accent/10"
                                          >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Adicionar Subtópico
                                          </Button>
                                          <Button
                                            onClick={() => addSuggestedSubtopics(subject, topic)}
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-study-warning hover:bg-study-warning/10"
                                          >
                                            <Target className="h-3 w-3 mr-1" />
                                            Sugestões
                                          </Button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Subtopics list */}
                                    {topic.subtopics && topic.subtopics.length > 0 && (
                                      <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                        {topic.subtopics.map(subtopic => (
                                          <div key={subtopic.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                                            <div className="flex items-center space-x-2">
                                              <span className="text-muted-foreground">•</span>
                                              <span>{subtopic.name}</span>
                                              {subtopic.completed && (
                                                <CheckCircle2 className="h-3 w-3 text-study-success" />
                                              )}
                                            </div>
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
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </TabsContent>


          <TabsContent value="suggestions" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Clique em uma matéria para adicionar tópicos sugeridos automaticamente baseados no conteúdo típico da disciplina.
            </div>
            <div className="grid gap-3">
              {subjects.map(subject => (
                <Card key={subject.id} className="p-4 hover:bg-study-info/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="font-medium">{subject.name}</span>
                      <Badge variant="outline">
                        {subject.topics?.length || 0} tópicos atuais
                      </Badge>
                    </div>
                    <Button
                      onClick={() => addSuggestedTopics(subject)}
                      variant="outline"
                      size="sm"
                      className="text-study-primary"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Adicionar Sugestões
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Sugestões: {generateSuggestedTopics(subject.name).slice(0, 3).join(', ')}...
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-6">
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

export default AdvancedTopicManagement;
