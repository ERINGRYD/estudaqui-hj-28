
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';

interface ExamSelectionProps {
  examTypes: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  selectedExam: string;
  setSelectedExam: (exam: string) => void;
  onNext: () => void;
}

const ExamSelection = ({ examTypes, selectedExam, setSelectedExam, onNext }: ExamSelectionProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <span>Qual prova você está preparando?</span>
        </CardTitle>
        <CardDescription>
          Selecione o tipo de exame para personalizar seu plano de estudos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedExam} onValueChange={setSelectedExam}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {examTypes.map((exam) => (
              <div key={exam.id} className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value={exam.id} id={exam.id} />
                <Label htmlFor={exam.id} className="flex-1 cursor-pointer">
                  <div className="font-medium">{exam.name}</div>
                  <div className="text-sm text-gray-500">{exam.description}</div>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
        
        {selectedExam && (
          <div className="mt-6 flex justify-end">
            <Button onClick={onNext}>
              Próximo: Avaliar Conhecimentos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExamSelection;
