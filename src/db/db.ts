import { Database } from 'sql.js';
import { StudyPlan, StudySubject, StudyTopic, StudySubtopic, StudySession } from '@/types/study';
import { dbReady, getDBOrThrow, getScheduleSave } from './singleton';

// Get database instance - now uses singleton
const getDB = (): Database => {
  return getDBOrThrow();
};


// Study Plan CRUD Operations
export const saveStudyPlan = (plan: StudyPlan): string => {
  const database = getDB();
  const planId = plan.id || `plan_${Date.now()}`;

  try {
    database.run(`
      INSERT OR REPLACE INTO study_plans (
        id, type, exam_date, days_until_exam, total_hours, focus_areas,
        intensity, methodology, weekly_hour_limit, data, cycle_data, weekly_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      planId,
      plan.type,
      plan.examDate ? new Date(plan.examDate).toISOString() : null,
      plan.daysUntilExam || null,
      plan.totalHours,
      JSON.stringify(plan.focusAreas || []),
      plan.intensity || null,
      plan.methodology || null,
      plan.weeklyHourLimit || null,
      JSON.stringify(plan.data || {}),
      JSON.stringify(plan.cycle || []),
      JSON.stringify(plan.weekly || [])
    ]);

    // Save subjects
    plan.subjects.forEach(subject => {
      saveStudySubject(subject, planId);
    });

    // Persist to IndexedDB
    const scheduleSave = getScheduleSave();
    scheduleSave();
    return planId;
  } catch (error) {
    console.error('Error saving study plan:', error);
    throw error;
  }
};

export const loadStudyPlan = (planId: string): StudyPlan | null => {
  const database = getDB();

  try {
    const stmt = database.prepare('SELECT * FROM study_plans WHERE id = ?');
    const result = stmt.getAsObject([planId]);
    stmt.free();

    if (!result.id) return null;

    const subjects = loadStudySubjects(planId);

    return {
      id: result.id as string,
      type: result.type as 'cycle' | 'schedule',
      examDate: result.exam_date ? new Date(result.exam_date as string) : undefined,
      daysUntilExam: result.days_until_exam as number || undefined,
      subjects,
      totalHours: result.total_hours as number,
      focusAreas: JSON.parse(result.focus_areas as string || '[]'),
      intensity: result.intensity as 'low' | 'medium' | 'high' || undefined,
      methodology: result.methodology as 'pomodoro' | 'timeboxing' | 'custom' || undefined,
      weeklyHourLimit: result.weekly_hour_limit as number || undefined,
      data: JSON.parse(result.data as string || '{}'),
      cycle: JSON.parse(result.cycle_data as string || '[]'),
      weekly: JSON.parse(result.weekly_data as string || '[]')
    };
  } catch (error) {
    console.error('Error loading study plan:', error);
    return null;
  }
};

export const deleteStudyPlan = (planId: string): boolean => {
  const database = getDB();

  try {
    database.run('DELETE FROM study_plans WHERE id = ?', [planId]);
    // Persist to IndexedDB
    const scheduleSave = getScheduleSave();
    scheduleSave();
    return true;
  } catch (error) {
    console.error('Error deleting study plan:', error);
    return false;
  }
};

// Study Subject CRUD Operations
const saveStudySubject = (subject: StudySubject, planId: string): void => {
  const database = getDB();

  try {
    database.run(`
      INSERT OR REPLACE INTO study_subjects (
        id, plan_id, name, weight, level, color, priority, last_studied, total_time, custom_subject
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      subject.id,
      planId,
      subject.name,
      subject.weight || 1.0,
      subject.level || null,
      subject.color || null,
      subject.priority || 0,
      subject.lastStudied ? new Date(subject.lastStudied).toISOString() : null,
      subject.totalTime || 0,
      subject.customSubject || false
    ]);

    // Save topics
    subject.topics?.forEach(topic => {
      saveStudyTopic(topic, subject.id);
    });
  } catch (error) {
    console.error('Error saving study subject:', error);
    throw error;
  }
};

const loadStudySubjects = (planId: string): StudySubject[] => {
  const database = getDB();

  try {
    const stmt = database.prepare('SELECT * FROM study_subjects WHERE plan_id = ?');
    const results = [];
    
    stmt.bind([planId]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const topics = loadStudyTopics(row.id as string);
      
      results.push({
        id: row.id as string,
        name: row.name as string,
        topics,
        weight: row.weight as number,
        level: row.level as 'beginner' | 'intermediate' | 'advanced' || undefined,
        color: row.color as string || undefined,
        priority: row.priority as number,
        lastStudied: row.last_studied ? new Date(row.last_studied as string) : undefined,
        totalTime: row.total_time as number,
        customSubject: Boolean(row.custom_subject)
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading study subjects:', error);
    return [];
  }
};

// Study Topic CRUD Operations
const saveStudyTopic = (topic: StudyTopic, subjectId: string): void => {
  const database = getDB();

  try {
    database.run(`
      INSERT OR REPLACE INTO study_topics (
        id, subject_id, name, weight, completed, last_studied, total_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      topic.id,
      subjectId,
      topic.name,
      topic.weight || 1.0,
      topic.completed || false,
      topic.lastStudied ? new Date(topic.lastStudied).toISOString() : null,
      topic.totalTime || 0
    ]);

    // Save subtopics
    topic.subtopics?.forEach(subtopic => {
      saveStudySubtopic(subtopic, topic.id);
    });
  } catch (error) {
    console.error('Error saving study topic:', error);
    throw error;
  }
};

const loadStudyTopics = (subjectId: string): StudyTopic[] => {
  const database = getDB();

  try {
    const stmt = database.prepare('SELECT * FROM study_topics WHERE subject_id = ?');
    const results = [];
    
    stmt.bind([subjectId]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const subtopics = loadStudySubtopics(row.id as string);
      
      results.push({
        id: row.id as string,
        name: row.name as string,
        subjectId: row.subject_id as string,
        subtopics,
        weight: row.weight as number,
        completed: Boolean(row.completed),
        lastStudied: row.last_studied ? new Date(row.last_studied as string) : undefined,
        totalTime: row.total_time as number
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading study topics:', error);
    return [];
  }
};

// Study Subtopic CRUD Operations
const saveStudySubtopic = (subtopic: StudySubtopic, topicId: string): void => {
  const database = getDB();

  try {
    database.run(`
      INSERT OR REPLACE INTO study_subtopics (
        id, topic_id, name, weight, completed, last_studied, total_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      subtopic.id,
      topicId,
      subtopic.name,
      subtopic.weight || 1.0,
      subtopic.completed || false,
      subtopic.lastStudied ? new Date(subtopic.lastStudied).toISOString() : null,
      subtopic.totalTime || 0
    ]);
  } catch (error) {
    console.error('Error saving study subtopic:', error);
    throw error;
  }
};

const loadStudySubtopics = (topicId: string): StudySubtopic[] => {
  const database = getDB();

  try {
    const stmt = database.prepare('SELECT * FROM study_subtopics WHERE topic_id = ?');
    const results = [];
    
    stmt.bind([topicId]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      
      results.push({
        id: row.id as string,
        name: row.name as string,
        topicId: row.topic_id as string,
        weight: row.weight as number,
        completed: Boolean(row.completed),
        lastStudied: row.last_studied ? new Date(row.last_studied as string) : undefined,
        totalTime: row.total_time as number
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading study subtopics:', error);
    return [];
  }
};

// Study Session CRUD Operations
export const saveStudySession = (session: StudySession): void => {
  const database = getDB();

  try {
    database.run(`
      INSERT OR REPLACE INTO study_sessions (
        id, subject, topic, subtopic, start_time, end_time, duration, completed, notes, performance, task_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      session.id,
      session.subject,
      session.topic || null,
      session.subtopic || null,
      session.startTime.toISOString(),
      session.endTime ? new Date(session.endTime).toISOString() : null,
      session.duration,
      session.completed,
      session.notes || null,
      session.performance || null,
      session.taskId || null
    ]);

    // Persist to IndexedDB
    const scheduleSave = getScheduleSave();
    scheduleSave();
  } catch (error) {
    console.error('Error saving study session:', error);
    throw error;
  }
};

export const loadStudySessions = (): StudySession[] => {
  const database = getDB();

  try {
    const stmt = database.prepare('SELECT * FROM study_sessions ORDER BY start_time DESC');
    const results = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      
      results.push({
        id: row.id as string,
        subject: row.subject as string,
        topic: row.topic as string || undefined,
        subtopic: row.subtopic as string || undefined,
        startTime: new Date(row.start_time as string),
        endTime: row.end_time ? new Date(row.end_time as string) : undefined,
        duration: row.duration as number,
        completed: Boolean(row.completed),
        notes: row.notes as string || undefined,
        performance: row.performance as 'low' | 'medium' | 'high' || undefined,
        taskId: row.task_id as string || undefined
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading study sessions:', error);
    return [];
  }
};

// Saved Plans Management
export const saveNamedStudyPlan = (plan: StudyPlan, name: string): string => {
  const database = getDB();
  const planId = saveStudyPlan(plan);

  try {
    // Mark other plans as inactive
    database.run('UPDATE saved_plans SET is_active = FALSE');

    // Save named plan
    database.run(`
      INSERT OR REPLACE INTO saved_plans (id, name, plan_id, is_active)
      VALUES (?, ?, ?, TRUE)
    `, [planId, name, planId]);

    // Persist to IndexedDB
    const scheduleSave = getScheduleSave();
    scheduleSave();
    return planId;
  } catch (error) {
    console.error('Error saving named study plan:', error);
    throw error;
  }
};

export const getSavedPlans = () => {
  const database = getDB();

  try {
    const stmt = database.prepare(`
      SELECT sp.*, p.type, p.exam_date, p.total_hours 
      FROM saved_plans sp
      JOIN study_plans p ON sp.plan_id = p.id
      ORDER BY sp.updated_at DESC
    `);
    const results = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      
      results.push({
        id: row.id as string,
        name: row.name as string,
        plan: {
          id: row.plan_id as string,
          type: row.type as string,
          examDate: row.exam_date ? new Date(row.exam_date as string) : undefined,
          totalHours: row.total_hours as number
        },
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        isActive: Boolean(row.is_active)
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting saved plans:', error);
    return [];
  }
};

export const getActivePlan = () => {
  const database = getDB();

  try {
    const stmt = database.prepare('SELECT * FROM saved_plans WHERE is_active = TRUE LIMIT 1');
    const result = stmt.getAsObject();
    stmt.free();

    if (!result.id) return null;

    const plan = loadStudyPlan(result.plan_id as string);
    return plan ? {
      id: result.id as string,
      name: result.name as string,
      plan,
      createdAt: new Date(result.created_at as string),
      updatedAt: new Date(result.updated_at as string),
      isActive: true
    } : null;
  } catch (error) {
    console.error('Error getting active plan:', error);
    return null;
  }
};

// Daily Logs
export const saveDailyLogs = (logs: any[]): void => {
  const database = getDB();

  try {
    // Clear existing logs
    database.run('DELETE FROM daily_logs');
    
    // Save new logs
    logs.forEach((log, index) => {
      database.run(`
        INSERT INTO daily_logs (id, date, data)
        VALUES (?, ?, ?)
      `, [`log_${index}`, log.date || new Date().toISOString(), JSON.stringify(log)]);
    });

    // Persist to IndexedDB
    const scheduleSave = getScheduleSave();
    scheduleSave();
  } catch (error) {
    console.error('Error saving daily logs:', error);
    throw error;
  }
};

export const loadDailyLogs = (): any[] => {
  const database = getDB();

  try {
    const stmt = database.prepare('SELECT * FROM daily_logs ORDER BY date DESC');
    const results = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(JSON.parse(row.data as string));
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading daily logs:', error);
    return [];
  }
};

// Export/Import Database
export const exportDatabase = (): Blob => {
  const database = getDB();
  const uint8Array = database.export();
  return new Blob([uint8Array], { type: 'application/x-sqlite3' });
};

// Import functionality removed - handled by DBProvider context

// Database utilities for viewer
export const getAllTables = (): string[] => {
  const database = getDB();
  
  try {
    const stmt = database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const results = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row.name as string);
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting tables:', error);
    return [];
  }
};

export const getTableData = (tableName: string, limit = 100, offset = 0) => {
  const database = getDB();
  
  try {
    const stmt = database.prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`);
    const results = [];
    
    stmt.bind([limit, offset]);
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting table data:', error);
    return [];
  }
};

export const getTableCount = (tableName: string): number => {
  const database = getDB();
  
  try {
    const stmt = database.prepare(`SELECT COUNT(*) as count FROM ${tableName}`);
    const result = stmt.getAsObject();
    stmt.free();

    return result.count as number;
  } catch (error) {
    console.error('Error getting table count:', error);
    return 0;
  }
};