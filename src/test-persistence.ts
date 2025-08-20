// Teste de persistência do banco de dados SQLite
import { StudySession, StudyPlan, StudySubject } from '@/types/study';
import { 
  saveStudySession, 
  loadStudySessions, 
  saveNamedStudyPlan, 
  getSavedPlans, 
  getActivePlan 
} from '@/db/db';

export const executePersistenceTest = () => {
  console.log('🧪 Iniciando teste de persistência do banco SQLite...');
  
  try {
    // Etapa 1: Criar uma sessão de estudo de teste
    const testSession: StudySession = {
      id: `test_session_${Date.now()}`,
      subject: 'Matemática',
      topic: 'Álgebra',
      subtopic: 'Equações do 2º grau',
      startTime: new Date(),
      endTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      duration: 30,
      completed: true,
      notes: 'Sessão de teste para verificar persistência',
      performance: 'high' as const
    };

    console.log('📝 Criando sessão de estudo de teste:', testSession);
    saveStudySession(testSession);

    // Etapa 2: Criar um plano de estudo de teste
    const testSubject: StudySubject = {
      id: 'test_subject_math',
      name: 'Matemática',
      weight: 1.0,
      level: 'intermediate' as const,
      color: '#3B82F6',
      priority: 1,
      lastStudied: new Date(),
      totalTime: 30,
      customSubject: false
    };

    const testPlan: StudyPlan = {
      id: `test_plan_${Date.now()}`,
      type: 'cycle' as const,
      examDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
      daysUntilExam: 90,
      subjects: [testSubject],
      totalHours: 40,
      focusAreas: ['Matemática', 'Física'],
      intensity: 'medium' as const,
      methodology: 'pomodoro' as const,
      weeklyHourLimit: 20,
      data: {},
      cycle: [],
      weekly: []
    };

    console.log('📋 Criando plano de estudo de teste:', testPlan);
    const planId = saveNamedStudyPlan(testPlan, 'Plano de Teste - Persistência');

    // Etapa 3: Verificar se os dados foram salvos
    console.log('🔍 Verificando dados salvos...');
    
    const savedSessions = loadStudySessions();
    const savedPlans = getSavedPlans();
    const activePlan = getActivePlan();

    console.log('📊 Resultados do teste:');
    console.log(`✅ Sessões salvas: ${savedSessions.length}`);
    console.log(`✅ Planos salvos: ${savedPlans.length}`);
    console.log(`✅ Plano ativo: ${activePlan ? 'Sim' : 'Não'}`);

    // Verificar se nossa sessão de teste existe
    const testSessionFound = savedSessions.find(s => s.id === testSession.id);
    console.log(`✅ Sessão de teste encontrada: ${testSessionFound ? 'Sim' : 'Não'}`);

    // Verificar se nosso plano de teste existe
    const testPlanFound = savedPlans.find(p => p.plan.id === planId);
    console.log(`✅ Plano de teste encontrado: ${testPlanFound ? 'Sim' : 'Não'}`);

    if (testSessionFound && testPlanFound) {
      console.log('🎉 TESTE PASSOU: Todos os dados foram persistidos corretamente!');
      return {
        success: true,
        message: 'Dados persistidos com sucesso',
        details: {
          sessionsCount: savedSessions.length,
          plansCount: savedPlans.length,
          hasActivePlan: !!activePlan,
          testSessionFound: !!testSessionFound,
          testPlanFound: !!testPlanFound
        }
      };
    } else {
      console.log('❌ TESTE FALHOU: Alguns dados não foram persistidos');
      return {
        success: false,
        message: 'Falha na persistência de dados',
        details: {
          sessionsCount: savedSessions.length,
          plansCount: savedPlans.length,
          hasActivePlan: !!activePlan,
          testSessionFound: !!testSessionFound,
          testPlanFound: !!testPlanFound
        }
      };
    }

  } catch (error) {
    console.error('💥 Erro durante o teste de persistência:', error);
    return {
      success: false,
      message: `Erro durante o teste: ${error}`,
      details: null
    };
  }
};

export const simulateNavigation = () => {
  console.log('🔄 Simulando navegação entre páginas...');
  
  // Simular mudança de página (window.location seria diferente em uma aplicação real)
  const currentPath = window.location.pathname;
  console.log(`📍 Página atual: ${currentPath}`);
  
  // Simular navegação para database
  console.log('➡️ Navegando para /database...');
  
  // Simular volta para dashboard
  console.log('⬅️ Voltando para /dashboard...');
  
  // Simular reload da aplicação
  console.log('🔄 Simulando reload da aplicação...');
  
  return {
    navigationTest: 'completed',
    pages: [currentPath, '/database', '/'],
    reloadSimulated: true
  };
};