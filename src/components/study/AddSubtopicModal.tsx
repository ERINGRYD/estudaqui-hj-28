import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { StudySubject, StudySubtopic } from '@/types/study';

interface AddSubtopicModalProps {
  subjects: StudySubject[];
  onAddSubtopic: (subjectId: string, topicId: string, subtopic: StudySubtopic) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddSubtopicModal = ({ subjects, onAddSubtopic, isOpen, onOpenChange }: AddSubtopicModalProps) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('1');

  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const availableTopics = selectedSubject?.topics || [];

  const handleAdd = () => {
    if (name.trim() && selectedSubjectId && selectedTopicId) {
      const newSubtopic: StudySubtopic = {
        id: Date.now().toString(),
        name: name.trim(),
        topicId: selectedTopicId,
        weight: parseInt(weight),
        completed: false,
        totalTime: 0
      };
      
      onAddSubtopic(selectedSubjectId, selectedTopicId, newSubtopic);
      
      // Reset form
      setName('');
      setWeight('1');
      setSelectedSubjectId('');
      setSelectedTopicId('');
      onOpenChange(false);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId(''); // Reset topic when subject changes
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Subtópico</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject-select">Matéria</Label>
            <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
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
            <Label htmlFor="topic-select">Tópico</Label>
            <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tópico" />
              </SelectTrigger>
              <SelectContent>
                {availableTopics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subtopic-name">Nome do Subtópico</Label>
            <Input
              id="subtopic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equações do 2º grau..."
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>

          <div>
            <Label htmlFor="weight">Peso</Label>
            <Select value={weight} onValueChange={setWeight}>
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

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!name.trim() || !selectedSubjectId || !selectedTopicId}
              className="bg-study-success hover:bg-study-success/90"
            >
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubtopicModal;