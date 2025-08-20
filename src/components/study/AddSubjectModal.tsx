import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { StudySubject } from '@/types/study';

interface AddSubjectModalProps {
  onAddSubject: (subject: StudySubject) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddSubjectModal = ({ onAddSubject, isOpen, onOpenChange }: AddSubjectModalProps) => {
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('1');
  const [weight, setWeight] = useState('1');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
    '#f59e0b', '#eab308', '#22c55e', '#10b981', '#14b8a6', 
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1'
  ];

  const handleAdd = () => {
    if (name.trim()) {
      const newSubject: StudySubject = {
        id: Date.now().toString(),
        name: name.trim(),
        topics: [],
        weight: parseInt(weight),
        color: selectedColor,
        priority: parseInt(priority),
        customSubject: true,
        totalTime: 0
      };
      
      onAddSubject(newSubject);
      
      // Reset form
      setName('');
      setPriority('1');
      setWeight('1');
      setSelectedColor('#3b82f6');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Matéria</DialogTitle>
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
            <Label htmlFor="subject-name">Nome da Matéria</Label>
            <Input
              id="subject-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Matemática, Português..."
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
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
                    selectedColor === color ? 'border-gray-600' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={setPriority}>
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
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!name.trim()}
              className="bg-study-primary hover:bg-study-primary/90"
            >
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubjectModal;