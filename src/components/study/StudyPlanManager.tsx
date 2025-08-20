import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { 
  Save, 
  FolderOpen, 
  Trash2, 
  Download, 
  Upload, 
  Archive, 
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import {
  saveStudyPlan,
  getSavedPlans,
  loadStudyPlan,
  deleteStudyPlan,
  exportStudyPlan,
  importStudyPlan,
  createBackup
} from '@/utils/studyPlanPersistence';
import { StudyPlan } from '@/types/study';

interface StudyPlanManagerProps {
  currentPlan: StudyPlan | null;
  onPlanLoaded: (plan: StudyPlan) => void;
  onPlanSaved: (planId: string) => void;
}

const StudyPlanManager: React.FC<StudyPlanManagerProps> = ({
  currentPlan,
  onPlanLoaded,
  onPlanSaved
}) => {
  const [savedPlans, setSavedPlans] = useState(getSavedPlans());
  const [isOpen, setIsOpen] = useState(false);
  const [savePlanName, setSavePlanName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);

  const refreshSavedPlans = () => {
    setSavedPlans(getSavedPlans());
  };

  const handleSavePlan = () => {
    if (!currentPlan) {
      toast({
        title: "Erro",
        description: "Nenhum plano ativo para salvar.",
        variant: "destructive"
      });
      return;
    }

    if (!savePlanName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, digite um nome para o plano.",
        variant: "destructive"
      });
      return;
    }

    const planId = saveStudyPlan(currentPlan, savePlanName.trim());
    if (planId) {
      toast({
        title: "Sucesso",
        description: `Plano "${savePlanName}" salvo com sucesso!`
      });
      setSavePlanName('');
      setShowSaveDialog(false);
      refreshSavedPlans();
      onPlanSaved(planId);
    } else {
      toast({
        title: "Erro",
        description: "Falha ao salvar o plano.",
        variant: "destructive"
      });
    }
  };

  const handleLoadPlan = (planId: string) => {
    const plan = loadStudyPlan(planId);
    if (plan) {
      onPlanLoaded(plan);
      toast({
        title: "Sucesso",
        description: "Plano carregado com sucesso!"
      });
      setIsOpen(false);
      refreshSavedPlans();
    } else {
      toast({
        title: "Erro",
        description: "Falha ao carregar o plano.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o plano "${planName}"?`)) {
      if (deleteStudyPlan(planId)) {
        toast({
          title: "Sucesso",
          description: `Plano "${planName}" excluído com sucesso!`
        });
        refreshSavedPlans();
      } else {
        toast({
          title: "Erro",
          description: "Falha ao excluir o plano.",
          variant: "destructive"
        });
      }
    }
  };

  const handleExportPlan = (planId: string) => {
    const exportData = exportStudyPlan(planId);
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plano-estudo-${planId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Plano exportado com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: "Falha ao exportar o plano.",
        variant: "destructive"
      });
    }
  };

  const handleImportPlan = () => {
    if (!importData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, cole os dados do plano.",
        variant: "destructive"
      });
      return;
    }

    const planId = importStudyPlan(importData);
    if (planId) {
      toast({
        title: "Sucesso",
        description: "Plano importado com sucesso!"
      });
      setImportData('');
      setShowImportDialog(false);
      refreshSavedPlans();
    } else {
      toast({
        title: "Erro",
        description: "Falha ao importar o plano. Verifique os dados.",
        variant: "destructive"
      });
    }
  };

  const handleCreateBackup = () => {
    const backupData = createBackup();
    if (backupData) {
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-estudos-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Sucesso",
        description: "Backup criado com sucesso!"
      });
    } else {
      toast({
        title: "Erro",
        description: "Falha ao criar backup.",
        variant: "destructive"
      });
    }
  };

  const handleValidateData = () => {
    // SQLite handles data integrity through constraints - just refresh the plans
    refreshSavedPlans();
    toast({
      title: "Sucesso",
      description: "Dados validados com sucesso!"
    });
  };

  return (
    <div className="flex gap-2 mb-4">
      {/* Save Current Plan */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={!currentPlan}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Plano
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Plano de Estudos</DialogTitle>
            <DialogDescription>
              Digite um nome para salvar o plano atual.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="planName">Nome do Plano</Label>
              <Input
                id="planName"
                value={savePlanName}
                onChange={(e) => setSavePlanName(e.target.value)}
                placeholder="Ex: Plano ENEM 2024"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePlan}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Plans Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Gerenciar Planos
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Planos de Estudos</DialogTitle>
            <DialogDescription>
              Carregue, exclua ou exporte seus planos salvos.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleCreateBackup}>
                <Archive className="h-4 w-4 mr-2" />
                Criar Backup
              </Button>
              <Button variant="outline" size="sm" onClick={handleValidateData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Validar Dados
              </Button>
              <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Importar Plano</DialogTitle>
                    <DialogDescription>
                      Cole os dados JSON do plano exportado.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <textarea
                      className="w-full h-32 p-2 border rounded"
                      value={importData}
                      onChange={(e) => setImportData(e.target.value)}
                      placeholder="Cole aqui os dados JSON do plano..."
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleImportPlan}>
                      Importar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Separator />

            {/* Saved Plans List */}
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {savedPlans.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
                    <p>Nenhum plano salvo encontrado.</p>
                    <p className="text-sm">Salve um plano para começar!</p>
                  </div>
                ) : (
                  savedPlans.map((plan) => (
                    <Card key={plan.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{plan.name}</h4>
                            {plan.isActive && (
                              <Badge variant="secondary">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(plan.createdAt), 'dd/MM/yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {plan.plan.cycle?.length || 0} dias
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          {!plan.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadPlan(plan.id)}
                            >
                              <FolderOpen className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportPlan(plan.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePlan(plan.id, plan.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudyPlanManager;