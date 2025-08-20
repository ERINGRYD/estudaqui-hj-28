import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Trophy, Zap, CheckCircle, XCircle, Brain, Target, Lightbulb, Clock } from 'lucide-react';
import { getQuestionById, recordQuestionAttempt } from '@/db/crud/questions';
import { startBattleSession, completeBattleSession, addXpToUser } from '@/db/crud/battle';
import { toast } from '@/hooks/use-toast';
import type { Question, Room, ConfidenceLevel, ErrorType } from '@/types/battle';

interface BattleArenaProps {
  questionIds: string[];
  room: Room;
  onComplete: () => void;
  onBack: () => void;
}

interface QuestionResult {
  question: Question;
  userAnswer: string;
  isCorrect: boolean;
  confidence: ConfidenceLevel;
  errorType?: ErrorType;
  xpEarned: number;
}

const BattleArena: React.FC<BattleArenaProps> = ({ questionIds, room, onComplete, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [confidence, setConfidence] = useState<ConfidenceLevel>('certeza');
  const [errorType, setErrorType] = useState<ErrorType>('nao_definido');
  const [battleSessionId, setBattleSessionId] = useState<string>('');
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [battleComplete, setBattleComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Timer states
  const [globalTime, setGlobalTime] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);
  const [timersStarted, setTimersStarted] = useState(false);

  const confidenceOptions = [
    { value: 'certeza' as ConfidenceLevel, label: 'Certeza', icon: CheckCircle, bonus: '+5 XP', color: 'text-green-600' },
    { value: 'duvida' as ConfidenceLevel, label: 'Dúvida', icon: Target, bonus: '+3 XP', color: 'text-yellow-600' },
    { value: 'chute' as ConfidenceLevel, label: 'Chute', icon: Lightbulb, bonus: '+1 XP', color: 'text-blue-600' }
  ];

  const errorTypeOptions = [
    { value: 'interpretacao' as ErrorType, label: 'Interpretação', description: 'Não entendi a pergunta corretamente' },
    { value: 'conteudo' as ErrorType, label: 'Conteúdo', description: 'Não conhecia o assunto' },
    { value: 'distracao' as ErrorType, label: 'Distração', description: 'Erro por desatenção' },
    { value: 'nao_definido' as ErrorType, label: 'Não Definido', description: 'Outro motivo' }
  ];

  useEffect(() => {
    initializeBattle();
  }, []);

  // Timer effects
  useEffect(() => {
    if (!loading && timersStarted && !showResult && !battleComplete) {
      const interval = setInterval(() => {
        setGlobalTime(prev => prev + 1);
        setQuestionTime(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [loading, timersStarted, showResult, battleComplete]);

  // Start timers when battle starts
  useEffect(() => {
    if (!loading && questions.length > 0 && !timersStarted) {
      setTimersStarted(true);
    }
  }, [loading, questions.length, timersStarted]);

  // Reset question timer when moving to next question
  useEffect(() => {
    if (!showResult && timersStarted) {
      setQuestionTime(0);
    }
  }, [currentQuestionIndex, showResult, timersStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeBattle = async () => {
    try {
      // Load questions
      const loadedQuestions = questionIds
        .map(id => getQuestionById(id))
        .filter((q): q is Question => q !== null);
      
      if (loadedQuestions.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhuma questão encontrada para a batalha",
          variant: "destructive"
        });
        onBack();
        return;
      }

      setQuestions(loadedQuestions);
      
      // Start battle session
      const sessionId = startBattleSession(room, loadedQuestions.length);
      setBattleSessionId(sessionId);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing battle:', error);
      toast({
        title: "Erro",
        description: "Erro ao inicializar a batalha",
        variant: "destructive"
      });
      onBack();
    }
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer) {
      toast({
        title: "Atenção",
        description: "Selecione uma resposta antes de continuar",
        variant: "destructive"
      });
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = userAnswer === currentQuestion.correctAnswer;
    
    // Record the attempt
    recordQuestionAttempt(
      currentQuestion.id,
      userAnswer,
      isCorrect,
      confidence,
      battleSessionId,
      undefined, // timeTaken
      isCorrect ? undefined : errorType
    );

    // Calculate XP
    let xpEarned = 0;
    if (isCorrect) {
      const baseXp = 10;
      const confidenceBonus = confidence === 'certeza' ? 5 : confidence === 'duvida' ? 3 : 1;
      const difficultyMultiplier = currentQuestion.difficulty === 'hard' ? 2 : 
                                  currentQuestion.difficulty === 'medium' ? 1.5 : 1;
      
      xpEarned = Math.floor(baseXp * difficultyMultiplier + confidenceBonus);
      
      // Add XP to user progress immediately
      addXpToUser(xpEarned);
    }

    const result: QuestionResult = {
      question: currentQuestion,
      userAnswer,
      isCorrect,
      confidence,
      errorType: isCorrect ? undefined : errorType,
      xpEarned
    };

    setResults(prev => [...prev, result]);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    setShowResult(false);
    setUserAnswer('');
    setConfidence('certeza');
    setErrorType('nao_definido');
    
    if (currentQuestionIndex + 1 >= questions.length) {
      // Battle complete
      finalizeBattle();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const finalizeBattle = () => {
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const totalXp = results.reduce((sum, r) => sum + r.xpEarned, 0);
    
    completeBattleSession(battleSessionId, correctAnswers, totalXp);
    setBattleComplete(true);
    
    // Show epic feedback
    const accuracy = (correctAnswers / questions.length) * 100;
    let message = '';
    
    if (accuracy >= 90) {
      message = '🏆 ÉPICO! Você é um verdadeiro guerreiro!';
    } else if (accuracy >= 70) {
      message = '⚔️ Ótimo trabalho! Continue assim!';
    } else if (accuracy >= 50) {
      message = '💪 Bom esforço! Você está melhorando!';
    } else {
      message = '🎯 Continue treinando! A vitória virá!';
    }
    
    toast({
      title: message,
      description: `${correctAnswers}/${questions.length} acertos - ${totalXp} XP ganhos!`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p>Preparando batalha...</p>
        </div>
      </div>
    );
  }

  if (battleComplete) {
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const totalXp = results.reduce((sum, r) => sum + r.xpEarned, 0);
    const accuracy = (correctAnswers / questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <Trophy className="h-16 w-16 text-yellow-500" />
              </div>
              <CardTitle className="text-3xl bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
                Batalha Concluída!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{correctAnswers}</p>
                  <p className="text-sm text-muted-foreground">Acertos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{questions.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{accuracy.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Precisão</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{totalXp}</p>
                  <p className="text-sm text-muted-foreground">XP Ganho</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Resultados Detalhados</h3>
                {results.map((result, index) => (
                  <Card key={index} className={`border-l-4 ${result.isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{result.question.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.question.topicName} - {result.question.subjectName}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {result.isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          {result.xpEarned > 0 && (
                            <Badge variant="secondary">+{result.xpEarned} XP</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button onClick={onComplete} className="w-full" size="lg">
                Voltar ao Campo de Batalha
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Questão {currentQuestionIndex + 1} de {questions.length}
            </p>
            <Progress value={progress} className="w-48 mt-2" />
            
            {/* Timers */}
            <div className="flex justify-center space-x-4 mt-3">
              <div className="flex items-center space-x-1 bg-background/50 px-2 py-1 rounded-md">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="text-xs font-mono text-blue-600">{formatTime(globalTime)}</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="flex items-center space-x-1 bg-background/50 px-2 py-1 rounded-md">
                <Clock className="h-3 w-3 text-orange-500" />
                <span className="text-xs font-mono text-orange-600">{formatTime(questionTime)}</span>
                <span className="text-xs text-muted-foreground">Questão</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="font-semibold">Batalha Ativa</span>
          </div>
        </div>

        {showResult ? (
          /* Result Screen */
          <Card>
            <CardHeader className="text-center">
              <div className={`mx-auto mb-4 p-3 rounded-full ${results[results.length - 1]?.isCorrect ? 'bg-green-100' : 'bg-red-100'}`}>
                {results[results.length - 1]?.isCorrect ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <CardTitle className={results[results.length - 1]?.isCorrect ? 'text-green-600' : 'text-red-600'}>
                {results[results.length - 1]?.isCorrect ? 'Correto!' : 'Incorreto'}
              </CardTitle>
              {results[results.length - 1]?.xpEarned > 0 && (
                <Badge variant="secondary" className="mt-2">
                  +{results[results.length - 1]?.xpEarned} XP
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-2">Resposta correta:</p>
                <p className="text-primary">{currentQuestion.correctAnswer}</p>
              </div>
              
              {/* Seleção do tipo de erro quando incorreto */}
              {!results[results.length - 1]?.isCorrect && (
                <div>
                  <p className="font-medium mb-3 flex items-center text-red-600">
                    <XCircle className="h-4 w-4 mr-2" />
                    Tipo de Erro
                  </p>
                  <RadioGroup value={errorType} onValueChange={(value) => setErrorType(value as ErrorType)}>
                    <div className="space-y-2">
                      {errorTypeOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                          <RadioGroupItem value={option.value} id={`error-${option.value}`} />
                          <Label htmlFor={`error-${option.value}`} className="flex-1 cursor-pointer">
                            <p className="font-medium text-sm">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}
              
              {currentQuestion.explanation && (
                <div>
                  <p className="font-medium mb-2">Explicação:</p>
                  <p className="text-muted-foreground">{currentQuestion.explanation}</p>
                </div>
              )}
              
              <Button onClick={handleNextQuestion} className="w-full" size="lg">
                {currentQuestionIndex + 1 >= questions.length ? (
                  <>
                    <Trophy className="h-4 w-4 mr-2" />
                    Finalizar Batalha
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Próxima Questão
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Question Screen */
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <Badge variant="outline">{currentQuestion.subjectName}</Badge>
                  <Badge variant="secondary">{currentQuestion.topicName}</Badge>
                  <Badge 
                    variant={currentQuestion.difficulty === 'hard' ? 'destructive' : 
                           currentQuestion.difficulty === 'medium' ? 'default' : 'secondary'}
                  >
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
              </div>
              
              {/* Informações adicionais da questão */}
              {(currentQuestion.examiningBoard || currentQuestion.examYear || currentQuestion.position || currentQuestion.institution) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentQuestion.examiningBoard && (
                    <Badge variant="outline" className="text-xs">
                      Banca: {currentQuestion.examiningBoard}
                    </Badge>
                  )}
                  {currentQuestion.examYear && (
                    <Badge variant="outline" className="text-xs">
                      Ano: {currentQuestion.examYear}
                    </Badge>
                  )}
                  {currentQuestion.position && (
                    <Badge variant="outline" className="text-xs">
                      Cargo: {currentQuestion.position}
                    </Badge>
                  )}
                  {currentQuestion.institution && (
                    <Badge variant="outline" className="text-xs">
                      Instituição: {currentQuestion.institution}
                    </Badge>
                  )}
                </div>
              )}
              
              <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-lg leading-relaxed">{currentQuestion.content}</p>
                
                {/* Imagens da Questão */}
                {currentQuestion.images && currentQuestion.images.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {currentQuestion.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Imagem da questão ${index + 1}`}
                            className="w-full max-h-64 object-contain rounded-lg border shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Options */}
              {currentQuestion.options && currentQuestion.options.length > 0 ? (
                <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={option.content} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          <span className="font-medium mr-2">{option.label})</span>
                          {option.content}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                /* True/False Questions */
                <RadioGroup value={userAnswer} onValueChange={setUserAnswer}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="Verdadeiro" id="true" />
                      <Label htmlFor="true" className="flex-1 cursor-pointer">
                        <span className="font-medium mr-2">V)</span>
                        Verdadeiro
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="Falso" id="false" />
                      <Label htmlFor="false" className="flex-1 cursor-pointer">
                        <span className="font-medium mr-2">F)</span>
                        Falso
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {/* Confidence Level */}
              <div>
                <p className="font-medium mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  Nível de Confiança
                </p>
                <RadioGroup value={confidence} onValueChange={(value) => setConfidence(value as ConfidenceLevel)}>
                  <div className="grid grid-cols-3 gap-3">
                    {confidenceOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                        <RadioGroupItem value={option.value} id={option.value} />
                        <Label htmlFor={option.value} className="flex-1 cursor-pointer text-center">
                          <option.icon className={`h-4 w-4 mx-auto mb-1 ${option.color}`} />
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.bonus}</p>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={handleSubmitAnswer} className="w-full" size="lg">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Resposta
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BattleArena;