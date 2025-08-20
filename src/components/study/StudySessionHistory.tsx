
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar as CalendarIcon, PauseCircle, Bookmark, BookOpen } from 'lucide-react';
import { StudySession } from '@/types/study';

type NotesData = {
  date?: string;
  studyType?: string;
  exercises?: { total?: number; correct?: number };
  pagesStudied?: number;
  assunto?: string;
  stopPoint?: string;
  times?: { netSeconds?: number; pauseSeconds?: number; totalSeconds?: number };
};

const parseNotes = (notes?: string): NotesData | null => {
  if (!notes) return null;
  try { return JSON.parse(notes) as NotesData; } catch { return null; }
};

const formatPause = (s: number): string => {
  const sec = Math.max(0, Math.floor(s));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const r = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${h}h ${pad(m)}m ${pad(r)}s`;
  if (m > 0) return `${m}m ${pad(r)}s`;
  return `${r}s`;
};

const formatDate = (dateStr: string | undefined, fallback: Date): string => {
  if (dateStr) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${d}/${m}/${y}`;
    }
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      // fallthrough
    }
  }
  return fallback.toLocaleDateString('pt-BR');
};

const mapStudyType = (t?: string): string => {
  const map: Record<string, string> = {
    leitura: 'Leitura',
    revisao: 'Revisão',
    exercicios: 'Exercícios',
    resumo: 'Resumo',
    videoaula: 'Videoaula',
    simulado: 'Simulado',
  };
  return t && map[t] ? map[t] : '—';
};

interface StudySessionHistoryProps {
  studySessions: StudySession[];
}

const StudySessionHistory: React.FC<StudySessionHistoryProps> = ({ studySessions }) => {
  if (studySessions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Histórico de Sessões</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-60 overflow-y-auto">
{studySessions.slice(-10).reverse().map((session, index) => {
            const notes = parseNotes(session.notes);
            const dateText = formatDate(notes?.date, session.startTime);
            const studyTypeText = mapStudyType(notes?.studyType);
            const pauseText = notes?.times?.pauseSeconds != null ? formatPause(notes.times.pauseSeconds) : '—';
            const stopPointText = notes?.stopPoint;

            return (
              <div key={index} className="flex items-center justify-between p-3 bg-study-secondary/20 rounded-lg border border-study-primary/20">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    session.completed ? 'bg-study-success' : 'bg-study-warning'
                  }`}></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-study-primary truncate">{session.subject}</div>
                    {session.topic && (
                      <div className="text-xs text-muted-foreground">📖 {session.topic}</div>
                    )}
                    {session.subtopic && (
                      <div className="text-xs text-muted-foreground pl-3">• {session.subtopic}</div>
                    )}
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> {dateText}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {studyTypeText}</span>
                      <span className="flex items-center gap-1"><PauseCircle className="h-3 w-3" /> {pauseText}</span>
                      {stopPointText && <span className="flex items-center gap-1"><Bookmark className="h-3 w-3" /> {stopPointText}</span>}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {session.startTime.toLocaleTimeString()} - {session.endTime?.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-study-primary">{session.duration}min</div>
                  <div className="text-sm text-muted-foreground">
                    {session.completed ? '✅ Completa' : '⏸️ Interrompida'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudySessionHistory;
