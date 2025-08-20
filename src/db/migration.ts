import { dbReady } from './singleton';
import { saveStudyPlan, saveStudySession, saveDailyLogs, saveNamedStudyPlan } from './db';
import { StudyPlan, StudySession } from '@/types/study';
import { runImagesMigration } from './imagesMigration';

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

export const migrateFromLocalStorage = async (): Promise<boolean> => {
  try {
    // Wait for database to be ready
    await dbReady;
    
    console.log('Starting migration from localStorage to SQLite...');
    
    // Run images migration for questions table
    runImagesMigration();

    // Check if migration has already been done
    if (localStorage.getItem('lovable_migration_completed')) {
      console.log('Migration already completed');
      return true;
    }

    let migrationSuccess = true;

    // Migrate active study plan
    const activePlanData = localStorage.getItem(STORAGE_KEYS.STUDY_PLAN);
    if (activePlanData) {
      try {
        const activePlan: StudyPlan = JSON.parse(activePlanData);
        const planId = saveStudyPlan(activePlan);
        console.log('Migrated active study plan:', planId);
      } catch (error) {
        console.error('Error migrating active study plan:', error);
        migrationSuccess = false;
      }
    }

    // Migrate saved plans
    const savedPlansData = localStorage.getItem(STORAGE_KEYS.SAVED_PLANS);
    if (savedPlansData) {
      try {
        const savedPlans: SavedPlan[] = JSON.parse(savedPlansData);
        for (const savedPlan of savedPlans) {
          const planId = saveNamedStudyPlan(savedPlan.plan, savedPlan.name);
          console.log('Migrated saved plan:', savedPlan.name, planId);
        }
      } catch (error) {
        console.error('Error migrating saved plans:', error);
        migrationSuccess = false;
      }
    }

    // Migrate study sessions
    const sessionsData = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
    if (sessionsData) {
      try {
        const sessions: StudySession[] = JSON.parse(sessionsData);
        for (const session of sessions) {
          // Convert string dates back to Date objects
          session.startTime = new Date(session.startTime);
          if (session.endTime) {
            session.endTime = new Date(session.endTime);
          }
          saveStudySession(session);
        }
        console.log('Migrated', sessions.length, 'study sessions');
      } catch (error) {
        console.error('Error migrating study sessions:', error);
        migrationSuccess = false;
      }
    }

    // Migrate daily logs
    const dailyLogsData = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    if (dailyLogsData) {
      try {
        const dailyLogs = JSON.parse(dailyLogsData);
        saveDailyLogs(dailyLogs);
        console.log('Migrated daily logs');
      } catch (error) {
        console.error('Error migrating daily logs:', error);
        migrationSuccess = false;
      }
    }

    if (migrationSuccess) {
      // Clear localStorage after successful migration
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });

      // Mark migration as completed
      localStorage.setItem('lovable_migration_completed', 'true');
      console.log('Migration completed successfully and localStorage cleared');
    } else {
      console.warn('Migration completed with some errors');
    }

    return migrationSuccess;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
};

export const checkMigrationStatus = (): boolean => {
  return localStorage.getItem('lovable_migration_completed') === 'true';
};

export const resetMigration = (): void => {
  localStorage.removeItem('lovable_migration_completed');
  console.log('Migration status reset. Next app load will trigger migration again.');
};