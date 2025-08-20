/**
 * Utility to help migrate components from localStorage to SQLite
 * This file provides helper functions to transition existing components
 */

import { 
  saveTypedSetting, 
  loadTypedSetting,
  saveStudyGoal,
  savePerformanceMetric,
  calculateDailyMetrics 
} from './sqlitePersistence';
import { StudyGoal, PerformanceMetric } from '@/db/crud';

/**
 * Migra configurações do localStorage para SQLite
 */
export const migrateLocalStorageSettings = (): boolean => {
  try {
    const keysToMigrate = [
      'pomodoro_duration',
      'short_break_duration', 
      'long_break_duration',
      'theme_preference',
      'notification_settings',
      'study_notifications_enabled'
    ];

    let migratedCount = 0;

    keysToMigrate.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          // Try to parse as JSON first
          const parsedValue = JSON.parse(value);
          const category = key.startsWith('pomodoro_') ? 'pomodoro' : 
                          key.startsWith('theme_') ? 'theme' : 
                          key.includes('notification') ? 'notifications' : 'general';
          
          saveTypedSetting(key, parsedValue, category, `Migrated from localStorage`);
          localStorage.removeItem(key); // Remove after successful migration
          migratedCount++;
        } catch {
          // If JSON parse fails, save as string
          const category = key.startsWith('pomodoro_') ? 'pomodoro' : 
                          key.startsWith('theme_') ? 'theme' : 
                          key.includes('notification') ? 'notifications' : 'general';
          
          saveTypedSetting(key, value, category, `Migrated from localStorage`);
          localStorage.removeItem(key);
          migratedCount++;
        }
      }
    });

    console.log(`Migrated ${migratedCount} settings from localStorage to SQLite`);
    return migratedCount > 0;
  } catch (error) {
    console.error('Error migrating localStorage settings:', error);
    return false;
  }
};

/**
 * Migra metas de estudo do localStorage (se existirem)
 */
export const migrateLocalStorageGoals = (): boolean => {
  try {
    const goalsData = localStorage.getItem('study_goals');
    if (!goalsData) return false;

    const goals = JSON.parse(goalsData);
    if (!Array.isArray(goals)) return false;

    let migratedCount = 0;

    goals.forEach((goal: any) => {
      try {
        const studyGoal: Omit<StudyGoal, 'createdAt' | 'updatedAt'> = {
          id: goal.id || `migrated_goal_${Date.now()}_${Math.random()}`,
          title: goal.title || 'Migrated Goal',
          description: goal.description,
          targetType: goal.targetType || 'hours',
          targetValue: goal.targetValue || 1,
          currentValue: goal.currentValue || 0,
          deadline: goal.deadline ? new Date(goal.deadline) : undefined,
          priority: goal.priority || 0,
          status: goal.status || 'active',
          category: goal.category || 'migrated',
          subjectId: goal.subjectId,
          topicId: goal.topicId
        };

        saveStudyGoal(studyGoal);
        migratedCount++;
      } catch (goalError) {
        console.error('Error migrating individual goal:', goalError);
      }
    });

    if (migratedCount > 0) {
      localStorage.removeItem('study_goals');
      console.log(`Migrated ${migratedCount} goals from localStorage to SQLite`);
    }

    return migratedCount > 0;
  } catch (error) {
    console.error('Error migrating localStorage goals:', error);
    return false;
  }
};

/**
 * Gera métricas históricas baseadas em sessões de estudo existentes
 */
export const generateHistoricalMetrics = (): boolean => {
  try {
    // This would need to be implemented based on existing study sessions
    // For now, we'll generate a sample metric for today
    const today = new Date().toISOString().split('T')[0];
    const todayMetrics = calculateDailyMetrics(today);
    
    if (todayMetrics.studyTime > 0 || todayMetrics.sessionsCount > 0) {
      savePerformanceMetric(todayMetrics);
      console.log('Generated historical metrics for today');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error generating historical metrics:', error);
    return false;
  }
};

/**
 * Executa todas as migrações necessárias
 */
export const runAllMigrations = (): void => {
  console.log('Starting database migrations...');

  try {
    const settingsMigrated = migrateLocalStorageSettings();
    const goalsMigrated = migrateLocalStorageGoals();
    const metricsMigrated = generateHistoricalMetrics();

    console.log('Migration summary:', {
      settingsMigrated,
      goalsMigrated,
      metricsMigrated
    });

    if (settingsMigrated || goalsMigrated || metricsMigrated) {
      console.log('✅ Database migrations completed successfully');
    } else {
      console.log('ℹ️ No data to migrate');
    }
  } catch (error) {
    console.error('❌ Error during migrations:', error);
  }
};

/**
 * Verifica se há dados antigos no localStorage que precisam ser migrados
 */
export const checkForLegacyData = (): { hasSettings: boolean; hasGoals: boolean; hasOtherData: boolean } => {
  const hasSettings = [
    'pomodoro_duration',
    'short_break_duration', 
    'long_break_duration',
    'theme_preference',
    'notification_settings'
  ].some(key => localStorage.getItem(key) !== null);

  const hasGoals = localStorage.getItem('study_goals') !== null;

  const hasOtherData = Object.keys(localStorage).some(key => 
    key.startsWith('study_') || 
    key.startsWith('pomodoro_') || 
    key.startsWith('theme_')
  );

  return { hasSettings, hasGoals, hasOtherData };
};