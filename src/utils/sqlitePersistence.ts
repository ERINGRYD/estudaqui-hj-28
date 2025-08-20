// SQLite-based persistence layer with IndexedDB support
import { StudyPlan, StudySession } from '@/types/study';
import { 
  saveStudyPlan as dbSaveStudyPlan,
  loadStudyPlan as dbLoadStudyPlan,
  deleteStudyPlan as dbDeleteStudyPlan,
  saveNamedStudyPlan,
  getSavedPlans as dbGetSavedPlans,
  getActivePlan as dbGetActivePlan,
  saveStudySession,
  loadStudySessions,
  saveDailyLogs as dbSaveDailyLogs,
  loadDailyLogs as dbLoadDailyLogs,
  exportDatabase,
  // New CRUD functions
  AppSetting,
  StudyGoal,
  PerformanceMetric,
  saveAppSetting,
  loadAppSetting,
  loadAppSettings,
  deleteAppSetting,
  saveTypedSetting,
  loadTypedSetting,
  saveStudyGoal,
  loadStudyGoal,
  loadStudyGoals,
  updateStudyGoalProgress,
  deleteStudyGoal,
  loadGoalsBySubject,
  loadUpcomingGoals,
  savePerformanceMetric,
  loadPerformanceMetric,
  loadPerformanceMetrics,
  deletePerformanceMetric,
  loadDailyMetrics,
  loadWeeklyMetrics,
  loadMonthlyMetrics,
  calculateDailyMetrics,
  // Review System
  upsertQuestionSchedule,
  getDueQuestionIds,
  getDueByEnemy,
  getReviewStats,
  getScheduleByQuestionId
} from '@/db/crud';
import { withDatabase, safeDatabaseOperation } from '@/utils/databaseUtils';

// Active study plan operations with safe database access
export const saveActiveStudyPlan = (plan: StudyPlan): void => {
  safeDatabaseOperation(() => {
    dbSaveStudyPlan(plan);
  });
};

export const loadActiveStudyPlan = (): StudyPlan | null => {
  return withDatabase(() => {
    const activePlan = dbGetActivePlan();
    return activePlan?.plan || null;
  }, null);
};

// Daily logs operations with safe database access
export const saveDailyLogs = (logs: any[]): void => {
  safeDatabaseOperation(() => {
    dbSaveDailyLogs(logs);
  });
};

export const loadDailyLogs = (): any[] => {
  return withDatabase(() => {
    return dbLoadDailyLogs();
  }, []);
};

// Advanced plan management
export const saveStudyPlan = (plan: StudyPlan, name: string): string => {
  try {
    return saveNamedStudyPlan(plan, name);
  } catch (error) {
    console.error('Error saving study plan:', error);
    return '';
  }
};

export const getSavedPlans = () => {
  try {
    return dbGetSavedPlans();
  } catch (error) {
    console.error('Error loading saved plans:', error);
    return [];
  }
};

export const loadStudyPlan = (planId: string): StudyPlan | null => {
  try {
    return dbLoadStudyPlan(planId);
  } catch (error) {
    console.error('Error loading study plan:', error);
    return null;
  }
};

export const deleteStudyPlan = (planId: string): boolean => {
  try {
    return dbDeleteStudyPlan(planId);
  } catch (error) {
    console.error('Error deleting study plan:', error);
    return false;
  }
};

export const getActivePlan = () => {
  try {
    return dbGetActivePlan();
  } catch (error) {
    console.error('Error getting active plan:', error);
    return null;
  }
};

// Study sessions
export const saveStudySessionData = (session: StudySession): void => {
  try {
    saveStudySession(session);
  } catch (error) {
    console.error('Error saving study session:', error);
  }
};

export const loadStudySessionsData = (): StudySession[] => {
  try {
    return loadStudySessions();
  } catch (error) {
    console.error('Error loading study sessions:', error);
    return [];
  }
};

// Export/Import functionality
export const exportStudyPlan = (planId: string): string | null => {
  try {
    const plan = loadStudyPlan(planId);
    if (plan) {
      const exportData = {
        plan,
        exportedAt: new Date()
      };
      return JSON.stringify(exportData, null, 2);
    }
    return null;
  } catch (error) {
    console.error('Error exporting study plan:', error);
    return null;
  }
};

export const importStudyPlan = (jsonData: string): string | null => {
  try {
    const importData = JSON.parse(jsonData);
    const planId = `imported_${Date.now()}`;
    const planName = `Imported Plan (${new Date().toLocaleDateString()})`;
    
    const plan: StudyPlan = { ...importData.plan, id: planId };
    return saveStudyPlan(plan, planName);
  } catch (error) {
    console.error('Error importing study plan:', error);
    return null;
  }
};

// Database backup and recovery
export const createBackup = (): Blob => {
  try {
    return exportDatabase();
  } catch (error) {
    console.error('Error creating backup:', error);
    throw error;
  }
};

// Re-export new CRUD functions for convenience
export {
  // App Settings
  saveAppSetting,
  loadAppSetting,
  loadAppSettings,
  deleteAppSetting,
  saveTypedSetting,
  loadTypedSetting,
  
  // Study Goals
  saveStudyGoal,
  loadStudyGoal,
  loadStudyGoals,
  updateStudyGoalProgress,
  deleteStudyGoal,
  loadGoalsBySubject,
  loadUpcomingGoals,
  
  // Performance Metrics
  savePerformanceMetric,
  loadPerformanceMetric,
  loadPerformanceMetrics,
  deletePerformanceMetric,
  loadDailyMetrics,
  loadWeeklyMetrics,
  loadMonthlyMetrics,
  calculateDailyMetrics,
  
  // Review System
  upsertQuestionSchedule,
  getDueQuestionIds,
  getDueByEnemy,
  getReviewStats,
  getScheduleByQuestionId
};

// Re-export types
export type { AppSetting, StudyGoal, PerformanceMetric };
export type { ReviewSchedule, ReviewContext, DueReviewSummary, ReviewStats } from '@/types/review';
