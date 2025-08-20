import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { StudySubject, StudyTopic } from '@/types/study';

interface AddTopicModalProps {
  subjects: StudySubject[];
  onAddTopic: (subjectId: string, topic: StudyTopic) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddTopicModal = ({ subjects, onAddTopic, isOpen, onOpenChange }: AddTopicModalProps) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('1');

  const handleAdd = () => {
    if (name.trim() && selectedSubjectId) {
      const newTopic: StudyTopic = {
        id: Date.now().toString(),
        name: name.trim(),
        subjectId: selectedSubjectId,
        subtopics: [],
        weight: parseInt(weight),
        completed: false,
        totalTime: 0
      };
      
      onAddTopic(selectedSubjectId, newTopic);
      
      // Reset form
      setName('');
      setWeight('1');
      setSelectedSubjectId('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Tópico</DialogTitle>
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
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
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
            <Label htmlFor="topic-name">Nome do Tópico</Label>
            <Input
              id="topic-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Álgebra, Funções..."
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
              disabled={!name.trim() || !selectedSubjectId}
              className="bg-study-accent hover:bg-study-accent/90"
            >
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTopicModal;