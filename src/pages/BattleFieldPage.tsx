import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Sword, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Filter, 
  Trophy, 
  Zap,
  Users,
  FileText,
  TrendingUp,
  Crown,
  Loader2
} from 'lucide-react';
import { getEnemiesByRoom, getEnemyQuestions } from '@/db/crud/enemies';
import { getUserProgress } from '@/db/crud/battle';
import { useStudyContext } from '@/contexts/StudyContext';
import { useDB } from '@/contexts/DBProvider';
import type { Room, UserProgress } from '@/types/battle';
import type { Enemy, EnemyStats } from '@/types/enemy';
import BattleArena from '@/components/battle/BattleArena';
import UserProgressWidget from '@/components/battle/UserProgressWidget';
import { EnemyCard } from '@/components/battle/EnemyCard';

const BattleFieldPage = () => {
  // Check if database is ready first
  const { isLoading: isDBLoading, error: dbError } = useDB();
  
  // Always call useStudyContext (hooks must be called unconditionally)
  const { subjects, isDBLoading: contextDBLoading, dbError: contextDBError } = useStudyContext();

  const [activeRoom, setActiveRoom] = useState<Room>('triagem');
  const [enemies, setEnemies] = useState<EnemyStats>({
    triagem: [],
    vermelha: [],
    amarela: [],
    verde: []
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [battleMode, setBattleMode] = useState(false);
  const [selectedEnemy, setSelectedEnemy] = useState<Enemy | null>(null);

  const rooms = [
    {
      id: 'triagem' as Room,
      name: 'Triagem',
      icon: Filter,
      color: 'bg-gray-500',
      textColor: 'text-gray-600',
      description: 'Inimigos novos ou com poucas batalhas'
    },
    {
      id: 'vermelha' as Room,
      name: 'Sala Vermelha',
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      description: 'Taxa de acerto < 70% - Estado crítico'
    },
    {
      id: 'amarela' as Room,
      name: 'Sala Amarela',
      icon: Target,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      description: 'Taxa de acerto 70-85% - Em desenvolvimento'
    },
    {
      id: 'verde' as Room,
      name: 'Sala Verde',
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      description: 'Taxa de acerto > 85% - Dominados'
    }
  ];

  useEffect(() => {
    // Only load data when database is ready and not loading
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
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEnemies = (roomEnemies: Enemy[]) => {
    return roomEnemies.filter(enemy => {
      const matchesSearch = enemy.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           enemy.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = selectedSubject === 'all' || enemy.subjectName === selectedSubject;
      
      return matchesSearch && matchesSubject;
    });
  };

  const handleBattleEnemy = (enemy: Enemy) => {
    setSelectedEnemy(enemy);
    setBattleMode(true);
  };

  const handleBattleComplete = () => {
    setBattleMode(false);
    setSelectedEnemy(null);
    loadData(); // Reload to update enemy stats and rooms
  };

  // Show loading screen if database is loading or if there's an error
  if (isDBLoading || contextDBLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando Campo de Batalha...</p>
        </div>
      </div>
    );
  }

  if (dbError || contextDBError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Erro ao carregar o banco de dados: {dbError || contextDBError}</p>
        </div>
      </div>
    );
  }

  // Calculate overall stats
  const totalEnemies = Object.values(enemies).flat().length;
  const criticalEnemies = enemies.vermelha.length;
  const dominatedEnemies = enemies.verde.length;
  const totalQuestions = Object.values(enemies).flat().reduce((sum, enemy) => sum + enemy.totalQuestions, 0);

  if (battleMode && selectedEnemy) {
    const enemyQuestions = getEnemyQuestions(selectedEnemy.topicId);
    return (
      <BattleArena
        questionIds={enemyQuestions.map(q => q.id)}
        room={selectedEnemy.room}
        onComplete={handleBattleComplete}
        onBack={() => setBattleMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-red-500 to-yellow-500">
              <Sword className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-yellow-600 bg-clip-text text-transparent">
                ⚔️ Campo de Batalha
              </h1>
              <p className="text-muted-foreground">
                Enfrente seus inimigos e conquiste o conhecimento
              </p>
            </div>
          </div>
          
          {userProgress && <UserProgressWidget progress={userProgress} />}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalEnemies}</p>
                  <p className="text-sm text-muted-foreground">Total de Inimigos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{criticalEnemies}</p>
                  <p className="text-sm text-muted-foreground">Críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Crown className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{dominatedEnemies}</p>
                  <p className="text-sm text-muted-foreground">Dominados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalQuestions}</p>
                  <p className="text-sm text-muted-foreground">Questões</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Room Tabs */}
        <Tabs value={activeRoom} onValueChange={(value) => setActiveRoom(value as Room)}>
          <TabsList className="grid w-full grid-cols-4">
            {rooms.map((room) => (
              <TabsTrigger key={room.id} value={room.id} className="flex items-center space-x-2">
                <room.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{room.name}</span>
                <Badge variant="secondary" className="ml-1">
                  {enemies[room.id].length}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar inimigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por matéria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as matérias</SelectItem>
                {subjects
                  .filter((subject) => subject.name && subject.name.trim() !== '')
                  .map((subject) => (
                    <SelectItem key={subject.id} value={subject.name}>
                      {subject.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Content */}
          {rooms.map((room) => (
            <TabsContent key={room.id} value={room.id} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${room.color}`}>
                        <room.icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {room.name}
                          <Badge variant="outline" className={room.textColor}>
                            {filteredEnemies(enemies[room.id]).length} inimigos
                          </Badge>
                        </CardTitle>
                        <CardDescription>{room.description}</CardDescription>
                      </div>
                    </div>
                    
                    {filteredEnemies(enemies[room.id]).length > 0 && room.id !== 'triagem' && (
                      <Button
                        onClick={() => {
                          // Battle all enemies in this room (max 5)
                          const roomEnemies = filteredEnemies(enemies[room.id]).slice(0, 5);
                          if (roomEnemies.length > 0) {
                            setSelectedEnemy(roomEnemies[0]); // For now, start with first enemy
                            setBattleMode(true);
                          }
                        }}
                        className={`bg-gradient-to-r ${
                          room.id === 'vermelha' ? 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' :
                          room.id === 'amarela' ? 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700' :
                          'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        }`}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Batalha em Massa
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-muted rounded-md animate-pulse" />
                      ))}
                    </div>
                  ) : filteredEnemies(enemies[room.id]).length === 0 ? (
                    <div className="text-center py-12">
                      <room.icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-semibold text-foreground mb-2">
                        {room.id === 'triagem' ? 'Nenhum inimigo na triagem' : 
                         room.id === 'verde' ? 'Nenhum inimigo dominado ainda' : 
                         'Nenhum inimigo nesta sala'}
                      </p>
                      <p className="text-muted-foreground">
                        {room.id === 'triagem' ? 'Adicione questões para criar novos inimigos' :
                         room.id === 'verde' ? 'Continue lutando para dominar seus inimigos!' :
                         'Os inimigos aparecerão aqui baseado no seu desempenho'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredEnemies(enemies[room.id]).map((enemy) => (
                        <EnemyCard
                          key={enemy.id}
                          enemy={enemy}
                          onBattle={handleBattleEnemy}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default BattleFieldPage;
