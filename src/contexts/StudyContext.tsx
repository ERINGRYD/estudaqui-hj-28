
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { StudySubject, StudySession, StudyPlan, ExamType } from '@/types/study';
import { loadActiveStudyPlan, saveActiveStudyPlan } from '@/utils/sqlitePersistence';
import { migrateFromLocalStorage } from '@/db/migration';
import { useDB } from '@/contexts/DBProvider';
import { loadStudySessions, saveStudySession } from '@/db/db';

interface StudyContextType {
  studySessions: StudySession[];
  setStudySessions: React.Dispatch<React.SetStateAction<StudySession[]>>;
  subjects: StudySubject[];
  setSubjects: React.Dispatch<React.SetStateAction<StudySubject[]>>;
  studyPlan: StudyPlan | null;
  setStudyPlan: React.Dispatch<React.SetStateAction<StudyPlan | null>>;
  examDate?: Date;
  setExamDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  selectedExam: string;
  setSelectedExam: React.Dispatch<React.SetStateAction<string>>;
  examTypes: ExamType[];
  isDBLoading: boolean;
  dbError: string | null;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export const useStudyContext = () => {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudyContext must be used within a StudyProvider');
  }
  return context;
};

interface StudyProviderProps {
  children: ReactNode;
}

export const StudyProvider: React.FC<StudyProviderProps> = ({ children }) => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [examDate, setExamDate] = useState<Date | undefined>();
  const [selectedExam, setSelectedExam] = useState('');

  // Use the global database context with error handling
  const dbContext = useDB();
  const { db, isLoading: isDBLoading, error: dbError } = dbContext || { 
    db: null, 
    isLoading: true, 
    error: null 
  };
  
  const isInitialized = !!db && !isDBLoading;

  // Initialize app data after database is ready
  useEffect(() => {
    const initializeApp = async () => {
      if (!isInitialized) return;

      try {
        await migrateFromLocalStorage();
        
        const savedPlan = loadActiveStudyPlan();
        if (savedPlan) {
          const planWithDefaults = savedPlan.cycleStart
            ? savedPlan
            : { ...savedPlan, cycleStart: new Date() };
          setStudyPlan(planWithDefaults);
          if (planWithDefaults.examDate) {
            setExamDate(new Date(planWithDefaults.examDate));
          }
        }

        // Load existing study sessions from database
        const savedSessions = loadStudySessions();
        setStudySessions(savedSessions);
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, [isInitialized]);

  // Auto-save study plan when it changes (only if database is ready)
  useEffect(() => {
    if (studyPlan && isInitialized) {
      saveActiveStudyPlan(studyPlan);
    }
  }, [studyPlan, isInitialized]);

  // Auto-save study sessions when they change (only if database is ready)
  useEffect(() => {
    if (studySessions.length > 0 && isInitialized) {
      // Save the most recent session (the one just added)
      const latestSession = studySessions[studySessions.length - 1];
      if (latestSession) {
        try {
          saveStudySession(latestSession);
        } catch (error) {
          console.error('Error saving study session:', error);
        }
      }
    }
  }, [studySessions, isInitialized]);

  const examTypes: ExamType[] = [
    { 
      id: 'enem', 
      name: 'ENEM', 
      description: 'Exame Nacional do Ensino Médio',
      defaultSubjects: ['Matemática', 'Português', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Literatura', 'Inglês/Espanhol', 'Redação'],
      recommendedHours: 40,
      difficulty: 'medium'
    },
    { 
      id: 'concursos', 
      name: 'Concursos Públicos', 
      description: 'Concursos federais, estaduais e municipais',
      defaultSubjects: ['Português', 'Matemática', 'Raciocínio Lógico', 'Informática', 'Direito Constitucional', 'Direito Administrativo', 'Conhecimentos Específicos'],
      recommendedHours: 50,
      difficulty: 'hard'
    },
    { 
      id: 'oab', 
      name: 'OAB', 
      description: 'Ordem dos Advogados do Brasil',
      defaultSubjects: ['Direito Constitucional', 'Direito Administrativo', 'Direito Civil', 'Direito Penal', 'Direito do Trabalho', 'Direito Tributário', 'Ética Profissional'],
      recommendedHours: 45,
      difficulty: 'hard'
    },
    { 
      id: 'vestibular', 
      name: 'Vestibular', 
      description: 'Vestibulares tradicionais',
      defaultSubjects: ['Matemática', 'Português', 'História', 'Geografia', 'Física', 'Química', 'Biologia', 'Literatura', 'Inglês'],
      recommendedHours: 35,
      difficulty: 'medium'
    },
    { 
      id: 'militar', 
      name: 'Concursos Militares', 
      description: 'ESA, EsPCEx, IME, ITA, AFA',
      defaultSubjects: ['Matemática', 'Português', 'Física', 'Química', 'História', 'Geografia', 'Inglês'],
      recommendedHours: 50,
      difficulty: 'hard'
    },
    { 
      id: 'medicina', 
      name: 'Medicina', 
      description: 'FUVEST, UNICAMP, outros vestibulares de medicina',
      defaultSubjects: ['Matemática', 'Português', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Inglês', 'Literatura'],
      recommendedHours: 55,
      difficulty: 'hard'
    },
    { 
      id: 'custom', 
      name: 'Personalizado', 
      description: 'Crie seu próprio conjunto de matérias'
    }
  ];

  const value: StudyContextType = {
    studySessions,
    setStudySessions,
    subjects,
    setSubjects,
    studyPlan,
    setStudyPlan,
    examDate,
    setExamDate,
    selectedExam,
    setSelectedExam,
    examTypes,
    isDBLoading,
    dbError
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
};
