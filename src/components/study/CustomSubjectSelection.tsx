import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, BookOpen, Trash2, Star } from 'lucide-react';
import { StudySubject } from '@/types/study';
interface CustomSubjectSelectionProps {
  selectedSubjects: StudySubject[];
  setSelectedSubjects: (subjects: StudySubject[]) => void;
  onNext: () => void;
  onBack: () => void;
}
const CustomSubjectSelection = ({
  selectedSubjects,
  setSelectedSubjects,
  onNext,
  onBack
}: CustomSubjectSelectionProps) => {
  const [newSubjectName, setNewSubjectName] = useState('');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87d068', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'];
  const addSubject = () => {
    if (newSubjectName.trim()) {
      const newSubject: StudySubject = {
        id: Date.now().toString(),
        name: newSubjectName.trim(),
        topics: [],
        weight: 2,
        priority: 1,
        color: colors[selectedSubjects.length % colors.length],
        customSubject: true,
        totalTime: 0
      };
      setSelectedSubjects([...selectedSubjects, newSubject]);
      setNewSubjectName('');
    }
  };
  const removeSubject = (id: string) => {
    setSelectedSubjects(selectedSubjects.filter(s => s.id !== id));
  };
  const updateSubject = (id: string, updates: Partial<StudySubject>) => {
    setSelectedSubjects(selectedSubjects.map(s => s.id === id ? {
      ...s,
      ...updates
    } : s));
  };
  const commonSubjects = [{
    name: 'Matemática',
    category: 'Exatas'
  }, {
    name: 'Português',
    category: 'Linguagens'
  }, {
    name: 'História',
    category: 'Humanas'
  }, {
    name: 'Geografia',
    category: 'Humanas'
  }, {
    name: 'Física',
    category: 'Exatas'
  }, {
    name: 'Química',
    category: 'Exatas'
  }, {
    name: 'Biologia',
    category: 'Natureza'
  }, {
    name: 'Literatura',
    category: 'Linguagens'
  }, {
    name: 'Inglês',
    category: 'Linguagens'
  }, {
    name: 'Filosofia',
    category: 'Humanas'
  }, {
    name: 'Sociologia',
    category: 'Humanas'
  }, {
    name: 'Redação',
    category: 'Linguagens'
  }, {
    name: 'Informática',
    category: 'Técnica'
  }, {
    name: 'Direito Constitucional',
    category: 'Direito'
  }, {
    name: 'Direito Administrativo',
    category: 'Direito'
  }, {
    name: 'Direito Civil',
    category: 'Direito'
  }, {
    name: 'Direito Penal',
    category: 'Direito'
  }, {
    name: 'Raciocínio Lógico',
    category: 'Exatas'
  }, {
    name: 'Conhecimentos Gerais',
    category: 'Gerais'
  }];
  const addCommonSubject = (subjectName: string) => {
    if (!selectedSubjects.find(s => s.name === subjectName)) {
      const newSubject: StudySubject = {
        id: Date.now().toString(),
        name: subjectName,
        topics: [],
        weight: 2,
        priority: 1,
        color: colors[selectedSubjects.length % colors.length],
        customSubject: false,
        totalTime: 0
      };
      setSelectedSubjects([...selectedSubjects, newSubject]);
    }
  };
  const groupedSubjects = commonSubjects.length > 0 ? commonSubjects.reduce((acc, subject) => {
    if (!acc[subject.category]) {
      acc[subject.category] = [];
    }
    acc[subject.category].push(subject);
    return acc;
  }, {} as Record<string, typeof commonSubjects>) : {};
  return <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-study-primary" />
          <span>Selecionar Matérias</span>
        </CardTitle>
        <CardDescription>
          Escolha as matérias que você deseja estudar ou crie suas próprias. Você pode ajustar a prioridade e peso de cada uma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new subject */}
        <div className="space-y-3">
          <Label htmlFor="newSubject">Adicionar Nova Matéria</Label>
          <div className="flex space-x-2">
            <Input id="newSubject" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} placeholder="Nome da matéria..." onKeyPress={e => e.key === 'Enter' && addSubject()} />
            <Button onClick={addSubject} disabled={!newSubjectName.trim()} className="bg-study-primary hover:bg-study-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Common subjects by category */}
        <div className="space-y-4">
          <Label>Matérias por Categoria</Label>
          {Object.entries(groupedSubjects).map(([category, subjects]) => <div key={category} className="space-y-2">
              <h4 className="text-sm font-medium text-study-primary">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {subjects.map(subject => <Badge key={subject.name} variant={selectedSubjects.find(s => s.name === subject.name) ? "default" : "secondary"} className="cursor-pointer hover:bg-study-primary hover:text-study-primary-foreground" onClick={() => addCommonSubject(subject.name)}>
                    {subject.name}
                    {selectedSubjects.find(s => s.name === subject.name) && <span className="ml-1">✓</span>}
                  </Badge>)}
              </div>
            </div>)}
        </div>

        {/* Selected subjects with advanced options */}
        {selectedSubjects.length > 0 && <div className="space-y-3">
            <Label>Matérias Selecionadas ({selectedSubjects.length})</Label>
            <div className="space-y-4">
              {selectedSubjects.map(subject => <Card key={subject.id} className="p-4 border border-study-primary/20 bg-slate-50">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      {editingSubject === subject.id ? <Input value={subject.name} onChange={e => updateSubject(subject.id, {
                  name: e.target.value
                })} onBlur={() => setEditingSubject(null)} onKeyPress={e => {
                  if (e.key === 'Enter') {
                    setEditingSubject(null);
                  }
                }} autoFocus className="flex-1 mr-2" /> : <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full" style={{
                    backgroundColor: subject.color
                  }} />
                          <span className="flex-1 cursor-pointer font-medium text-study-primary" onClick={() => setEditingSubject(subject.id)}>
                            {subject.name}
                          </span>
                          {subject.customSubject && <Badge variant="outline" className="text-xs">
                              Personalizada
                            </Badge>}
                        </div>}
                      <Button variant="ghost" size="sm" onClick={() => removeSubject(subject.id)} className="text-study-danger hover:text-study-danger hover:bg-study-danger/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Prioridade</Label>
                        <div className="flex items-center space-x-2">
                          <Slider value={[subject.priority || 1]} onValueChange={([value]) => updateSubject(subject.id, {
                      priority: value
                    })} max={5} min={1} step={1} className="flex-1" />
                          <div className="flex">
                            {Array.from({
                        length: subject.priority || 1
                      }).map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                          </div>
                        </div>
                      </div>

                      
                    </div>
                  </div>
                </Card>)}
            </div>
          </div>}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          
          <Button onClick={onNext} disabled={selectedSubjects.length === 0} className="bg-study-primary hover:bg-study-primary/90">
            Próximo: Organizar Tópicos
          </Button>
        </div>
      </CardContent>
    </Card>;
};
export default CustomSubjectSelection;