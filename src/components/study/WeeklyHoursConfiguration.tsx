import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';

interface WeeklyHoursConfigurationProps {
  onBack: () => void;
  onNext: (weeklyHours: number) => void;
  initialValue?: number;
}

const WeeklyHoursConfiguration: React.FC<WeeklyHoursConfigurationProps> = ({
  onBack,
  onNext,
  initialValue = 14
}) => {
  const [selectedWeeklyHours, setSelectedWeeklyHours] = useState<number>(initialValue);
  const [customHours, setCustomHours] = useState<number>(initialValue);

  const weeklyPresets = [
    {
      id: 'light',
      name: 'Leve',
      hours: 7,
      description: '≈1h/dia',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '🌱'
    },
    {
      id: 'moderate',
      name: 'Moderado',
      hours: 14,
      description: '≈2h/dia',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '⚖️'
    },
    {
      id: 'intensive',
      name: 'Intensivo',
      hours: 21,
      description: '≈3h/dia',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: '🔥'
    },
    {
      id: 'custom',
      name: 'Customizado',
      hours: customHours,
      description: 'Defina você mesmo',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '⚙️'
    }
  ];

  const handlePresetSelect = (preset: typeof weeklyPresets[0]) => {
    setSelectedWeeklyHours(preset.hours);
  };

  const handleCustomHoursChange = (hours: number) => {
    setCustomHours(hours);
    if (selectedWeeklyHours === customHours) {
      setSelectedWeeklyHours(hours);
    }
  };

  const dailyAverage = Math.round((selectedWeeklyHours / 7) * 10) / 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-study-primary" />
          <span>Horas Semanais de Estudo</span>
        </CardTitle>
        <CardDescription>
          Defina quantas horas por semana você pretende dedicar aos estudos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-study-primary mb-4">
              Quantas horas por semana você pretende estudar?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {weeklyPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className={`p-4 border-2 rounded-lg transition-all text-left ${
                    selectedWeeklyHours === preset.hours
                      ? 'border-study-primary bg-study-primary/5'
                      : 'border-gray-200 hover:border-study-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{preset.icon}</div>
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-lg font-bold text-study-primary">{preset.hours}h/sem</div>
                  <div className="text-sm text-muted-foreground">{preset.description}</div>
                </button>
              ))}
            </div>

            {selectedWeeklyHours === customHours && (
              <div className="bg-muted/50 p-4 rounded-lg border">
                <label htmlFor="custom-hours" className="block text-sm font-medium mb-2">
                  Horas customizadas por semana:
                </label>
                <input
                  id="custom-hours"
                  type="number"
                  min="1"
                  max="70"
                  value={customHours}
                  onChange={(e) => handleCustomHoursChange(parseInt(e.target.value) || 1)}
                  className="w-full max-w-xs p-2 border rounded-md focus:ring-2 focus:ring-study-primary focus:border-transparent"
                />
              </div>
            )}

            {/* Resumo das configurações */}
            <div className="bg-study-secondary/20 p-4 rounded-lg border border-study-primary/20">
              <h4 className="font-medium text-study-primary mb-3">Resumo do seu planejamento:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Horas por semana</div>
                  <div className="font-bold text-lg text-study-primary">{selectedWeeklyHours}h</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Média diária</div>
                  <div className="font-bold text-lg text-study-accent">{dailyAverage}h</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <Button 
              onClick={() => onNext(selectedWeeklyHours)}
              className="flex items-center space-x-2 bg-study-primary hover:bg-study-primary/90"
            >
              <span>Continuar</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyHoursConfiguration;