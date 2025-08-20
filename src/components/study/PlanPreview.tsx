import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ArrowRight, Calendar, BookOpen, Target, CheckCircle2 } from 'lucide-react';
import { StudyPlan } from '@/types/study';

interface PlanPreviewProps {
  studyPlan: StudyPlan;
  examDate?: Date;
  onBack: () => void;
  onContinue: () => void;
}

const PlanPreview: React.FC<PlanPreviewProps> = ({
  studyPlan,
  examDate,
  onBack,
  onContinue
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const daysUntilExam = examDate ? Math.ceil((examDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="h-5 w-5 text-study-primary" />
          <span>Prévia do seu Plano de Estudos</span>
        </CardTitle>
        <CardDescription>
          Confira como seu plano foi organizado antes de finalizar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Informações gerais do plano */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-study-secondary/20 p-4 rounded-lg border border-study-primary/20">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-study-primary" />
                <span className="text-sm font-medium">Data do Exame</span>
              </div>
              <div className="text-lg font-bold text-study-primary">
                {examDate ? formatDate(examDate) : 'Não definida'}
              </div>
              {examDate && (
                <div className="text-sm text-muted-foreground">
                  {daysUntilExam} dias restantes
                </div>
              )}
            </div>

            <div className="bg-study-secondary/20 p-4 rounded-lg border border-study-primary/20">
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-4 w-4 text-study-accent" />
                <span className="text-sm font-medium">Disciplinas</span>
              </div>
              <div className="text-lg font-bold text-study-accent">
                {studyPlan.subjects.length}
              </div>
              <div className="text-sm text-muted-foreground">
                matérias selecionadas
              </div>
            </div>

            <div className="bg-study-secondary/20 p-4 rounded-lg border border-study-primary/20">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-study-success" />
                <span className="text-sm font-medium">Horas Totais</span>
              </div>
              <div className="text-lg font-bold text-study-success">
                {studyPlan.totalHours}h
              </div>
              <div className="text-sm text-muted-foreground">
                planejadas
              </div>
            </div>
          </div>

          {/* Lista de disciplinas */}
          <div>
            <h3 className="font-medium text-study-primary mb-3">Disciplinas incluídas:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {studyPlan.subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="font-medium">{subject.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {subject.level || 'intermediário'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Áreas de foco */}
          {studyPlan.focusAreas && studyPlan.focusAreas.length > 0 && (
            <div>
              <h3 className="font-medium text-study-primary mb-3">Áreas de foco prioritário:</h3>
              <div className="flex flex-wrap gap-2">
                {studyPlan.focusAreas.map((area, index) => (
                  <Badge key={index} variant="outline" className="border-study-primary text-study-primary">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Informação sobre finalização */}
          <div className="bg-study-success/10 p-4 rounded-lg border border-study-success/20">
            <h3 className="font-medium text-study-success mb-2">Pronto para finalizar!</h3>
            <p className="text-sm text-muted-foreground">
              Seu plano de estudos está completo com todas as configurações personalizadas. 
              Clique em "Finalizar e Criar Plano" para começar a estudar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Voltar para Timer
            </Button>
            
            <Button 
              onClick={onContinue}
              className="flex items-center space-x-2 bg-study-primary hover:bg-study-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Finalizar e Criar Plano</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanPreview;