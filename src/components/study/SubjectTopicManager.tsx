import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Target, Brain, Plus, Trash2, Edit3, Settings2 } from 'lucide-react';
import { StudySubject, StudyTopic, StudySubtopic } from '@/types/study';
import { toast } from '@/components/ui/use-toast';

interface SubjectTopicManagerProps {
  subjects: StudySubject[];
  onUpdateSubjects: (subjects: StudySubject[]) => void;
  trigger?: React.ReactNode;
  triggerClassName?: string;
}

const SubjectTopicManager: React.FC<SubjectTopicManagerProps> = ({
  subjects,
  onUpdateSubjects,
  trigger,
  triggerClassName
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('subjects');
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);
  const [editingTopic, setEditingTopic] = useState<StudyTopic | null>(null);
  const [editingSubtopic, setEditingSubtopic] = useState<StudySubtopic | null>(null);

  // Form states
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    priority: '1',
    weight: '1',
    color: '#3b82f6'
  });

  const [topicForm, setTopicForm] = useState({
    name: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    subjectId: ''
  });

  const [subtopicForm, setSubtopicForm] = useState({
    name: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    subjectId: '',
    topicId: ''
  });

  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
    '#f59e0b', '#eab308', '#22c55e', '#10b981', '#14b8a6', 
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
  ];

  const resetForms = () => {
    setSubjectForm({ name: '', priority: '1', weight: '1', color: '#3b82f6' });
    setTopicForm({ name: '', difficulty: 'medium', subjectId: '' });
    setSubtopicForm({ name: '', difficulty: 'medium', subjectId: '', topicId: '' });
    setEditingSubject(null);
    setEditingTopic(null);
    setEditingSubtopic(null);
  };

  // Subject management
  const handleAddSubject = () => {
    if (!subjectForm.name.trim()) return;

    const newSubject: StudySubject = {
      id: Date.now().toString(),
      name: subjectForm.name.trim(),
      topics: [],
      weight: parseInt(subjectForm.weight),
      color: subjectForm.color,
      priority: parseInt(subjectForm.priority),
      customSubject: true,
      totalTime: 0
    };

    onUpdateSubjects([...subjects, newSubject]);
    resetForms();
    toast({
      title: "Matéria adicionada",
      description: `${newSubject.name} foi adicionada com sucesso.`
    });
  };

  const handleUpdateSubject = () => {
    if (!editingSubject || !subjectForm.name.trim()) return;

    const updatedSubjects = subjects.map(subject =>
      subject.id === editingSubject.id
        ? {
            ...subject,
            name: subjectForm.name.trim(),
            weight: parseInt(subjectForm.weight),
            color: subjectForm.color,
            priority: parseInt(subjectForm.priority)
          }
        : subject
    );

    onUpdateSubjects(updatedSubjects);
    resetForms();
    toast({
      title: "Matéria atualizada",
      description: `${subjectForm.name} foi atualizada com sucesso.`
    });
  };

  const handleDeleteSubject = (subjectId: string) => {
    const updatedSubjects = subjects.filter(subject => subject.id !== subjectId);
    onUpdateSubjects(updatedSubjects);
    toast({
      title: "Matéria removida",
      description: "A matéria foi removida com sucesso."
    });
  };

  // Topic management
  const handleAddTopic = () => {
    if (!topicForm.name.trim() || !topicForm.subjectId) return;

    const newTopic: StudyTopic = {
      id: Date.now().toString(),
      name: topicForm.name.trim(),
      difficulty: topicForm.difficulty,
      completed: false,
      subtopics: []
    };

    const updatedSubjects = subjects.map(subject =>
      subject.id === topicForm.subjectId
        ? {
            ...subject,
            topics: [...(subject.topics || []), newTopic]
          }
        : subject
    );

    onUpdateSubjects(updatedSubjects);
    resetForms();
    toast({
      title: "Tópico adicionado",
      description: `${newTopic.name} foi adicionado com sucesso.`
    });
  };

  const handleDeleteTopic = (subjectId: string, topicId: string) => {
    const updatedSubjects = subjects.map(subject =>
      subject.id === subjectId
        ? {
            ...subject,
            topics: subject.topics?.filter(topic => topic.id !== topicId) || []
          }
        : subject
    );

    onUpdateSubjects(updatedSubjects);
    toast({
      title: "Tópico removido",
      description: "O tópico foi removido com sucesso."
    });
  };

  // Subtopic management
  const handleAddSubtopic = () => {
    if (!subtopicForm.name.trim() || !subtopicForm.subjectId || !subtopicForm.topicId) return;

    const newSubtopic: StudySubtopic = {
      id: Date.now().toString(),
      name: subtopicForm.name.trim(),
      difficulty: subtopicForm.difficulty,
      completed: false
    };

    const updatedSubjects = subjects.map(subject =>
      subject.id === subtopicForm.subjectId
        ? {
            ...subject,
            topics: subject.topics?.map(topic =>
              topic.id === subtopicForm.topicId
                ? {
                    ...topic,
                    subtopics: [...(topic.subtopics || []), newSubtopic]
                  }
                : topic
            ) || []
          }
        : subject
    );

    onUpdateSubjects(updatedSubjects);
    resetForms();
    toast({
      title: "Subtópico adicionado",
      description: `${newSubtopic.name} foi adicionado com sucesso.`
    });
  };

  const handleDeleteSubtopic = (subjectId: string, topicId: string, subtopicId: string) => {
    const updatedSubjects = subjects.map(subject =>
      subject.id === subjectId
        ? {
            ...subject,
            topics: subject.topics?.map(topic =>
              topic.id === topicId
                ? {
                    ...topic,
                    subtopics: topic.subtopics?.filter(subtopic => subtopic.id !== subtopicId) || []
                  }
                : topic
            ) || []
          }
        : subject
    );

    onUpdateSubjects(updatedSubjects);
    toast({
      title: "Subtópico removido",
      description: "O subtópico foi removido com sucesso."
    });
  };

  const DefaultTrigger = () => (
    <Button variant="outline" className={triggerClassName}>
      <Settings2 className="h-4 w-4 mr-2" />
      Gerenciar Conteúdo
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <DefaultTrigger />}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Matérias, Tópicos e Subtópicos</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subjects" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Matérias
            </TabsTrigger>
            <TabsTrigger value="topics" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Tópicos
            </TabsTrigger>
            <TabsTrigger value="subtopics" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Subtópicos
            </TabsTrigger>
          </TabsList>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Nova Matéria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="subject-name">Nome da Matéria</Label>
                  <Input
                    id="subject-name"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder="Ex: Matemática, Português..."
                  />
                </div>

                <div>
                  <Label>Cor</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          subjectForm.color === color ? 'border-gray-600' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSubjectForm({ ...subjectForm, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={subjectForm.priority} onValueChange={(value) => setSubjectForm({ ...subjectForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Baixa</SelectItem>
                        <SelectItem value="2">Média</SelectItem>
                        <SelectItem value="3">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Peso</Label>
                    <Select value={subjectForm.weight} onValueChange={(value) => setSubjectForm({ ...subjectForm, weight: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={editingSubject ? handleUpdateSubject : handleAddSubject}>
                    <Plus className="h-4 w-4 mr-2" />
                    {editingSubject ? 'Atualizar' : 'Adicionar'} Matéria
                  </Button>
                  {editingSubject && (
                    <Button variant="outline" onClick={resetForms}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Matérias Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: subject.color }} />
                        <span className="font-medium">{subject.name}</span>
                        <Badge variant="outline">Peso: {subject.weight}</Badge>
                        <Badge variant="outline">
                          {subject.topics?.length || 0} tópicos
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSubject(subject);
                            setSubjectForm({
                              name: subject.name,
                              priority: subject.priority.toString(),
                              weight: subject.weight.toString(),
                              color: subject.color
                            });
                          }}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSubject(subject.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Tópico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Matéria</Label>
                  <Select value={topicForm.subjectId} onValueChange={(value) => setTopicForm({ ...topicForm, subjectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nome do Tópico</Label>
                  <Input
                    value={topicForm.name}
                    onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                    placeholder="Ex: Álgebra, Geometria..."
                  />
                </div>

                <div>
                  <Label>Dificuldade</Label>
                  <Select value={topicForm.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setTopicForm({ ...topicForm, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAddTopic} disabled={!topicForm.subjectId || !topicForm.name.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Tópico
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tópicos Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects.map((subject) => (
                    <div key={subject.id}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">{subject.name}</h4>
                      <div className="space-y-2 ml-4">
                        {subject.topics?.map((topic) => (
                          <div key={topic.id} className="flex items-center justify-between p-2 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <span>{topic.name}</span>
                              <Badge variant={topic.difficulty === 'easy' ? 'default' : topic.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                                {topic.difficulty === 'easy' ? 'Fácil' : topic.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                              </Badge>
                              <Badge variant="outline">
                                {topic.subtopics?.length || 0} subtópicos
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteTopic(subject.id, topic.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">Nenhum tópico adicionado</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subtopics Tab */}
          <TabsContent value="subtopics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Novo Subtópico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Matéria</Label>
                  <Select value={subtopicForm.subjectId} onValueChange={(value) => setSubtopicForm({ ...subtopicForm, subjectId: value, topicId: '' })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma matéria" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tópico</Label>
                  <Select value={subtopicForm.topicId} onValueChange={(value) => setSubtopicForm({ ...subtopicForm, topicId: value })} disabled={!subtopicForm.subjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um tópico" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects
                        .find(s => s.id === subtopicForm.subjectId)
                        ?.topics?.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        )) || []}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nome do Subtópico</Label>
                  <Input
                    value={subtopicForm.name}
                    onChange={(e) => setSubtopicForm({ ...subtopicForm, name: e.target.value })}
                    placeholder="Ex: Equações do 1º grau..."
                  />
                </div>

                <div>
                  <Label>Dificuldade</Label>
                  <Select value={subtopicForm.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setSubtopicForm({ ...subtopicForm, difficulty: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleAddSubtopic} disabled={!subtopicForm.subjectId || !subtopicForm.topicId || !subtopicForm.name.trim()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Subtópico
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subtópicos Existentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects.map((subject) => (
                    <div key={subject.id}>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">{subject.name}</h4>
                      <div className="space-y-3 ml-4">
                        {subject.topics?.map((topic) => (
                          <div key={topic.id}>
                            <h5 className="font-medium text-xs text-muted-foreground mb-1">{topic.name}</h5>
                            <div className="space-y-1 ml-4">
                              {topic.subtopics?.map((subtopic) => (
                                <div key={subtopic.id} className="flex items-center justify-between p-2 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm">{subtopic.name}</span>
                                    <Badge variant={subtopic.difficulty === 'easy' ? 'default' : subtopic.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                                      {subtopic.difficulty === 'easy' ? 'Fácil' : subtopic.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                                    </Badge>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDeleteSubtopic(subject.id, topic.id, subtopic.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )) || <p className="text-xs text-muted-foreground">Nenhum subtópico adicionado</p>}
                            </div>
                          </div>
                        )) || <p className="text-sm text-muted-foreground">Nenhum tópico adicionado</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SubjectTopicManager;