import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Settings } from 'lucide-react';
import HierarchicalTopicSelector from './HierarchicalTopicSelector';
import { StudySubject, StudySession, PomodoroSettings } from '@/types/study';
interface PomodoroTimerProps {
  subjects: StudySubject[];
  currentSubject: string;
  currentTopic: string;
  currentSubtopic: string;
  timer: number;
  isTimerRunning: boolean;
  timerMode: 'study' | 'break';
  currentSession: StudySession | null;
  pomodoroSettings: PomodoroSettings;
  onStartTimer: (subject: string, topic?: string, subtopic?: string, taskId?: string) => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  onBackToPlanner: () => void;
  onOpenSettings: () => void;
}
const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  subjects,
  currentSubject,
  currentTopic,
  currentSubtopic,
  timer,
  isTimerRunning,
  timerMode,
  currentSession,
  pomodoroSettings,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer,
  onBackToPlanner,
  onOpenSettings
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  return <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-6xl sm:text-8xl font-mono font-bold text-foreground mb-8">
              {formatTime(timer)}
            </div>
            
            <div className="mb-8">
              <Progress value={timerMode === 'study' ? (pomodoroSettings.studyTime - timer) / pomodoroSettings.studyTime * 100 : (pomodoroSettings.breakTime - timer) / pomodoroSettings.breakTime * 100} className="h-4" />
            </div>

            <div className="flex justify-center space-x-4 mb-6">
              {!isTimerRunning && timer === 0 ? <div className="w-full">
                  <HierarchicalTopicSelector subjects={subjects} onStartSession={onStartTimer} />
                </div> : <div className="flex flex-wrap justify-center gap-4">
                  {isTimerRunning ? <Button onClick={onPauseTimer} size="lg" variant="outline">
                      ⏸️ Pausar
                    </Button> : <Button onClick={onResumeTimer} size="lg" className="bg-study-primary hover:bg-study-primary/90">
                      ▶️ Continuar
                    </Button>}
                  <Button onClick={onStopTimer} size="lg" variant="destructive">
                    ⏹️ Parar
                  </Button>
                  {timerMode === 'break' && <Button onClick={() => {
                onStopTimer();
              }} size="lg" variant="outline">
                      Pular Intervalo
                    </Button>}
                </div>}
            </div>

            {currentSession && <div className="text-sm text-muted-foreground">
                Iniciado às {currentSession.startTime.toLocaleTimeString()}
              </div>}
          </div>
        </CardContent>
      </Card>

      
    </div>;
};
export default PomodoroTimer;