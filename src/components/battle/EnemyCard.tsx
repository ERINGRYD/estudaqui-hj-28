import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sword, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  FileText, 
  Calendar,
  Trophy,
  Zap
} from 'lucide-react';
import { Enemy } from '@/types/enemy';
import { cn } from '@/lib/utils';

interface EnemyCardProps {
  enemy: Enemy;
  onBattle: (enemy: Enemy) => void;
}

const getRoomIcon = (room: string) => {
  switch (room) {
    case 'triagem':
      return Target;
    case 'vermelha':
      return AlertTriangle;
    case 'amarela':
      return Target;
    case 'verde':
      return CheckCircle;
    default:
      return Target;
  }
};

const getRoomGradient = (room: string) => {
  switch (room) {
    case 'triagem':
      return 'from-gray-500 to-gray-600';
    case 'vermelha':
      return 'from-red-500 to-red-600';
    case 'amarela':
      return 'from-yellow-500 to-yellow-600';
    case 'verde':
      return 'from-green-500 to-green-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

const getRoomName = (room: string) => {
  switch (room) {
    case 'triagem':
      return 'Triagem';
    case 'vermelha':
      return 'Crítico';
    case 'amarela':
      return 'Desenvolvimento';
    case 'verde':
      return 'Dominado';
    default:
      return room;
  }
};

export const EnemyCard: React.FC<EnemyCardProps> = ({ enemy, onBattle }) => {
  const RoomIcon = getRoomIcon(enemy.room);
  const roomGradient = getRoomGradient(enemy.room);
  const roomName = getRoomName(enemy.room);
  
  const formatDate = (date?: Date) => {
    if (!date) return 'Nunca';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  };

  const getStatusMessage = () => {
    if (enemy.questionsAnswered === 0) {
      return 'Pronto para primeira batalha!';
    }
    
    if (enemy.room === 'verde') {
      return 'Inimigo dominado! Continue praticando para manter o domínio.';
    }
    
    if (enemy.room === 'vermelha') {
      return 'Estado crítico! Este inimigo precisa de atenção urgente.';
    }
    
    return 'Em desenvolvimento. Continue lutando para dominar este inimigo!';
  };

  return (
    <Card className={cn(
      "relative overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer",
      "border-l-4",
      enemy.room === 'triagem' && "border-l-gray-500",
      enemy.room === 'vermelha' && "border-l-red-500",
      enemy.room === 'amarela' && "border-l-yellow-500",
      enemy.room === 'verde' && "border-l-green-500"
    )}>
      {/* Background gradient effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r opacity-5 group-hover:opacity-10 transition-opacity",
        roomGradient
      )} />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: enemy.subjectColor }}
            />
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                {enemy.topicName}
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    enemy.room === 'triagem' && "border-gray-500 text-gray-600",
                    enemy.room === 'vermelha' && "border-red-500 text-red-600",
                    enemy.room === 'amarela' && "border-yellow-500 text-yellow-600",
                    enemy.room === 'verde' && "border-green-500 text-green-600"
                  )}
                >
                  <RoomIcon className="h-3 w-3 mr-1" />
                  {roomName}
                </Badge>
              </CardTitle>
              <CardDescription className="text-sm">
                {enemy.subjectName}
              </CardDescription>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBattle(enemy)}
            className={cn(
              "gap-2 hover:scale-105 transition-transform",
              enemy.room === 'vermelha' && "border-red-500 text-red-600 hover:bg-red-50",
              enemy.room === 'amarela' && "border-yellow-500 text-yellow-600 hover:bg-yellow-50",
              enemy.room === 'verde' && "border-green-500 text-green-600 hover:bg-green-50"
            )}
          >
            <Sword className="h-4 w-4" />
            Batalhar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Questões</span>
            </div>
            <p className="text-lg font-bold">{enemy.totalQuestions}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Acertos</span>
            </div>
            <p className="text-lg font-bold">
              {enemy.questionsAnswered > 0 ? `${enemy.questionsCorrect}/${enemy.questionsAnswered}` : '0/0'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
            <p className="text-lg font-bold">{enemy.totalXpEarned}</p>
          </div>
        </div>

        {/* Accuracy Rate Progress */}
        {enemy.questionsAnswered > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Taxa de Acerto</span>
              <Badge 
                variant={enemy.accuracyRate >= 85 ? 'default' : 
                       enemy.accuracyRate >= 70 ? 'secondary' : 'destructive'}
              >
                {enemy.accuracyRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress 
              value={enemy.accuracyRate} 
              className={cn(
                "h-2",
                enemy.room === 'vermelha' && "[&>div]:bg-red-500",
                enemy.room === 'amarela' && "[&>div]:bg-yellow-500",
                enemy.room === 'verde' && "[&>div]:bg-green-500"
              )}
            />
          </div>
        )}

        {/* Last Battle Date */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Última batalha:</span>
          </div>
          <span className="font-medium">{formatDate(enemy.lastBattleDate)}</span>
        </div>

        {/* Status Message */}
        <div className={cn(
          "text-xs p-2 rounded-md",
          enemy.room === 'triagem' && "bg-gray-50 text-gray-700",
          enemy.room === 'vermelha' && "bg-red-50 text-red-700",
          enemy.room === 'amarela' && "bg-yellow-50 text-yellow-700",
          enemy.room === 'verde' && "bg-green-50 text-green-700"
        )}>
          {getStatusMessage()}
        </div>
      </CardContent>
    </Card>
  );
};