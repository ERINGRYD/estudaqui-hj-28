
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import PomodoroTimer from '@/components/study/PomodoroTimer';
import StudySessionHistory from '@/components/study/StudySessionHistory';
import StudyStatistics from '@/components/study/StudyStatistics';
import TimerSettings from '@/components/study/TimerSettings';
import SaveStudySessionModal from '@/components/study/SaveStudySessionModal';
import { StudySubject, StudySession, PomodoroSettings } from '@/types/study';
import { useStudyContext } from '@/contexts/StudyContext';
import { loadTypedSetting, saveTypedSetting } from '@/utils/sqlitePersistence';


const StudySessionPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    studySessions,
    setStudySessions,
    subjects,
    studyPlan,
    setStudyPlan
  } = useStudyContext();


  // Timer states
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentSubtopic, setCurrentSubtopic] = useState('');
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Pause tracking states
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPauseTime, setTotalPauseTime] = useState(0); // in seconds
  
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    studyTime: 25 * 60,
    breakTime: 5 * 60,
    longBreakTime: 15 * 60,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartSessions: false,
    soundEnabled: true
  });

const [showSaveModal, setShowSaveModal] = useState(false);
const [pendingSession, setPendingSession] = useState<StudySession | null>(null);
const [pendingNetSeconds, setPendingNetSeconds] = useState<number>(0);
const [pendingPauseSeconds, setPendingPauseSeconds] = useState<number>(0);

const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Load Pomodoro settings from database on component mount
  useEffect(() => {
    const loadPomodoroSettings = () => {
      const studyTime = loadTypedSetting('pomodoro_study_time', 25 * 60);
      const breakTime = loadTypedSetting('pomodoro_break_time', 5 * 60);
      const longBreakTime = loadTypedSetting('pomodoro_long_break_time', 15 * 60);
      const sessionsUntilLongBreak = loadTypedSetting('pomodoro_sessions_until_long_break', 4);
      const autoStartBreaks = loadTypedSetting('pomodoro_auto_start_breaks', false);
      const autoStartSessions = loadTypedSetting('pomodoro_auto_start_sessions', false);
      const soundEnabled = loadTypedSetting('pomodoro_sound_enabled', true);

      setPomodoroSettings({
        studyTime,
        breakTime,
        longBreakTime,
        sessionsUntilLongBreak,
        autoStartBreaks,
        autoStartSessions,
        soundEnabled
      });
    };

    loadPomodoroSettings();
  }, []);

  // Initialize session from URL parameters
  useEffect(() => {
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const subtopic = searchParams.get('subtopic');
    const taskId = searchParams.get('taskId');
    const autoStart = searchParams.get('autoStart') === 'true';

    if (subject && autoStart) {
      startTimer(subject, topic || '', subtopic || '', taskId || '');
    } else if (subject) {
      setCurrentSubject(subject);
      setCurrentTopic(topic || '');
      setCurrentSubtopic(subtopic || '');
    }
  }, [searchParams]);

  const startTimer = (subject: string, topic?: string, subtopic?: string, taskId?: string) => {
    if (!subject) return;
    
    setCurrentSubject(subject);
    setCurrentTopic(topic || '');
    setCurrentSubtopic(subtopic || '');
    setTimer(pomodoroSettings.studyTime);
    setTimerMode('study');
    setIsTimerRunning(true);
    setTotalPauseTime(0); // Reset pause time for new session
    setPauseStartTime(null);
    setCurrentSession({
      id: Date.now().toString(),
      subject,
      topic,
      subtopic,
      startTime: new Date(),
      duration: 0,
      completed: false,
      taskId
    });
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    setPauseStartTime(new Date()); // Mark pause start time
  };

  const resumeTimer = () => {
    if (pauseStartTime) {
      // Calculate pause duration and add to total
      const pauseDuration = Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);
      setTotalPauseTime(prev => prev + pauseDuration);
      setPauseStartTime(null);
    }
    setIsTimerRunning(true);
  };

const stopTimer = () => {
  let finalPauseTime = totalPauseTime;
  
  // If currently paused, add the current pause duration
  if (pauseStartTime) {
    const currentPauseDuration = Math.floor((new Date().getTime() - pauseStartTime.getTime()) / 1000);
    finalPauseTime += currentPauseDuration;
  }

  if (currentSession) {
    const endTime = new Date();
    const totalDuration = Math.floor((endTime.getTime() - currentSession.startTime.getTime()) / 1000);
    const netDuration = totalDuration - finalPauseTime; // Net study time
    
    const completedSession: StudySession = {
      ...currentSession,
      endTime,
      duration: Math.floor(netDuration / 60), // Store net duration in minutes
      completed: false
    };
    
    setPendingSession(completedSession);
    setPendingNetSeconds(netDuration);
    setPendingPauseSeconds(finalPauseTime);
    setShowSaveModal(true);
  }
  
  setIsTimerRunning(false);
  setTimer(0);
  setCurrentSession(null);
  setCurrentSubject('');
  setCurrentTopic('');
  setCurrentSubtopic('');
  setTotalPauseTime(0);
  setPauseStartTime(null);
};

  const handleTimerSettingChange = (field: keyof PomodoroSettings, value: number | boolean) => {
    setPomodoroSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Timer countdown logic
  useEffect(() => {
    if (isTimerRunning && timer > 0) {
      timerInterval.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (timerMode === 'study') {
              const isLongBreak = (completedSessions + 1) % pomodoroSettings.sessionsUntilLongBreak === 0;
              const breakTime = isLongBreak ? pomodoroSettings.longBreakTime : pomodoroSettings.breakTime;
              
              if (currentSession) {
                // For completed sessions, use the full study time as net time (no pause tracking during completed sessions)
                const completedSession: StudySession = {
                  ...currentSession,
                  endTime: new Date(),
                  duration: pomodoroSettings.studyTime / 60,
                  completed: true
                };
                setPendingSession(completedSession);
                setPendingNetSeconds(pomodoroSettings.studyTime);
                setPendingPauseSeconds(totalPauseTime);
                setShowSaveModal(true);
                setCompletedSessions(prev => prev + 1);
                
                // Auto-mark topic/subtopic as completed after successful session
                setTimeout(() => {
                  if (studyPlan && currentSession.topic) {
                    const updatedPlan = {
                      ...studyPlan,
                      subjects: studyPlan.subjects.map(subject =>
                        subject.name === currentSession.subject
                          ? {
                              ...subject,
                              topics: subject.topics?.map(topic =>
                                topic.name === currentSession.topic
                                  ? currentSession.subtopic
                                    ? {
                                        ...topic,
                                        subtopics: topic.subtopics?.map(subtopic =>
                                          subtopic.name === currentSession.subtopic
                                            ? { ...subtopic, completed: true }
                                            : subtopic
                                        )
                                      }
                                    : { ...topic, completed: true }
                                  : topic
                              )
                            }
                          : subject
                      )
                    };
                    setStudyPlan(updatedPlan);
                  }
                }, 0);
              }
              
              setTimerMode('break');
              setTotalPauseTime(0); // Reset pause time for break
              setPauseStartTime(null);
              return breakTime;
            } else {
              // Break finished - stop timer
              setTimerMode('study');
              setCurrentSession(null);
              setIsTimerRunning(false);
              setTotalPauseTime(0);
              setPauseStartTime(null);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isTimerRunning, timer, timerMode, currentSession, pomodoroSettings, completedSessions, totalPauseTime]);

  const handleBackToPlanner = () => {
    navigate('/');
  };

  const handleSaveSettings = () => {
    // Salvar configurações no banco de dados
    saveTypedSetting('pomodoro_study_time', pomodoroSettings.studyTime, 'pomodoro', 'Tempo de estudo do Pomodoro em segundos');
    saveTypedSetting('pomodoro_break_time', pomodoroSettings.breakTime, 'pomodoro', 'Tempo de intervalo curto do Pomodoro em segundos');
    saveTypedSetting('pomodoro_long_break_time', pomodoroSettings.longBreakTime, 'pomodoro', 'Tempo de intervalo longo do Pomodoro em segundos');
    saveTypedSetting('pomodoro_sessions_until_long_break', pomodoroSettings.sessionsUntilLongBreak, 'pomodoro', 'Número de sessões até intervalo longo');
    saveTypedSetting('pomodoro_auto_start_breaks', pomodoroSettings.autoStartBreaks, 'pomodoro', 'Iniciar intervalos automaticamente');
    saveTypedSetting('pomodoro_auto_start_sessions', pomodoroSettings.autoStartSessions, 'pomodoro', 'Iniciar sessões automaticamente');
    saveTypedSetting('pomodoro_sound_enabled', pomodoroSettings.soundEnabled, 'pomodoro', 'Som habilitado no Pomodoro');
    
    setShowSettings(false);
  };

const handleCancelSettings = () => {
  setShowSettings(false);
};

const handleSaveSessionFromModal = (finalSession: StudySession) => {
  setStudySessions(prev => [...prev, finalSession]);
  setShowSaveModal(false);
  setPendingSession(null);
  setPendingNetSeconds(0);
  setPendingPauseSeconds(0);
};

const handleCloseSaveModal = () => {
  setShowSaveModal(false);
  setPendingSession(null);
  setPendingNetSeconds(0);
  setPendingPauseSeconds(0);
};

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="mb-6">
            <Button
              onClick={() => setShowSettings(false)}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Configurações do Timer</h1>
            <p className="text-muted-foreground mt-2">
              Ajuste as configurações do seu timer Pomodoro
            </p>
          </div>

          <TimerSettings
            pomodoroSettings={pomodoroSettings}
            onSettingChange={handleTimerSettingChange}
            onSave={handleSaveSettings}
            onCancel={handleCancelSettings}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <Button
            onClick={handleBackToPlanner}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Plano
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Sessão de Estudo</h1>
              <p className="text-muted-foreground mt-2">
                Foque nos seus estudos com o método Pomodoro
              </p>
            </div>
            <Button
              onClick={() => setShowSettings(true)}
              variant="outline"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <PomodoroTimer
            subjects={subjects}
            currentSubject={currentSubject}
            currentTopic={currentTopic}
            currentSubtopic={currentSubtopic}
            timer={timer}
            isTimerRunning={isTimerRunning}
            timerMode={timerMode}
            currentSession={currentSession}
            pomodoroSettings={pomodoroSettings}
            onStartTimer={startTimer}
            onPauseTimer={pauseTimer}
            onResumeTimer={resumeTimer}
            onStopTimer={stopTimer}
            onBackToPlanner={handleBackToPlanner}
            onOpenSettings={() => setShowSettings(true)}
          />
{pendingSession && (
  <SaveStudySessionModal
    open={showSaveModal}
    onClose={handleCloseSaveModal}
    onSave={handleSaveSessionFromModal}
    baseSession={pendingSession}
    subjects={subjects}
    defaults={{ netSeconds: pendingNetSeconds, pauseSeconds: pendingPauseSeconds }}
  />
)}

{studySessions.length > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              <StudySessionHistory studySessions={studySessions} />
              <StudyStatistics studySessions={studySessions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudySessionPage;
