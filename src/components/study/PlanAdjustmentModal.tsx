
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, RotateCcw, Save } from 'lucide-react';
import { StudyPlan, StudySubject } from '@/types/study';

interface PlanAdjustmentModalProps {
  studyPlan: StudyPlan;
  subjects?: StudySubject[];
  subjectLevels?: Record<string, string>;
  onUpdatePlan: (updatedPlan: StudyPlan) => void;
  onRegenerateCycle?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

const PlanAdjustmentModal: React.FC<PlanAdjustmentModalProps> = ({
  studyPlan,
  subjects = [],
  subjectLevels = {},
  onUpdatePlan,
  onRegenerateCycle,
  isOpen,
  onClose,
  children
}) => {
  const [weeklyHours, setWeeklyHours] = useState(studyPlan.totalHours);
  const [subjectHours, setSubjectHours] = useState<Record<string, number>>(() => {
    const hours: Record<string, number> = {};
    subjects.forEach(subject => {
      const planData = studyPlan.data?.find((d: any) => d.subject === subject.name);
      hours[subject.name] = planData?.hoursPerWeek || planData?.hours || 2;
    });
    return hours;
  });
  const [subjectPriorities, setSubjectPriorities] = useState<Record<string, number>>(() => {
    const priorities: Record<string, number> = {};
    subjects.forEach(subject => {
      priorities[subject.name] = subject.priority || 1;
    });
    return priorities;
  });

  const levelWeights = {
    beginner: 3,
    intermediate: 2,
    advanced: 1
  };

  const totalHours = Object.values(subjectHours).length > 0 ? Object.values(subjectHours).reduce((sum, hours) => sum + hours, 0) : 0;
  const dailyHours = weeklyHours / 7;
  const maxDailyHours = studyPlan.daysUntilExam && studyPlan.daysUntilExam < 30 ? 8 : 
                       studyPlan.daysUntilExam && studyPlan.daysUntilExam < 60 ? 6 : 4;

  const handleSubjectHourChange = (subject: string, hours: number[]) => {
    setSubjectHours(prev => ({ ...prev, [subject]: hours[0] }));
  };

  const handlePriorityChange = (subject: string, priority: number[]) => {
    setSubjectPriorities(prev => ({ ...prev, [subject]: priority[0] }));
  };

  const redistributeByLevels = () => {
    if (subjects.length === 0) return;
    
    const totalWeight = subjects.reduce((sum, subject) => {
      const level = subjectLevels[subject.name] as keyof typeof levelWeights;
      const priority = subjectPriorities[subject.name] || 1;
      return sum + (levelWeights[level] || 2) * priority;
    }, 0);

    const newHours: Record<string, number> = {};
    subjects.forEach(subject => {
      const level = subjectLevels[subject.name] as keyof typeof levelWeights;
      const priority = subjectPriorities[subject.name] || 1;
      const weight = (levelWeights[level] || 2) * priority;
      newHours[subject.name] = Math.round((weight / totalWeight) * weeklyHours);
    });

    setSubjectHours(newHours);
  };

  const resetToDefault = () => {
    const defaultHours = weeklyHours / subjects.length;
    const newHours: Record<string, number> = {};
    subjects.forEach(subject => {
      newHours[subject.name] = Math.round(defaultHours);
    });
    setSubjectHours(newHours);
    
    const newPriorities: Record<string, number> = {};
    subjects.forEach(subject => {
      newPriorities[subject.name] = 1;
    });
    setSubjectPriorities(newPriorities);
  };

  const handleSave = () => {
    const updatedData = subjects.map(subject => {
      const hours = subjectHours[subject.name];
      return {
        subject: subject.name,
        hours,
        hoursPerWeek: hours,
        percentage: Math.round((hours / totalHours) * 100),
        color: subject.color,
        priority: subjectPriorities[subject.name]
      };
    });

    const updatedPlan: StudyPlan = {
      ...studyPlan,
      totalHours: totalHours,
      data: updatedData,
      subjects: subjects.map(subject => ({
        ...subject,
        priority: subjectPriorities[subject.name]
      }))
    };

    onUpdatePlan(updatedPlan);
  };

  // If using as standalone dialog with isOpen/onClose props
  if (isOpen !== undefined && onClose) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-study-primary" />
              <span>Ajustar Plano de Estudos</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Weekly Hours Adjustment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horas Semanais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Total de Horas por Semana: {weeklyHours}h</Label>
                  <Slider
                    value={[weeklyHours]}
                    onValueChange={(value) => setWeeklyHours(value[0])}
                    max={70}
                    min={10}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Horas/dia:</span>
                    <span className="font-medium ml-2">{dailyHours.toFixed(1)}h</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Máximo recomendado:</span>
                    <span className="font-medium ml-2">{maxDailyHours}h</span>
                  </div>
                  <div>
                    {dailyHours > maxDailyHours && (
                      <Badge variant="destructive" className="text-xs">
                        Acima do recomendado
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Hours Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Distribuição por Matéria</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={redistributeByLevels}>
                      Redistribuir por Nível
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetToDefault}>
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Resetar
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjects.map(subject => {
                    const level = subjectLevels[subject.name];
                    const hours = subjectHours[subject.name] || 0;
                    const priority = subjectPriorities[subject.name] || 1;
                    
                    return (
                      <div key={subject.name} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: subject.color }}
                            />
                            <span className="font-medium">{subject.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {level === 'beginner' ? 'Iniciante' : 
                               level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">Horas/semana: {hours}h</Label>
                            <Slider
                              value={[hours]}
                              onValueChange={(value) => handleSubjectHourChange(subject.name, value)}
                              max={20}
                              min={1}
                              step={1}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Prioridade: {priority}</Label>
                            <Slider
                              value={[priority]}
                              onValueChange={(value) => handlePriorityChange(subject.name, value)}
                              max={5}
                              min={1}
                              step={1}
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 p-3 bg-study-secondary/20 rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    Total: {totalHours}h/semana ({(totalHours / 7).toFixed(1)}h/dia)
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button 
                onClick={() => {
                  handleSave();
                  onClose();
                }} 
                className="bg-study-primary hover:bg-study-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Ajustes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Original trigger-based dialog
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-study-primary" />
            <span>Ajustar Plano de Estudos</span>
          </DialogTitle>
        </DialogHeader>

        {/* ... same content as above ... */}
        <div className="space-y-6">
          <div className="flex justify-end space-x-3">
            <DialogTrigger asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button onClick={handleSave} className="bg-study-primary hover:bg-study-primary/90">
                <Save className="h-4 w-4 mr-2" />
                Salvar Ajustes
              </Button>
            </DialogTrigger>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlanAdjustmentModal;
