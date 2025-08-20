import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Save, Upload, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Subject, Topic, QuestionFormData } from '@/types/questions';
import { createQuestion } from '@/db/crud/questions';
import { useStudyContext } from '@/contexts/StudyContext';
import { toast } from '@/hooks/use-toast';
import type { Difficulty } from '@/types/battle';

interface AddQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: Topic | null;
  subjects: Subject[];
  onQuestionAdded?: () => void;
}

export function AddQuestionModal({ isOpen, onClose, topic, subjects, onQuestionAdded }: AddQuestionModalProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    title: '',
    content: '',
    options: [
      { label: 'A', content: '', isCorrect: false },
      { label: 'B', content: '', isCorrect: false },
      { label: 'C', content: '', isCorrect: false },
      { label: 'D', content: '', isCorrect: false },
    ],
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    tags: [],
    examiningBoard: '',
    position: '',
    examYear: '',
    institution: ''
  });
  
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (topic) {
      setSelectedSubjectId(topic.subjectId);
      setSelectedTopicId(topic.id);
    } else {
      setSelectedSubjectId('');
      setSelectedTopicId('');
    }
  }, [topic]);

  // Auto-select first topic when subject changes
  useEffect(() => {
    if (selectedSubjectId) {
      const subject = subjects.find(s => s.id === selectedSubjectId);
      if (subject?.topics && subject.topics.length > 0) {
        setSelectedTopicId(subject.topics[0].id);
      }
    }
  }, [selectedSubjectId, subjects]);

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const availableTopics = selectedSubject?.topics || [];

  const handleOptionChange = (index: number, field: 'content' | 'isCorrect', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index 
          ? { ...option, [field]: value }
          : field === 'isCorrect' && value 
            ? { ...option, isCorrect: false }
            : option
      )
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Erro",
        description: "Título e conteúdo são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedTopicId) {
      toast({
        title: "Erro",
        description: "Selecione um tema para a questão",
        variant: "destructive"
      });
      return;
    }

    // Find correct answer from options
    const correctOption = formData.options.find(option => option.isCorrect);
    const correctAnswer = correctOption ? correctOption.content : formData.correctAnswer;

    if (!correctAnswer.trim()) {
      toast({
        title: "Erro",
        description: "Marque a alternativa correta",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create question in database
      const questionId = createQuestion(
        selectedTopicId,
        formData.title,
        formData.content,
        correctAnswer,
        formData.options.length > 0 && formData.options.some(opt => opt.content.trim()) 
          ? formData.options.filter(opt => opt.content.trim())
          : undefined,
        formData.explanation || undefined,
        formData.difficulty as Difficulty,
        formData.tags,
        selectedImages,
        formData.examiningBoard || undefined,
        formData.position || undefined,
        formData.examYear || undefined,
        formData.institution || undefined
      );

      // Topic will be marked as enemy via database trigger

      toast({
        title: "Sucesso",
        description: "Questão criada com sucesso!"
      });

      if (onQuestionAdded) {
        onQuestionAdded();
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar questão",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedImages(prev => [...prev, event.target.result as string]);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (indexToRemove: number) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      options: [
        { label: 'A', content: '', isCorrect: false },
        { label: 'B', content: '', isCorrect: false },
        { label: 'C', content: '', isCorrect: false },
        { label: 'D', content: '', isCorrect: false },
      ],
      correctAnswer: '',
      explanation: '',
      difficulty: 'medium',
      tags: [],
      examiningBoard: '',
      position: '',
      examYear: '',
      institution: ''
    });
    setNewTag('');
    setSelectedImages([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-study-primary" />
            Nova Questão
          </DialogTitle>
          <DialogDescription>
            Adicione uma nova questão ao banco de dados
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Matéria e Tema */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Matéria</Label>
              <Select 
                value={selectedSubjectId} 
                onValueChange={setSelectedSubjectId}
                disabled={!!topic}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma matéria" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Tema</Label>
              <Select 
                value={selectedTopicId} 
                onValueChange={setSelectedTopicId}
                disabled={!!topic || !selectedSubjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um tema" />
                </SelectTrigger>
                <SelectContent>
                  {availableTopics.map(topicItem => (
                    <SelectItem key={topicItem.id} value={topicItem.id}>
                      {topicItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Título e Dificuldade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="title">Título da Questão</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Cálculo de Derivadas"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Dificuldade</Label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value: 'easy' | 'medium' | 'hard') => 
                  setFormData(prev => ({ ...prev, difficulty: value }))
                }
              >
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
          </div>

          {/* Informações da Prova */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="examiningBoard">Banca Examinadora</Label>
              <Input
                id="examiningBoard"
                value={formData.examiningBoard}
                onChange={(e) => setFormData(prev => ({ ...prev, examiningBoard: e.target.value }))}
                placeholder="Ex: FCC, CESPE, FGV..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Cargo</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="Ex: Analista Judiciário, Técnico..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="examYear">Ano da Prova</Label>
              <Input
                id="examYear"
                value={formData.examYear}
                onChange={(e) => setFormData(prev => ({ ...prev, examYear: e.target.value }))}
                placeholder="Ex: 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution">Instituição/Órgão</Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                placeholder="Ex: TRF, Prefeitura..."
              />
            </div>
          </div>

          {/* Conteúdo da Questão */}
          <div className="space-y-2">
            <Label htmlFor="content">Enunciado da Questão</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Descreva o enunciado completo da questão..."
              rows={4}
              required
            />
          </div>

          {/* Alternativas */}
          <div className="space-y-4">
            <Label>Alternativas</Label>
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={option.isCorrect}
                        onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                        className="text-study-primary"
                      />
                      <Label className="font-medium">{option.label})</Label>
                    </div>
                    <Input
                      value={option.content}
                      onChange={(e) => handleOptionChange(index, 'content', e.target.value)}
                      placeholder={`Conteúdo da alternativa ${option.label}`}
                      className="flex-1"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Explicação */}
          <div className="space-y-2">
            <Label htmlFor="explanation">Explicação (Opcional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
              placeholder="Explique a resposta correta e o raciocínio..."
              rows={3}
            />
          </div>

          {/* Imagens */}
          <div className="space-y-2">
            <Label htmlFor="images">Imagens (Opcional)</Label>
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Adicionar Imagens
                </Button>
              </div>
              
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Adicionar tag..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              Salvar Questão
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}