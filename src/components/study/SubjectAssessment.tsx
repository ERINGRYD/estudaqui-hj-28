
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Brain, Clock } from 'lucide-react';
import { StudySubject } from '@/types/study';

interface SubjectAssessmentProps {
  subjects: StudySubject[];
  subjectLevels: Record<string, string>;
  setSubjectLevels: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  planType: string;
  setPlanType: (type: string) => void;
  onBack: () => void;
  onNext: () => void;
}

const SubjectAssessment = ({
  subjects,
  subjectLevels,
  setSubjectLevels,
  planType,
  setPlanType,
  onBack,
  onNext
}: SubjectAssessmentProps) => {
  const levelLabels = {
    beginner: { label: 'Iniciante', color: 'bg-red-100 text-red-800', weight: 3, description: 'Preciso começar do básico' },
    intermediate: { label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800', weight: 2, description: 'Tenho conhecimento parcial' },
    advanced: { label: 'Avançado', color: 'bg-green-100 text-green-800', weight: 1, description: 'Domino bem o assunto' }
  };

  const weekDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0', '#ffb347', '#87d068'];

  const handleSubjectLevelChange = (subject: string, level: string) => {
    setSubjectLevels(prev => ({
      ...prev,
      [subject]: level
    }));
  };

  const isFormComplete = () => {
    return subjects.every(subject => subjectLevels[subject.name]);
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-study-primary" />
          <span>Avalie seu nível de conhecimento</span>
        </CardTitle>
        <CardDescription>
          Para cada disciplina, selecione seu nível atual de conhecimento
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {subjects.map((subject) => (
            <div key={subject.id} className="border-b pb-4 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-1">{subject.name}</h3>
                  {subjectLevels[subject.name] && (
                    <p className="text-sm text-gray-500">
                      {levelLabels[subjectLevels[subject.name] as keyof typeof levelLabels]?.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.entries(levelLabels).map(([level, config]) => (
                    <button
                      key={level}
                      onClick={() => handleSubjectLevelChange(subject.name, level)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        subjectLevels[subject.name] === level
                          ? config.color + ' ring-2 ring-study-primary'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {isFormComplete() && (
          <div className="mt-8 p-4 bg-study-secondary/20 rounded-lg border border-study-primary/20">
            <h3 className="font-medium text-study-primary mb-4">Escolha o tipo de cronograma:</h3>
            <RadioGroup value={planType} onValueChange={setPlanType}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="cycle" id="cycle" />
                  <Label htmlFor="cycle" className="cursor-pointer">
                    <div className="font-medium">Ciclo de Estudos</div>
                    <div className="text-sm text-gray-600">Distribui as matérias em blocos rotativos</div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-between">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={!isFormComplete()}
            className="flex items-center space-x-2 bg-study-primary hover:bg-study-primary/90 text-study-primary-foreground"
          >
            <Clock className="h-4 w-4" />
            <span>Continuar para Prévia</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubjectAssessment;
