import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import {
  BookOpen,
  Calendar,
  Clock,
  PlayCircle,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { getSavedPlans, loadStudyPlan, getActivePlan } from '@/utils/studyPlanPersistence';
import { StudyPlan } from '@/types/study';

interface StudyPlanRecoveryProps {
  onPlanLoaded: (plan: StudyPlan) => void;
  onDismiss: () => void;
}

const StudyPlanRecovery: React.FC<StudyPlanRecoveryProps> = ({
  onPlanLoaded,
  onDismiss
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [savedPlans, setSavedPlans] = useState(getSavedPlans());
  const [activePlan, setActivePlan] = useState(getActivePlan());

  useEffect(() => {
    // Show recovery dialog if there are saved plans but no active plan loaded
    const shouldShowRecovery = savedPlans.length > 0;
    setIsOpen(shouldShowRecovery);
  }, [savedPlans.length]);

  const handleLoadPlan = (planId: string) => {
    const plan = loadStudyPlan(planId);
    if (plan) {
      onPlanLoaded(plan);
      toast({
        title: "Plano Carregado",
        description: "Seu plano de estudos foi restaurado com sucesso!"
      });
      setIsOpen(false);
      onDismiss();
    } else {
      toast({
        title: "Erro",
        description: "Falha ao carregar o plano.",
        variant: "destructive"
      });
    }
  };

  const handleStartNew = () => {
    setIsOpen(false);
    onDismiss();
    toast({
      title: "Novo Plano",
      description: "Você pode criar um novo plano de estudos agora."
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    onDismiss();
  };

  const getProgressInfo = (plan: StudyPlan) => {
    const totalDays = plan.cycle?.length || 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = plan.examDate ? new Date(plan.examDate) : today;
    startDate.setHours(0, 0, 0, 0);
    
    const daysPassed = Math.max(0, differenceInDays(today, startDate));
    const progressPercentage = totalDays > 0 ? Math.min(100, (daysPassed / totalDays) * 100) : 0;
    
    return {
      totalDays,
      daysPassed,
      progressPercentage,
      daysRemaining: Math.max(0, totalDays - daysPassed)
    };
  };

  const getMostRecentPlan = () => {
    return savedPlans
      .filter(p => p.plan.examDate)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  };

  const mostRecentPlan = getMostRecentPlan();

  if (!isOpen || savedPlans.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="max-w-2xl"  onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Bem-vindo de volta!
          </DialogTitle>
          <DialogDescription>
            Encontramos planos de estudo salvos. Deseja continuar de onde parou?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Active/Most Recent Plan */}
          {(activePlan || mostRecentPlan) && (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    {(activePlan || mostRecentPlan)?.name}
                  </CardTitle>
                  <Badge variant="secondary">Recomendado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const plan = (activePlan || mostRecentPlan)?.plan;
                  const progress = plan ? getProgressInfo(plan) : null;
                  
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {plan?.examDate 
                              ? `Prova: ${format(new Date(plan.examDate), 'dd/MM/yyyy')}`
                              : 'Data não definida'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {progress 
                              ? `${progress.daysPassed}/${progress.totalDays} dias`
                              : 'Progresso não calculado'
                            }
                          </span>
                        </div>
                      </div>

                      {progress && progress.totalDays > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{progress.progressPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.progressPercentage}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {progress.daysRemaining > 0 
                              ? `${progress.daysRemaining} dias restantes`
                              : 'Plano concluído!'
                            }
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleLoadPlan((activePlan || mostRecentPlan)!.id)}
                          className="flex-1"
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Continuar Este Plano
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Other Saved Plans */}
          {savedPlans.length > 1 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Outros Planos Salvos
              </h4>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {savedPlans
                    .filter(p => p.id !== (activePlan || mostRecentPlan)?.id)
                    .map((plan) => {
                      const progress = getProgressInfo(plan.plan);
                      return (
                        <Card key={plan.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{plan.name}</h5>
                              <div className="text-xs text-muted-foreground">
                                Atualizado: {format(new Date(plan.updatedAt), 'dd/MM/yyyy')}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleLoadPlan(plan.id)}
                            >
                              Carregar
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleStartNew}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Criar Novo Plano
            </Button>
            <Button
              variant="ghost"
              onClick={handleClose}
            >
              Fechar
            </Button>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Seus dados são salvos localmente</p>
              <p className="text-muted-foreground text-xs">
                Todos os planos e progresso ficam salvos no seu navegador. 
                Use a função de backup para não perder seus dados.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudyPlanRecovery;
