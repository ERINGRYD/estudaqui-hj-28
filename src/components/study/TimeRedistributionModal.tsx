import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, Clock, TrendingUp, Lightbulb, AlertCircle } from 'lucide-react';
import { StudySubject } from '@/types/study';
import PriorityVisualization from './PriorityVisualization';
import { calculateTopicPriority, PriorityContext } from '@/utils/priorityCalculation';
import { generateAdjustmentReport, defaultAutoAdjustmentConfig } from '@/utils/autoWeightAdjustment';

interface TimeRedistributionModalProps {
  subjects: StudySubject[];
  onRedistribute: (subjects: StudySubject[]) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  totalWeeklyHours: number;
  examDate?: Date;
}

const TimeRedistributionModal = ({ 
  subjects, 
  onRedistribute, 
  isOpen, 
  onOpenChange, 
  totalWeeklyHours,
  examDate
}: TimeRedistributionModalProps) => {
  const [weights, setWeights] = useState<Record<string, number>>(
    subjects.reduce((acc, subject) => ({
      ...acc,
      [subject.id]: subject.weight || 1
    }), {})
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [adjustmentReport, setAdjustmentReport] = useState<any>(null);

  // Calcular prioridades e sugestões quando modal abre
  useEffect(() => {
    if (isOpen) {
      const context: PriorityContext = {
        examDate,
        currentDate: new Date(),
        performanceHistory: {}
      };
      
      // Adicionar tópicos mock para cada subject se não existirem
      const subjectsWithTopics = subjects.map(subject => ({
        ...subject,
        topics: subject.topics && subject.topics.length > 0 ? subject.topics : [
          {
            id: `${subject.id}_topic_1`,
            name: `Fundamentos de ${subject.name}`,
            subjectId: subject.id,
            weight: Math.floor(Math.random() * 3) + 1,
            difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
            lastStudied: Math.random() > 0.5 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
            completed: false
          },
          {
            id: `${subject.id}_topic_2`,
            name: `Avançado de ${subject.name}`,
            subjectId: subject.id,
            weight: Math.floor(Math.random() * 3) + 1,
            difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
            lastStudied: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
            completed: false
          }
        ]
      }));
      
      // Gerar relatório de ajustes sugeridos
      const report = generateAdjustmentReport(subjectsWithTopics, examDate, defaultAutoAdjustmentConfig);
      setAdjustmentReport(report);
      
      console.log('📊 Sistema de Priorização - Relatório gerado:', report);
    }
  }, [isOpen, subjects, examDate]);

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const calculateHours = (weight: number) => {
    if (totalWeight === 0) return 0;
    return Math.round((weight / totalWeight) * totalWeeklyHours * 10) / 10;
  };

  const handleWeightChange = (subjectId: string, newWeight: number) => {
    setWeights(prev => ({
      ...prev,
      [subjectId]: newWeight
    }));
  };

  const handleRedistribute = () => {
    const updatedSubjects = subjects.map(subject => ({
      ...subject,
      weight: weights[subject.id] || 1
    }));
    
    onRedistribute(updatedSubjects);
    onOpenChange(false);
  };

  const resetWeights = () => {
    const equalWeight = Math.floor(10 / subjects.length);
    const newWeights = subjects.reduce((acc, subject) => ({
      ...acc,
      [subject.id]: equalWeight
    }), {});
    setWeights(newWeights);
  };

  const applySuggestions = () => {
    if (!adjustmentReport) return;
    
    const newWeights = { ...weights };
    adjustmentReport.suggestions.forEach((suggestion: any) => {
      const subject = subjects.find(s => s.name === suggestion.subjectName);
      if (subject) {
        const currentWeight = weights[subject.id] || 1;
        newWeights[subject.id] = Math.max(1, Math.min(10, currentWeight + suggestion.suggestedAdjustment));
      }
    });
    
    setWeights(newWeights);
    setShowSuggestions(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-study-primary" />
            <span>Redistribuir Tempo</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-study-accent" />
              <span className="text-sm font-medium">
                Total semanal: {totalWeeklyHours}h
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetWeights}
              className="text-study-accent hover:bg-study-accent/10"
            >
              Distribuir Igualmente
            </Button>
          </div>

          {/* Painel de Sugestões */}
          {adjustmentReport && adjustmentReport.totalSuggestions > 0 && (
            <Card className="border border-blue-200 bg-blue-50/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Sugestões Inteligentes ({adjustmentReport.totalSuggestions})
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSuggestions(!showSuggestions)}
                    >
                      {showSuggestions ? 'Ocultar' : 'Ver Detalhes'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={applySuggestions}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Aplicar Todas
                    </Button>
                  </div>
                </div>
                
                {showSuggestions && (
                  <div className="space-y-2">
                    {adjustmentReport.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                        <div>
                          <span className="font-medium">{suggestion.subjectName}</span>
                          <span className="text-muted-foreground ml-2">
                            {suggestion.currentWeight} → {suggestion.currentWeight + suggestion.suggestedAdjustment}
                          </span>
                        </div>
                        <Badge variant={suggestion.impact === 'high' ? 'destructive' : 'secondary'}>
                          {suggestion.reason === 'low_performance' ? 'Baixa Performance' :
                           suggestion.reason === 'not_studied_recently' ? 'Não Estudado' :
                           suggestion.reason === 'exam_proximity' ? 'Proximidade Exame' :
                           suggestion.reason === 'high_performance' ? 'Alta Performance' : suggestion.reason}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {subjects.map((subject) => {
              const weight = weights[subject.id] || 1;
              const hours = calculateHours(weight);
              const percentage = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;

              // Calcular prioridade para este subject
              const context: PriorityContext = {
                examDate,
                currentDate: new Date(),
                performanceHistory: {}
              };

              return (
                <Card key={subject.id} className="border border-study-primary/20">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          <span className="font-medium text-study-primary">
                            {subject.name}
                          </span>
                          
                          {/* Indicador de sugestão */}
                          {adjustmentReport?.suggestions.some((s: any) => s.subjectName === subject.name) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-3 w-3 text-blue-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div>Ajuste sugerido pelo sistema</div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-study-primary">
                            {hours}h
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Prioridade</Label>
                          <span className="text-sm font-medium">
                            {weight}
                          </span>
                        </div>
                        <Slider
                          value={[weight]}
                          onValueChange={(value) => handleWeightChange(subject.id, value[0])}
                          min={1}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                        <Progress 
                          value={percentage} 
                          className="h-2"
                          style={{ 
                            backgroundColor: `${subject.color}20`,
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-study-info/10 p-4 rounded-lg">
            <h4 className="font-medium text-study-primary mb-2">
              Distribuição Atual
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {subjects.map((subject) => {
                const hours = calculateHours(weights[subject.id] || 1);
                return (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="truncate">{subject.name}:</span>
                    <span className="font-medium">{hours}h</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRedistribute}
              className="bg-study-primary hover:bg-study-primary/90"
            >
              Aplicar Redistribuição
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimeRedistributionModal;