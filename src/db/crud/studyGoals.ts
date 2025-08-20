import { getDBOrThrow, getScheduleSave } from '../singleton';

export interface StudyGoal {
  id: string;
  title: string;
  description?: string;
  targetType: 'hours' | 'sessions' | 'topics' | 'subjects';
  targetValue: number;
  currentValue: number;
  deadline?: Date;
  priority: number;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  category?: string;
  subjectId?: string;
  topicId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Salva uma meta de estudo no banco de dados.
 * Automaticamente persiste no IndexedDB.
 */
export const saveStudyGoal = (goal: Omit<StudyGoal, 'createdAt' | 'updatedAt'>): string => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();
  const goalId = goal.id || `goal_${Date.now()}`;

  try {
    database.run(`
      INSERT OR REPLACE INTO study_goals (
        id, title, description, target_type, target_value, current_value,
        deadline, priority, status, category, subject_id, topic_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      goalId,
      goal.title,
      goal.description || null,
      goal.targetType,
      goal.targetValue,
      goal.currentValue,
      goal.deadline ? goal.deadline.toISOString() : null,
      goal.priority,
      goal.status,
      goal.category || null,
      goal.subjectId || null,
      goal.topicId || null
    ]);

    scheduleSave();
    return goalId;
  } catch (error) {
    console.error('Error saving study goal:', error);
    throw error;
  }
};

/**
 * Carrega uma meta de estudo por ID.
 */
export const loadStudyGoal = (goalId: string): StudyGoal | null => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare('SELECT * FROM study_goals WHERE id = ?');
    const result = stmt.getAsObject([goalId]);
    stmt.free();

    if (!result.id) return null;

    return {
      id: result.id as string,
      title: result.title as string,
      description: result.description as string || undefined,
      targetType: result.target_type as StudyGoal['targetType'],
      targetValue: result.target_value as number,
      currentValue: result.current_value as number,
      deadline: result.deadline ? new Date(result.deadline as string) : undefined,
      priority: result.priority as number,
      status: result.status as StudyGoal['status'],
      category: result.category as string || undefined,
      subjectId: result.subject_id as string || undefined,
      topicId: result.topic_id as string || undefined,
      createdAt: new Date(result.created_at as string),
      updatedAt: new Date(result.updated_at as string)
    };
  } catch (error) {
    console.error('Error loading study goal:', error);
    return null;
  }
};

/**
 * Carrega todas as metas de estudo ou filtradas por status.
 */
export const loadStudyGoals = (status?: StudyGoal['status']): StudyGoal[] => {
  const database = getDBOrThrow();

  try {
    const query = status 
      ? 'SELECT * FROM study_goals WHERE status = ? ORDER BY priority DESC, deadline ASC'
      : 'SELECT * FROM study_goals ORDER BY status, priority DESC, deadline ASC';
    
    const stmt = database.prepare(query);
    const results: StudyGoal[] = [];
    
    if (status) {
      stmt.bind([status]);
    }

    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        title: row.title as string,
        description: row.description as string || undefined,
        targetType: row.target_type as StudyGoal['targetType'],
        targetValue: row.target_value as number,
        currentValue: row.current_value as number,
        deadline: row.deadline ? new Date(row.deadline as string) : undefined,
        priority: row.priority as number,
        status: row.status as StudyGoal['status'],
        category: row.category as string || undefined,
        subjectId: row.subject_id as string || undefined,
        topicId: row.topic_id as string || undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading study goals:', error);
    return [];
  }
};

/**
 * Atualiza o progresso de uma meta de estudo.
 */
export const updateStudyGoalProgress = (goalId: string, currentValue: number): boolean => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    const stmt = database.prepare('SELECT target_value FROM study_goals WHERE id = ?');
    const result = stmt.getAsObject([goalId]);
    stmt.free();

    if (!result.target_value) return false;

    const targetValue = result.target_value as number;
    const newStatus = currentValue >= targetValue ? 'completed' : 'active';

    database.run(
      'UPDATE study_goals SET current_value = ?, status = ? WHERE id = ?',
      [currentValue, newStatus, goalId]
    );

    scheduleSave();
    return true;
  } catch (error) {
    console.error('Error updating study goal progress:', error);
    return false;
  }
};

/**
 * Remove uma meta de estudo.
 */
export const deleteStudyGoal = (goalId: string): boolean => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    database.run('DELETE FROM study_goals WHERE id = ?', [goalId]);
    scheduleSave();
    return true;
  } catch (error) {
    console.error('Error deleting study goal:', error);
    return false;
  }
};

/**
 * Carrega metas relacionadas a uma matéria específica.
 */
export const loadGoalsBySubject = (subjectId: string): StudyGoal[] => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(
      'SELECT * FROM study_goals WHERE subject_id = ? ORDER BY priority DESC, deadline ASC'
    );
    const results: StudyGoal[] = [];
    
    stmt.bind([subjectId]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        title: row.title as string,
        description: row.description as string || undefined,
        targetType: row.target_type as StudyGoal['targetType'],
        targetValue: row.target_value as number,
        currentValue: row.current_value as number,
        deadline: row.deadline ? new Date(row.deadline as string) : undefined,
        priority: row.priority as number,
        status: row.status as StudyGoal['status'],
        category: row.category as string || undefined,
        subjectId: row.subject_id as string || undefined,
        topicId: row.topic_id as string || undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading goals by subject:', error);
    return [];
  }
};

/**
 * Carrega metas próximas do prazo (próximos 7 dias).
 */
export const loadUpcomingGoals = (): StudyGoal[] => {
  const database = getDBOrThrow();
  const oneWeekFromNow = new Date();
  oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

  try {
    const stmt = database.prepare(`
      SELECT * FROM study_goals 
      WHERE deadline IS NOT NULL 
      AND deadline <= ? 
      AND status = 'active'
      ORDER BY deadline ASC
    `);
    const results: StudyGoal[] = [];
    
    stmt.bind([oneWeekFromNow.toISOString()]);
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        title: row.title as string,
        description: row.description as string || undefined,
        targetType: row.target_type as StudyGoal['targetType'],
        targetValue: row.target_value as number,
        currentValue: row.current_value as number,
        deadline: row.deadline ? new Date(row.deadline as string) : undefined,
        priority: row.priority as number,
        status: row.status as StudyGoal['status'],
        category: row.category as string || undefined,
        subjectId: row.subject_id as string || undefined,
        topicId: row.topic_id as string || undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading upcoming goals:', error);
    return [];
  }
};