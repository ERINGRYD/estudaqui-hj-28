import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Sword, 
  Trophy, 
  Target, 
  Crown,
  Clock,
  Zap,
  AlertTriangle,
  Users,
  FileText,
  Play,
  ArrowRight,
  Shield,
  Flame,
  Star,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useStudyContext } from '@/contexts/StudyContext';
import { useDB } from '@/contexts/DBProvider';
import { getEnemiesByRoom, getEnemyQuestions } from '@/db/crud/enemies';
import { getUserProgress } from '@/db/crud/battle';
import BattleArena from '@/components/battle/BattleArena';
import UserProgressWidget from '@/components/battle/UserProgressWidget';
import type { Room, UserProgress } from '@/types/battle';
import type { Enemy } from '@/types/enemy';

type SimulationMode = 'skirmish' | 'war' | 'rescue';

interface SimulationConfig {
  mode: SimulationMode;
  questionCount: number;
  selectedSubjects: string[];
  timeLimit?: number;
}

const ColiseumPage = () => {
  const { isLoading: isDBLoading, error: dbError } = useDB();
  const { subjects, isDBLoading: contextDBLoading, dbError: contextDBError } = useStudyContext();

  const [currentState, setCurrentState] = useState<'selection' | 'execution' | 'report'>('selection');
  const [config, setConfig] = useState<SimulationConfig>({
    mode: 'skirmish',
    questionCount: 15,
    selectedSubjects: [],
    timeLimit: 30
  });
  const [enemies, setEnemies] = useState<Record<Room, Enemy[]>>({
    triagem: [],
    vermelha: [],
    amarela: [],
    verde: []
  });
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [battleRoom, setBattleRoom] = useState<Room>('triagem');

  const simulationTypes = [
    {
      mode: 'skirmish' as SimulationMode,
      title: '⚔️ Escaramuça',
      subtitle: 'Combate Rápido',
      description: 'Aquecimento estratégico para revisar conceitos essenciais',
      details: ['10-20 questões configuráveis', '15-30 minutos', '+100-150 XP', 'Ideal para revisão'],
      color: 'from-blue-500 to-cyan-500',
      icon: Sword,
      minQuestions: 10,
      maxQuestions: 20,
      timeLimit: 30
    },
    {
      mode: 'war' as SimulationMode,
      title: '🏆 Guerra Total',
      subtitle: 'Combate Épico',
      description: 'Simulação completa de batalha para teste de resistência',
      details: ['50-100 questões configuráveis', '2-4 horas', '+200-300 XP', 'Simulação completa'],
      color: 'from-red-500 to-orange-500',
      icon: Crown,
      minQuestions: 50,
      maxQuestions: 100,
      timeLimit: 240
    },
    {
      mode: 'rescue' as SimulationMode,
      title: '🎯 Operação Resgate',
      subtitle: 'Missão Focada',
      description: 'Missão especial para resgatar inimigos da Sala Vermelha',
      details: ['Inimigos da Sala Vermelha', 'Sem limite de tempo', '+50 XP por resgate', 'Foco específico'],
      color: 'from-red-600 to-red-700',
      icon: Target,
      minQuestions: 1,
      maxQuestions: 50,
      timeLimit: undefined
    }
  ];

  useEffect(() => {
    if (!isDBLoading && !dbError && !contextDBLoading && !contextDBError) {
      loadData();
    }
  }, [isDBLoading, dbError, contextDBLoading, contextDBError]);

  const loadData = async () => {
    setLoading(true);
    try {
      const enemyStats = getEnemiesByRoom();
      const progress = getUserProgress();
      
      setEnemies(enemyStats);
      setUserProgress(progress);
    } catch (error) {
      console.error('Error loading coliseum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableQuestions = () => {
    let availableEnemies: Enemy[] = [];

    if (config.mode === 'rescue') {
      availableEnemies = enemies.vermelha;
    } else {
      availableEnemies = Object.values(enemies).flat();
    }

    // Filter by selected subjects if any
    if (config.selectedSubjects.length > 0) {
      availableEnemies = availableEnemies.filter(enemy => 
        config.selectedSubjects.includes(enemy.subjectName)
      );
    }

    // Get all questions from these enemies
    const allQuestions: string[] = [];
    availableEnemies.forEach(enemy => {
      const enemyQuestions = getEnemyQuestions(enemy.topicId);
      allQuestions.push(...enemyQuestions.map(q => q.id));
    });

    return allQuestions;
  };

  const canStartBattle = () => {
    const availableQuestions = getAvailableQuestions();
    
    if (config.mode === 'war' && Object.values(enemies).flat().length < 25) {
      return { canStart: false, reason: 'Guerra Total requer pelo menos 25 inimigos disponíveis' };
    }
    
    if (config.mode === 'rescue' && enemies.vermelha.length === 0) {
      return { canStart: false, reason: 'Nenhum inimigo na Sala Vermelha para resgatar' };
    }

    if (availableQuestions.length < config.questionCount) {
      return { canStart: false, reason: `Apenas ${availableQuestions.length} questões disponíveis` };
    }

    return { canStart: true, reason: '' };
  };

  const handleStartBattle = () => {
    const { canStart, reason } = canStartBattle();
    
    if (!canStart) {
      toast({
        title: "Não é possível iniciar o combate",
        description: reason,
        variant: "destructive"
      });
      return;
    }

    const availableQuestions = getAvailableQuestions();
    const selectedQuestions = availableQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, config.questionCount);
    
    setSelectedQuestions(selectedQuestions);
    setBattleRoom(config.mode === 'rescue' ? 'vermelha' : 'triagem');
    setCurrentState('execution');

    toast({
      title: "🏛️ Combate Épico Iniciado!",
      description: `${config.questionCount} inimigos aguardam na arena`,
    });
  };

  const handleBattleComplete = () => {
    setCurrentState('report');
    loadData(); // Reload data to update stats
  };

  const handleBackToSelection = () => {
    setCurrentState('selection');
    setSelectedQuestions([]);
  };

  const estimatedTime = () => {
    const baseTimePerQuestion = 2; // 2 minutes per question
    return Math.ceil(config.questionCount * baseTimePerQuestion);
  };

  // Show loading screen if database is loading
  if (isDBLoading || contextDBLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-600" />
          <p className="text-muted-foreground">Preparando o Coliseu...</p>
        </div>
      </div>
    );
  }

  if (dbError || contextDBError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Erro ao carregar: {dbError || contextDBError}</p>
        </div>
      </div>
    );
  }

  // Battle execution state
  if (currentState === 'execution') {
    return (
      <BattleArena
        questionIds={selectedQuestions}
        room={battleRoom}
        onComplete={handleBattleComplete}
        onBack={handleBackToSelection}
      />
    );
  }

  // Report state
  if (currentState === 'report') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500 w-20 h-20 mx-auto flex items-center justify-center">
              <Trophy className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              🏆 Combate Finalizado!
            </h1>
            <p className="text-lg text-muted-foreground">
              Glória eterna aos gladiadores do conhecimento
            </p>
          </div>

          {/* Results Summary */}
          <Card className="border-2 border-orange-200 dark:border-orange-800">
            <CardContent className="p-8 text-center">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Arena conquistada com sucesso!</h3>
                <p className="text-muted-foreground">
                  Os resultados detalhados da batalha foram registrados em seu progresso.
                </p>
                <div className="flex justify-center">
                  {userProgress && <UserProgressWidget progress={userProgress} />}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleBackToSelection}
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <Sword className="h-5 w-5 mr-2" />
              Nova Batalha
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Selection state (default)
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 p-4 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-full bg-gradient-to-r from-orange-500 to-red-500">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                🏛️ Coliseu Romano
              </h1>
              <p className="text-lg text-muted-foreground">
                Arena de Simulados Épicos - Escolha seu combate, gladiador!
              </p>
            </div>
          </div>
          
          {userProgress && <UserProgressWidget progress={userProgress} />}
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {Object.values(enemies).flat().length}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total de Inimigos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {enemies.vermelha.length}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">Para Resgate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Crown className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {enemies.verde.length}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">Dominados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                    {getAvailableQuestions().length}
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">Questões Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simulation Types */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">⚔️ Escolha Seu Destino na Arena</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {simulationTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = config.mode === type.mode;
              const availableQuestions = type.mode === 'rescue' ? 
                enemies.vermelha.length : 
                Object.values(enemies).flat().length;
              
              return (
                <Card 
                  key={type.mode}
                  className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 ${
                    isSelected 
                      ? 'border-orange-500 shadow-lg ring-2 ring-orange-200 dark:ring-orange-800' 
                      : 'border-border hover:border-orange-300'
                  }`}
                  onClick={() => setConfig(prev => ({ 
                    ...prev, 
                    mode: type.mode,
                    questionCount: type.minQuestions,
                    timeLimit: type.timeLimit
                  }))}
                >
                  <CardHeader className={`bg-gradient-to-r ${type.color} text-white rounded-t-lg`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-8 w-8" />
                        <div>
                          <CardTitle className="text-xl">{type.title}</CardTitle>
                          <CardDescription className="text-orange-100">
                            {type.subtitle}
                          </CardDescription>
                        </div>
                      </div>
                      {isSelected && <Star className="h-6 w-6 text-yellow-300" />}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-4">
                    <p className="text-muted-foreground">{type.description}</p>
                    
                    <div className="space-y-2">
                      {type.details.map((detail, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full" />
                          <span className="text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Inimigos Disponíveis:</span>
                        <Badge variant={availableQuestions > 0 ? "default" : "destructive"}>
                          {availableQuestions}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Configuration Panel */}
        <Card className="border-2 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <span>Configuração da Batalha</span>
            </CardTitle>
            <CardDescription>
              Personalize sua experiência épica no Coliseu
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Question Count Slider (only for skirmish and war) */}
            {config.mode !== 'rescue' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-medium">Quantidade de Questões</label>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                    {config.questionCount} questões
                  </Badge>
                </div>
                
                <Slider
                  value={[config.questionCount]}
                  onValueChange={(value) => setConfig(prev => ({ ...prev, questionCount: value[0] }))}
                  min={simulationTypes.find(t => t.mode === config.mode)?.minQuestions || 10}
                  max={Math.min(
                    simulationTypes.find(t => t.mode === config.mode)?.maxQuestions || 20,
                    getAvailableQuestions().length
                  )}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Mínimo: {simulationTypes.find(t => t.mode === config.mode)?.minQuestions}</span>
                  <span>Máximo: {Math.min(
                    simulationTypes.find(t => t.mode === config.mode)?.maxQuestions || 20,
                    getAvailableQuestions().length
                  )}</span>
                </div>
              </div>
            )}

            {/* Subject Filter */}
            <div className="space-y-4">
              <label className="font-medium">Filtrar por Matérias (Opcional)</label>
              <Select 
                value={config.selectedSubjects.length > 0 ? config.selectedSubjects[0] : 'all'} 
                onValueChange={(value) => 
                  setConfig(prev => ({ 
                    ...prev, 
                    selectedSubjects: value === 'all' ? [] : [value] 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as matérias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as matérias</SelectItem>
                  {subjects
                    .filter(subject => subject.name && subject.name.trim() !== '')
                    .map(subject => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Battle Preview */}
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-3">
                🎯 Preview do Combate
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-orange-600" />
                  <span>
                    <strong>{config.questionCount}</strong> questões
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span>
                    <strong>~{estimatedTime()}</strong> minutos
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-orange-600" />
                  <span>
                    <strong>+{config.questionCount * 10}</strong> XP base
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-orange-600" />
                  <span>
                    <strong>{getAvailableQuestions().length}</strong> disponíveis
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Battle Button */}
        <div className="text-center">
          <Button
            onClick={handleStartBattle}
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            disabled={loading || !canStartBattle().canStart}
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              <Play className="h-6 w-6 mr-2" />
            )}
            Iniciar Combate Épico!
            <ArrowRight className="h-6 w-6 ml-2" />
          </Button>
          
          {!canStartBattle().canStart && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {canStartBattle().reason}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColiseumPage;