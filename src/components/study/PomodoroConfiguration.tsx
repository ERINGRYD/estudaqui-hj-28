import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer, ArrowLeft, ArrowRight } from 'lucide-react';
import { PomodoroSettings } from '@/types/study';
import TimerSettings from './TimerSettings';

interface PomodoroConfigurationProps {
  pomodoroSettings: PomodoroSettings;
  weeklyHours: number;
  onPomodoroSettingChange: (field: keyof PomodoroSettings, value: number | boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

const PomodoroConfiguration: React.FC<PomodoroConfigurationProps> = ({
  pomodoroSettings,
  weeklyHours,
  onPomodoroSettingChange,
  onBack,
  onNext
}) => {
  const dailyAverage = Math.round((weeklyHours / 7) * 10) / 10;
  const sessionsPerDay = Math.round(dailyAverage / (pomodoroSettings.studyTime / 60));

  const handleSave = () => {
    // No additional save logic needed here as settings are managed by parent
    onNext();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Timer className="h-5 w-5 text-study-primary" />
          <span>Configuração do Timer Pomodoro</span>
        </CardTitle>
        <CardDescription>
          Configure os tempos do seu timer Pomodoro para maximizar sua produtividade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="font-medium text-study-primary mb-4">
              Configure seu Timer Pomodoro
            </h3>
            
            <TimerSettings
              pomodoroSettings={pomodoroSettings}
              onSettingChange={onPomodoroSettingChange}
              onSave={handleSave}
              onCancel={() => {}}
            />
          </div>

          {/* Resumo integrado */}
          <div className="bg-study-secondary/20 p-4 rounded-lg border border-study-primary/20">
            <h4 className="font-medium text-study-primary mb-3">Estimativa de sessões diárias:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Horas por dia</div>
                <div className="font-bold text-lg text-study-accent">{dailyAverage}h</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Sessões Pomodoro/dia</div>
                <div className="font-bold text-lg text-study-success">~{sessionsPerDay}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tempo por sessão</div>
                <div className="font-bold text-lg text-study-primary">{pomodoroSettings.studyTime / 60}min</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            
            <Button 
              onClick={onNext}
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

export default PomodoroConfiguration;