
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings, CheckCircle2 } from 'lucide-react';
import { PomodoroSettings } from '@/types/study';

interface TimerSettingsProps {
  pomodoroSettings: PomodoroSettings;
  onSettingChange: (field: keyof PomodoroSettings, value: number | boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

const TimerSettings: React.FC<TimerSettingsProps> = ({
  pomodoroSettings,
  onSettingChange,
  onSave,
  onCancel
}) => {
  const handleTimerSettingChange = (field: keyof PomodoroSettings, value: number | boolean) => {
    if (typeof value === 'number' && value <= 0) return;
    
    onSettingChange(field, field.includes('Time') && typeof value === 'number' ? value * 60 : value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-study-primary" />
          <span>Configurações do Timer</span>
        </CardTitle>
        <CardDescription>
          Personalize os tempos do seu Pomodoro e preferências de estudo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="studyTime" className="text-base font-medium">
                Tempo de Estudo (minutos)
              </Label>
              <div className="mt-2">
                <input
                  id="studyTime"
                  type="number"
                  min="1"
                  max="120"
                  value={pomodoroSettings.studyTime / 60}
                  onChange={(e) => handleTimerSettingChange('studyTime', parseInt(e.target.value) || 25)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-study-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="breakTime" className="text-base font-medium">
                Intervalo Curto (minutos)
              </Label>
              <div className="mt-2">
                <input
                  id="breakTime"
                  type="number"
                  min="1"
                  max="30"
                  value={pomodoroSettings.breakTime / 60}
                  onChange={(e) => handleTimerSettingChange('breakTime', parseInt(e.target.value) || 5)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-study-primary focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="longBreakTime" className="text-base font-medium">
                Intervalo Longo (minutos)
              </Label>
              <div className="mt-2">
                <input
                  id="longBreakTime"
                  type="number"
                  min="1"
                  max="60"
                  value={pomodoroSettings.longBreakTime / 60}
                  onChange={(e) => handleTimerSettingChange('longBreakTime', parseInt(e.target.value) || 15)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-study-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="sessionsUntilLongBreak" className="text-base font-medium">
              Sessões até Intervalo Longo
            </Label>
            <div className="mt-2">
              <input
                id="sessionsUntilLongBreak"
                type="number"
                min="2"
                max="8"
                value={pomodoroSettings.sessionsUntilLongBreak}
                onChange={(e) => handleTimerSettingChange('sessionsUntilLongBreak', parseInt(e.target.value) || 4)}
                className="w-full max-w-xs p-2 border rounded-md focus:ring-2 focus:ring-study-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-4">Prévia das Configurações:</h3>
            <div className="bg-study-secondary/20 p-4 rounded-lg border border-study-primary/20">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Sessão de Estudo</div>
                  <div className="font-bold text-lg text-study-primary">{pomodoroSettings.studyTime / 60} minutos</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Intervalo Curto</div>
                  <div className="font-bold text-lg text-study-accent">{pomodoroSettings.breakTime / 60} minutos</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Intervalo Longo</div>
                  <div className="font-bold text-lg text-study-success">{pomodoroSettings.longBreakTime / 60} minutos</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Sessões até Intervalo Longo</div>
                  <div className="font-bold text-lg text-study-warning">{pomodoroSettings.sessionsUntilLongBreak}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Cancelar
            </Button>
            
            <Button 
              onClick={onSave}
              className="flex items-center space-x-2 bg-study-primary hover:bg-study-primary/90"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Salvar Configurações</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimerSettings;
