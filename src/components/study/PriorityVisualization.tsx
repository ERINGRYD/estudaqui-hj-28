import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, TrendingUp, Brain, Target } from 'lucide-react';
import { StudyTopic, PriorityLevel } from '@/types/study';
import { getPriorityLevel } from '@/utils/priorityCalculation';

interface PriorityVisualizationProps {
  topic: StudyTopic;
  showBreakdown?: boolean;
  compact?: boolean;
}

const priorityConfig = {
  [PriorityLevel.CRITICAL]: {
    color: 'hsl(var(--destructive))',
    bgColor: 'hsl(var(--destructive) / 0.1)',
    icon: AlertTriangle,
    label: 'Crítico',
    emoji: '🔴'
  },
  [PriorityLevel.IMPORTANT]: {
    color: 'hsl(var(--warning))',
    bgColor: 'hsl(var(--warning) / 0.1)', 
    icon: TrendingUp,
    label: 'Importante',
    emoji: '🟡'
  },
  [PriorityLevel.MODERATE]: {
    color: 'hsl(var(--success))',
    bgColor: 'hsl(var(--success) / 0.1)',
    icon: Target,
    label: 'Moderado', 
    emoji: '🟢'
  },
  [PriorityLevel.UNDEFINED]: {
    color: 'hsl(var(--muted-foreground))',
    bgColor: 'hsl(var(--muted) / 0.1)',
    icon: Clock,
    label: 'Não definido',
    emoji: '⚪'
  }
};

const PriorityBadge: React.FC<{ level: PriorityLevel; score?: number; compact?: boolean }> = ({ 
  level, 
  score, 
  compact 
}) => {
  const config = priorityConfig[level];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline"
            className="flex items-center space-x-1"
            style={{ 
              borderColor: config.color,
              color: config.color,
              backgroundColor: config.bgColor
            }}
          >
            {!compact && <Icon className="h-3 w-3" />}
            <span>{config.emoji}</span>
            {!compact && <span>{config.label}</span>}
            {score !== undefined && (
              <span className="ml-1 font-mono text-xs">
                {score.toFixed(1)}
              </span>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <div className="font-medium">{config.label}</div>
            {score !== undefined && (
              <div className="text-xs text-muted-foreground">
                Score: {score.toFixed(2)}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const PriorityBreakdown: React.FC<{ topic: StudyTopic }> = ({ topic }) => {
  const weight = topic.weight || 1;
  const calculatedPriority = topic.calculatedPriority || 0;
  
  return (
    <Card className="mt-3">
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-1">
              <Brain className="h-3 w-3" />
              <span>Peso Base</span>
            </span>
            <span className="font-medium">{weight}/10</span>
          </div>
          <Progress value={weight * 10} className="h-1" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>Prioridade Calculada</span>
            </span>
            <span className="font-medium">{calculatedPriority.toFixed(1)}</span>
          </div>
          <Progress value={Math.min(calculatedPriority * 5, 100)} className="h-1" />
          
          {topic.weightReason && (
            <div className="text-xs text-muted-foreground">
              Último ajuste: {getWeightReasonLabel(topic.weightReason)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const getWeightReasonLabel = (reason: string): string => {
  const labels: Record<string, string> = {
    'low_performance': 'Baixa performance',
    'high_performance': 'Alta performance', 
    'not_studied_recently': 'Não estudado recentemente',
    'exam_proximity': 'Proximidade do exame',
    'manual_adjustment': 'Ajuste manual',
    'auto_rebalance': 'Rebalanceamento automático'
  };
  
  return labels[reason] || reason;
};

const PriorityVisualization: React.FC<PriorityVisualizationProps> = ({ 
  topic, 
  showBreakdown = false, 
  compact = false 
}) => {
  const priority = topic.calculatedPriority || 0;
  const level = getPriorityLevel(priority);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <PriorityBadge 
          level={level} 
          score={priority} 
          compact={compact} 
        />
        
        {topic.autoWeightAdjustment !== undefined && topic.autoWeightAdjustment !== 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="text-xs">
                  Auto: {topic.autoWeightAdjustment > 0 ? '+' : ''}{topic.autoWeightAdjustment}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div>Ajuste automático sugerido</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {showBreakdown && <PriorityBreakdown topic={topic} />}
    </div>
  );
};

export default PriorityVisualization;