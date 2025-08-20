import { StudyPlan, StudySession } from '@/types/study';

const STORAGE_KEYS = {
  STUDY_PLAN: 'lovable_study_plan',
  DAILY_LOGS: 'lovable_daily_logs',
  STUDY_SESSIONS: 'lovable_study_sessions',
  ACTIVE_PLAN_ID: 'lovable_active_plan_id',
  SAVED_PLANS: 'lovable_saved_plans',
  BACKUP_DATA: 'lovable_backup_data'
};

interface SavedPlan {
  id: string;
  name: string;
  plan: StudyPlan;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

interface BackupData {
  plans: SavedPlan[];
  dailyLogs: any[];
  sessions: StudySession[];
  timestamp: Date;
}

// Basic persistence functions
export const saveActiveStudyPlan = (plan: StudyPlan) => {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDY_PLAN, JSON.stringify(plan));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PLAN_ID, plan.id || 'default');
  } catch (error) {
    console.error('Error saving study plan:', error);
  }
};

export const loadActiveStudyPlan = (): StudyPlan | null => {
  try {
    const planData = localStorage.getItem(STORAGE_KEYS.STUDY_PLAN);
    return planData ? JSON.parse(planData) : null;
  } catch (error) {
    console.error('Error loading study plan:', error);
    return null;
  }
};

export const saveDailyLogs = (logs: any[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
  } catch (error) {
    console.error('Error saving daily logs:', error);
  }
};

export const loadDailyLogs = (): any[] => {
  try {
    const logsData = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    return logsData ? JSON.parse(logsData) : [];
  } catch (error) {
    console.error('Error loading daily logs:', error);
    return [];
  }
};

// Advanced plan management
export const saveStudyPlan = (plan: StudyPlan, name: string): string => {
  try {
    const savedPlans = getSavedPlans();
    const planId = plan.id || `plan_${Date.now()}`;
    
    const savedPlan: SavedPlan = {
      id: planId,
      name,
      plan: { ...plan, id: planId },
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    // Mark other plans as inactive
    savedPlans.forEach(p => p.isActive = false);
    
    const existingIndex = savedPlans.findIndex(p => p.id === planId);
    if (existingIndex >= 0) {
      savedPlans[existingIndex] = savedPlan;
    } else {
      savedPlans.push(savedPlan);
    }

    localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(savedPlans));
    saveActiveStudyPlan(savedPlan.plan);
    
    return planId;
  } catch (error) {
    console.error('Error saving study plan:', error);
    return '';
  }
};

export const getSavedPlans = (): SavedPlan[] => {
  try {
    const plansData = localStorage.getItem(STORAGE_KEYS.SAVED_PLANS);
    return plansData ? JSON.parse(plansData) : [];
  } catch (error) {
    console.error('Error loading saved plans:', error);
    return [];
  }
};

export const loadStudyPlan = (planId: string): StudyPlan | null => {
  try {
    const savedPlans = getSavedPlans();
    const plan = savedPlans.find(p => p.id === planId);
    
    if (plan) {
      // Mark as active
      savedPlans.forEach(p => p.isActive = p.id === planId);
      localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(savedPlans));
      saveActiveStudyPlan(plan.plan);
      return plan.plan;
    }
    return null;
  } catch (error) {
    console.error('Error loading study plan:', error);
    return null;
  }
};

export const deleteStudyPlan = (planId: string): boolean => {
  try {
    const savedPlans = getSavedPlans();
    const filteredPlans = savedPlans.filter(p => p.id !== planId);
    localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(filteredPlans));
    
    // If deleted plan was active, clear active plan
    if (savedPlans.some(p => p.id === planId && p.isActive)) {
      localStorage.removeItem(STORAGE_KEYS.STUDY_PLAN);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PLAN_ID);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting study plan:', error);
    return false;
  }
};

export const getActivePlan = (): SavedPlan | null => {
  try {
    const savedPlans = getSavedPlans();
    return savedPlans.find(p => p.isActive) || null;
  } catch (error) {
    console.error('Error getting active plan:', error);
    return null;
  }
};

// Export/Import functionality
export const exportStudyPlan = (planId: string): string | null => {
  try {
    const savedPlans = getSavedPlans();
    const plan = savedPlans.find(p => p.id === planId);
    
    if (plan) {
      const exportData = {
        plan: plan.plan,
        name: plan.name,
        createdAt: plan.createdAt,
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
    
    const savedPlan: SavedPlan = {
      id: planId,
      name: `${importData.name} (Imported)`,
      plan: { ...importData.plan, id: planId },
      createdAt: new Date(importData.createdAt) || new Date(),
      updatedAt: new Date(),
      isActive: false
    };

    const savedPlans = getSavedPlans();
    savedPlans.push(savedPlan);
    localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(savedPlans));
    
    return planId;
  } catch (error) {
    console.error('Error importing study plan:', error);
    return null;
  }
};

// Backup and recovery
export const createBackup = (): string => {
  try {
    const backupData: BackupData = {
      plans: getSavedPlans(),
      dailyLogs: loadDailyLogs(),
      sessions: JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS) || '[]'),
      timestamp: new Date()
    };
    
    const backupString = JSON.stringify(backupData, null, 2);
    localStorage.setItem(STORAGE_KEYS.BACKUP_DATA, backupString);
    
    return backupString;
  } catch (error) {
    console.error('Error creating backup:', error);
    return '';
  }
};

export const restoreFromBackup = (backupData: string): boolean => {
  try {
    const data: BackupData = JSON.parse(backupData);
    
    localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(data.plans));
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(data.dailyLogs));
    localStorage.setItem(STORAGE_KEYS.STUDY_SESSIONS, JSON.stringify(data.sessions));
    
    // Set the most recent active plan
    const activePlan = data.plans.find(p => p.isActive);
    if (activePlan) {
      saveActiveStudyPlan(activePlan.plan);
    }
    
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return false;
  }
};

// Data validation and repair
export const validateAndRepairData = (): boolean => {
  try {
    // Check and repair saved plans
    const savedPlans = getSavedPlans();
    let needsRepair = false;
    
    savedPlans.forEach(plan => {
      if (!plan.id) {
        plan.id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        needsRepair = true;
      }
      if (!plan.createdAt) {
        plan.createdAt = new Date();
        needsRepair = true;
      }
      if (!plan.updatedAt) {
        plan.updatedAt = new Date();
        needsRepair = true;
      }
    });
    
    if (needsRepair) {
      localStorage.setItem(STORAGE_KEYS.SAVED_PLANS, JSON.stringify(savedPlans));
    }
    
    return true;
  } catch (error) {
    console.error('Error validating and repairing data:', error);
    return false;
  }
};

export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};