
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { BarChart3, Shuffle, Target, BookOpen, Settings, Info } from 'lucide-react';
import { StudySubject, StudyPlan } from '@/types/study';

interface CycleConfigurationProps {
  studyPlan: StudyPlan;
  subjects: StudySubject[];
  subjectLevels: Record<string, string>;
  onUpdatePlan: (updatedPlan: StudyPlan) => void;
  onRegenerateCycle: (config: CycleConfig) => void;
}

interface CycleConfig {
  forceAllSubjects: boolean;
  subjectsPerCycle: number;
  rotationIntensity: number;
  focusMode: 'balanced' | 'priority' | 'difficulty';
  avoidConsecutive: boolean;
}

const CycleConfiguration: React.FC<CycleConfigurationProps> = ({
  studyPlan,
  subjects,
  subjectLevels,
  onUpdatePlan,
  onRegenerateCycle
}) => {
  const [config, setConfig] = useState<CycleConfig>({
    forceAllSubjects: true,
    subjectsPerCycle: subjects.length,
    rotationIntensity: 70,
    focusMode: 'balanced',
    avoidConsecutive: true
  });

  const handleConfigChange = (key: keyof CycleConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    
    // Auto-adjust subjects per cycle when force all subjects changes
    if (key === 'forceAllSubjects' && value === true) {
      newConfig.subjectsPerCycle = subjects.length;
    }
    
    setConfig(newConfig);
  };

  const getSubjectDistribution = () => {
    if (!studyPlan.cycle) return {};
    
    const distribution: Record<string, number> = {};
    studyPlan.cycle.forEach((day: any) => {
      distribution[day.subject] = (distribution[day.subject] || 0) + 1;
    });
    
    return distribution;
  };

  const getDistributionAnalysis = () => {
    const distribution = getSubjectDistribution();
    const totalDays = studyPlan.cycle?.length || 0;
    const subjectCount = Object.keys(distribution).length;
    const expectedPerSubject = totalDays / subjectCount;
    
    let variance = 0;
    Object.values(distribution).forEach(count => {
      variance += Math.pow(count - expectedPerSubject, 2);
    });
    variance = variance / subjectCount;
    
    const balanceScore = Math.max(0, 100 - (variance * 10));
    
    return {
      distribution,
      totalDays,
      subjectCount,
      expectedPerSubject,
      balanceScore: Math.round(balanceScore),
      variance: Math.round(variance * 10) / 10
    };
  };

  const analysis = getDistributionAnalysis();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-study-primary" />
            <span>Configuração Avançada do Ciclo</span>
          </CardTitle>
          <CardDescription>
            Configure como as matérias são distribuídas no seu ciclo de estudos de forma inteligente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strategy Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Estratégia de Distribuição</span>
            </Label>
            <Select
              value={config.focusMode}
              onValueChange={(value: 'balanced' | 'priority' | 'difficulty') => 
                handleConfigChange('focusMode', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Equilibrada</div>
                      <div className="text-xs text-muted-foreground">Todas as matérias com frequência similar</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="priority">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Por Prioridade</div>
                      <div className="text-xs text-muted-foreground">Matérias com maior prioridade aparecem mais</div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="difficulty">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Por Dificuldade</div>
                      <div className="text-xs text-muted-foreground">Matérias mais difíceis (iniciante) aparecem mais</div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Subject Coverage */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="force-all-subjects" className="text-base font-medium">
                Incluir todas as matérias
              </Label>
              <Switch
                id="force-all-subjects"
                checked={config.forceAllSubjects}
                onCheckedChange={(checked) => handleConfigChange('forceAllSubjects', checked)}
              />
            </div>
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                {config.forceAllSubjects 
                  ? 'Todas as matérias selecionadas aparecerão pelo menos uma vez no ciclo'
                  : 'Apenas as matérias mais prioritárias aparecerão no ciclo'
                }
              </span>
            </div>
          </div>

          {/* Subjects Per Cycle */}
          {!config.forceAllSubjects && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Matérias no Ciclo: {config.subjectsPerCycle} de {subjects.length}
                </Label>
                <Slider
                  value={[config.subjectsPerCycle]}
                  onValueChange={([value]) => handleConfigChange('subjectsPerCycle', value)}
                  max={subjects.length}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Mínimo (1)</span>
                  <span>Todas ({subjects.length})</span>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Rotation Intensity */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Intensidade de Rotação: {config.rotationIntensity}%
            </Label>
            <Slider
              value={[config.rotationIntensity]}
              onValueChange={([value]) => handleConfigChange('rotationIntensity', value)}
              max={100}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Baixa (mais repetição das prioritárias)</span>
              <span>Alta (mais variedade)</span>
            </div>
          </div>

          <Separator />

          {/* Avoid Consecutive */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="avoid-consecutive" className="text-base font-medium">
                Evitar matérias consecutivas
              </Label>
              <Switch
                id="avoid-consecutive"
                checked={config.avoidConsecutive}
                onCheckedChange={(checked) => handleConfigChange('avoidConsecutive', checked)}
              />
            </div>
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                O sistema tentará evitar que a mesma matéria apareça em dias consecutivos, 
                mas priorizará o balanceamento geral
              </span>
            </div>
          </div>

          <Separator />

          {/* Regenerate Button */}
          <div className="space-y-4">
            <Button
              onClick={() => onRegenerateCycle(config)}
              className="w-full bg-study-primary hover:bg-study-primary/90"
              size="lg"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Regenerar Ciclo com Nova Configuração
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              Clique para aplicar as novas configurações ao seu ciclo de estudos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Distribution Analysis */}
      {Object.keys(analysis.distribution).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Análise da Distribuição Atual</span>
              <Badge variant={analysis.balanceScore >= 80 ? "default" : analysis.balanceScore >= 60 ? "secondary" : "destructive"}>
                {analysis.balanceScore}% Balanceado
              </Badge>
            </CardTitle>
            <CardDescription>
              Ciclo de {analysis.totalDays} dias • {analysis.subjectCount} matérias incluídas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Subject Distribution */}
              <div className="space-y-3">
                {Object.entries(analysis.distribution)
                  .sort(([,a], [,b]) => b - a)
                  .map(([subject, count]) => {
                    const percentage = Math.round((count / analysis.totalDays) * 100);
                    const subjectData = subjects.find(s => s.name === subject);
                    const isBalanced = Math.abs(count - analysis.expectedPerSubject) <= 1;
                    
                    return (
                      <div key={subject} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: subjectData?.color || '#8884d8' }}
                            />
                            <span className="font-medium">{subject}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={isBalanced ? "default" : "secondary"}>
                              {count} dias ({percentage}%)
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-study-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Balance Indicators */}
              <div className="pt-4 border-t space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-study-secondary/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Cobertura</div>
                    <div className="font-bold text-lg text-study-primary">
                      {analysis.subjectCount}/{subjects.length}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-study-secondary/20 rounded-lg">
                    <div className="text-sm text-muted-foreground">Variação</div>
                    <div className="font-bold text-lg text-study-accent">
                      ±{analysis.variance}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <Badge 
                    variant={analysis.subjectCount === subjects.length ? "default" : "destructive"}
                    className="text-sm"
                  >
                    {analysis.subjectCount === subjects.length 
                      ? "✅ Todas as matérias incluídas" 
                      : `⚠️ ${subjects.length - analysis.subjectCount} matérias ausentes`
                    }
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CycleConfiguration;
