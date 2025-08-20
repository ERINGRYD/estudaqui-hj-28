import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Target } from 'lucide-react';
import type { UserProgress } from '@/types/battle';

interface UserProgressWidgetProps {
  progress: UserProgress;
}

const UserProgressWidget: React.FC<UserProgressWidgetProps> = ({ progress }) => {
  const xpProgress = progress.xpForNextLevel > 0 
    ? ((progress.totalXp % progress.xpForNextLevel) / progress.xpForNextLevel) * 100 
    : 0;

  return (
    <Card className="w-80">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-full bg-gradient-to-r from-yellow-500 to-red-500">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-semibold">Nível {progress.currentLevel}</p>
              <p className="text-sm text-muted-foreground">{progress.totalXp} XP Total</p>
            </div>
          </div>
          <Badge variant="secondary">
            Guerreiro
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span>Progresso para o próximo nível</span>
            <span>{Math.floor(xpProgress)}%</span>
          </div>
          <Progress value={xpProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {progress.xpForNextLevel} XP para o nível {progress.currentLevel + 1}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="flex items-center justify-center mb-1">
              <Trophy className="h-3 w-3 text-yellow-500" />
            </div>
            <p className="text-lg font-bold text-primary">{progress.battlesWon}</p>
            <p className="text-xs text-muted-foreground">Vitórias</p>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <Target className="h-3 w-3 text-green-500" />
            </div>
            <p className="text-lg font-bold text-primary">
              {progress.questionsAnswered > 0 
                ? Math.round((progress.questionsCorrect / progress.questionsAnswered) * 100)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground">Precisão</p>
          </div>
          <div>
            <div className="flex items-center justify-center mb-1">
              <Zap className="h-3 w-3 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-primary">{progress.questionsAnswered}</p>
            <p className="text-xs text-muted-foreground">Questões</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProgressWidget;