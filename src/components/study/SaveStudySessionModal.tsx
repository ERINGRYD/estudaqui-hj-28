import React, { useMemo, useState } from "react";
import { StudySession, StudySubject } from "@/types/study";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BarChart3, Pause, Hourglass, Calendar as CalendarIcon, Pencil, X } from "lucide-react";

interface SaveStudySessionModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (session: StudySession) => void;
  baseSession: StudySession;
  subjects: StudySubject[];
  defaults?: {
    netSeconds?: number;
    pauseSeconds?: number;
  };
}

function secondsToHMS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

function hmsToSeconds(h: number, m: number, s: number) {
  return Math.max(0, h) * 3600 + Math.max(0, m) * 60 + Math.max(0, s);
}

const buildPath = (subject?: string, topic?: string, subtopic?: string) => {
  return [subject, topic, subtopic].filter(Boolean).join(" / ");
};

const buildAssuntoOptions = (subjects: StudySubject[]) => {
  const options: string[] = [];
  subjects.forEach((s) => {
    const sPath = buildPath(s.name);
    options.push(sPath);
    s.topics?.forEach((t) => {
      const tPath = buildPath(s.name, t.name);
      options.push(tPath);
      t.subtopics?.forEach((st) => {
        const stPath = buildPath(s.name, t.name, st.name);
        options.push(stPath);
      });
    });
  });
  // Remove duplicates just in case
  return Array.from(new Set(options));
};

const TimeAdjuster = ({
  label,
  value,
  onChange,
  colorVariant,
  icon: Icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  colorVariant: "primary" | "accent" | "secondary";
  icon: React.ComponentType<any>;
}) => {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const [s, setS] = useState(0);

  React.useEffect(() => {
    const total = Math.max(0, Math.floor(value));
    const hh = Math.floor(total / 3600);
    const mm = Math.floor((total % 3600) / 60);
    const ss = total % 60;
    setH(hh);
    setM(mm);
    setS(ss);
  }, [value]);

  const colorClasses = {
    primary: "text-primary border-primary bg-primary/10",
    accent: "text-accent-foreground border-accent bg-accent/10",
    secondary: "text-secondary-foreground border-secondary bg-secondary/10",
  }[colorVariant];

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "h-24 w-24 rounded-full border flex items-center justify-center",
          colorClasses
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <div className="text-center">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-semibold text-foreground">{secondsToHMS(value)}</div>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" /> Ajustar
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4" align="center">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Horas</Label>
              <Input
                type="number"
                min={0}
                value={h}
                onChange={(e) => setH(parseInt(e.target.value || "0", 10))}
              />
            </div>
            <div>
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                min={0}
                max={59}
                value={m}
                onChange={(e) => setM(parseInt(e.target.value || "0", 10))}
              />
            </div>
            <div>
              <Label className="text-xs">Seg</Label>
              <Input
                type="number"
                min={0}
                max={59}
                value={s}
                onChange={(e) => setS(parseInt(e.target.value || "0", 10))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                onChange(hmsToSeconds(h, m, s));
                setOpen(false);
              }}
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const SaveStudySessionModal: React.FC<SaveStudySessionModalProps> = ({
  open,
  onClose,
  onSave,
  baseSession,
  subjects,
  defaults,
}) => {
  const defaultNet = defaults?.netSeconds ?? Math.max(0, (baseSession.duration || 0) * 60);
  const defaultPause = defaults?.pauseSeconds ?? 0;

  const [date, setDate] = useState<Date>(new Date());
  const [studyType, setStudyType] = useState<string>("leitura");
  const [exTotal, setExTotal] = useState<string>("");
  const [exCorrect, setExCorrect] = useState<string>("");
  const [pages, setPages] = useState<string>("");
  const path = useMemo(() => buildPath(baseSession.subject, baseSession.topic, baseSession.subtopic), [baseSession]);
  const options = useMemo(() => buildAssuntoOptions(subjects), [subjects]);
  const [assunto, setAssunto] = useState<string>(path || (options[0] ?? ""));
  const [stopPoint, setStopPoint] = useState<string>("");
  const [netSeconds, setNetSeconds] = useState<number>(defaultNet);
  const [pauseSeconds, setPauseSeconds] = useState<number>(defaultPause);

  const totalSeconds = netSeconds + pauseSeconds;

  const handleSave = () => {
    const final: StudySession = {
      ...baseSession,
      duration: Math.floor(netSeconds / 60),
      endTime: baseSession.endTime ?? new Date(),
      notes: JSON.stringify({
        date: format(date, "yyyy-MM-dd"),
        studyType,
        exercises: (exTotal || exCorrect) ? { total: Number(exTotal || 0), correct: Number(exCorrect || 0) } : undefined,
        pagesStudied: pages ? Number(pages) : 0,
        assunto,
        stopPoint,
        times: {
          netSeconds,
          pauseSeconds,
          totalSeconds,
        },
      }),
    };
    onSave(final);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Salvar sessão de estudos</DialogTitle>
          <DialogDescription className="sr-only">
            Revise e complete os dados da sua sessão antes de salvar.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-2 -left-2"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </Button>
          <header className="mb-4">
            <h1 className="text-xl font-bold text-foreground">
              {path ? path.toUpperCase() : "SESSÃO DE ESTUDO"}
            </h1>
          </header>

          <section aria-label="Indicadores de tempo" className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <TimeAdjuster
                label="Tempo líquido"
                value={netSeconds}
                onChange={setNetSeconds}
                colorVariant="primary"
                icon={BarChart3}
              />
              <TimeAdjuster
                label="Tempo de pausa"
                value={pauseSeconds}
                onChange={setPauseSeconds}
                colorVariant="accent"
                icon={Pause}
              />
              <div className="flex flex-col items-center gap-2">
                <div className={cn("h-24 w-24 rounded-full border flex items-center justify-center text-secondary-foreground border-secondary bg-secondary/10")}> 
                  <Hourglass className="h-6 w-6" aria-hidden />
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Tempo total</div>
                  <div className="font-semibold text-foreground">{secondsToHMS(totalSeconds)}</div>
                </div>
              </div>
            </div>
          </section>

          <main className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("justify-start font-normal")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "dd/MM/yyyy") : <span>Selecionar data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Tipo de estudo</Label>
                <Select value={studyType} onValueChange={setStudyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="leitura">Leitura</SelectItem>
                    <SelectItem value="revisao">Revisão</SelectItem>
                    <SelectItem value="exercicios">Exercícios</SelectItem>
                    <SelectItem value="resumo">Resumo</SelectItem>
                    <SelectItem value="videoaula">Videoaula</SelectItem>
                    <SelectItem value="simulado">Simulado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Total de exercícios</Label>
                <Input type="number" inputMode="numeric" value={exTotal} onChange={(e) => setExTotal(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Acertos</Label>
                <Input type="number" inputMode="numeric" value={exCorrect} onChange={(e) => setExCorrect(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Páginas estudadas</Label>
                <Input type="number" inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Assunto estudado</Label>
                <Select value={assunto} onValueChange={setAssunto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64 overflow-auto">
                    {options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Ponto de parada</Label>
                <Input
                  placeholder="Ex.: Capítulo 3, página 45"
                  value={stopPoint}
                  onChange={(e) => setStopPoint(e.target.value)}
                />
              </div>
            </div>
          </main>

          <footer className="mt-6 flex justify-end">
            <Button onClick={handleSave}>Salvar</Button>
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveStudySessionModal;
