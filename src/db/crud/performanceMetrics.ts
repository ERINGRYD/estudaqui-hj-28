import { getDBOrThrow, getScheduleSave } from '../singleton';

export interface PerformanceMetric {
  id: string;
  metricType: 'daily' | 'weekly' | 'monthly' | 'session';
  metricDate: string; // ISO date (YYYY-MM-DD for daily/weekly/monthly, datetime for session)
  studyTime: number; // in minutes
  sessionsCount: number;
  subjectsStudied: number;
  topicsCompleted: number;
  pomodorosCompleted: number;
  averageSessionDuration: number;
  focusScore: number; // 0-100 scale
  productivityScore: number; // 0-100 scale
  streakDays: number;
  subjectBreakdown: Record<string, number>; // subject_name: time_spent
  performanceData: Record<string, any>; // additional metrics
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Salva uma métrica de performance no banco de dados.
 * Automaticamente persiste no IndexedDB.
 */
export const savePerformanceMetric = (metric: Omit<PerformanceMetric, 'createdAt' | 'updatedAt'>): string => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();
  const metricId = metric.id || `metric_${Date.now()}`;

  try {
    database.run(`
      INSERT OR REPLACE INTO performance_metrics (
        id, metric_type, metric_date, study_time, sessions_count, subjects_studied,
        topics_completed, pomodoros_completed, average_session_duration, focus_score,
        productivity_score, streak_days, subject_breakdown, performance_data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      metricId,
      metric.metricType,
      metric.metricDate,
      metric.studyTime,
      metric.sessionsCount,
      metric.subjectsStudied,
      metric.topicsCompleted,
      metric.pomodorosCompleted,
      metric.averageSessionDuration,
      metric.focusScore,
      metric.productivityScore,
      metric.streakDays,
      JSON.stringify(metric.subjectBreakdown),
      JSON.stringify(metric.performanceData)
    ]);

    scheduleSave();
    return metricId;
  } catch (error) {
    console.error('Error saving performance metric:', error);
    throw error;
  }
};

/**
 * Carrega uma métrica de performance por ID.
 */
export const loadPerformanceMetric = (metricId: string): PerformanceMetric | null => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare('SELECT * FROM performance_metrics WHERE id = ?');
    const result = stmt.getAsObject([metricId]);
    stmt.free();

    if (!result.id) return null;

    return {
      id: result.id as string,
      metricType: result.metric_type as PerformanceMetric['metricType'],
      metricDate: result.metric_date as string,
      studyTime: result.study_time as number,
      sessionsCount: result.sessions_count as number,
      subjectsStudied: result.subjects_studied as number,
      topicsCompleted: result.topics_completed as number,
      pomodorosCompleted: result.pomodoros_completed as number,
      averageSessionDuration: result.average_session_duration as number,
      focusScore: result.focus_score as number,
      productivityScore: result.productivity_score as number,
      streakDays: result.streak_days as number,
      subjectBreakdown: JSON.parse(result.subject_breakdown as string || '{}'),
      performanceData: JSON.parse(result.performance_data as string || '{}'),
      createdAt: new Date(result.created_at as string),
      updatedAt: new Date(result.updated_at as string)
    };
  } catch (error) {
    console.error('Error loading performance metric:', error);
    return null;
  }
};

/**
 * Carrega métricas de performance por tipo e período.
 */
export const loadPerformanceMetrics = (
  metricType?: PerformanceMetric['metricType'],
  startDate?: string,
  endDate?: string
): PerformanceMetric[] => {
  const database = getDBOrThrow();

  try {
    let query = 'SELECT * FROM performance_metrics';
    const params: any[] = [];
    const conditions: string[] = [];

    if (metricType) {
      conditions.push('metric_type = ?');
      params.push(metricType);
    }

    if (startDate) {
      conditions.push('metric_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      conditions.push('metric_date <= ?');
      params.push(endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY metric_date DESC';

    const stmt = database.prepare(query);
    const results: PerformanceMetric[] = [];
    
    if (params.length > 0) {
      stmt.bind(params);
    }

    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        metricType: row.metric_type as PerformanceMetric['metricType'],
        metricDate: row.metric_date as string,
        studyTime: row.study_time as number,
        sessionsCount: row.sessions_count as number,
        subjectsStudied: row.subjects_studied as number,
        topicsCompleted: row.topics_completed as number,
        pomodorosCompleted: row.pomodoros_completed as number,
        averageSessionDuration: row.average_session_duration as number,
        focusScore: row.focus_score as number,
        productivityScore: row.productivity_score as number,
        streakDays: row.streak_days as number,
        subjectBreakdown: JSON.parse(row.subject_breakdown as string || '{}'),
        performanceData: JSON.parse(row.performance_data as string || '{}'),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading performance metrics:', error);
    return [];
  }
};

/**
 * Remove uma métrica de performance.
 */
export const deletePerformanceMetric = (metricId: string): boolean => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    database.run('DELETE FROM performance_metrics WHERE id = ?', [metricId]);
    scheduleSave();
    return true;
  } catch (error) {
    console.error('Error deleting performance metric:', error);
    return false;
  }
};

/**
 * Carrega métricas diárias dos últimos N dias.
 */
export const loadDailyMetrics = (days: number = 30): PerformanceMetric[] => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return loadPerformanceMetrics(
    'daily',
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
};

/**
 * Carrega métricas semanais dos últimos N meses.
 */
export const loadWeeklyMetrics = (weeks: number = 12): PerformanceMetric[] => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));

  return loadPerformanceMetrics(
    'weekly',
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
};

/**
 * Carrega métricas mensais do último ano.
 */
export const loadMonthlyMetrics = (): PerformanceMetric[] => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);

  return loadPerformanceMetrics(
    'monthly',
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0]
  );
};

/**
 * Utilitário para calcular métricas diárias automaticamente com base nas sessões.
 */
export const calculateDailyMetrics = (date: string): PerformanceMetric => {
  const database = getDBOrThrow();

  try {
    // Get sessions for the specific date
    const stmt = database.prepare(`
      SELECT * FROM study_sessions 
      WHERE date(start_time) = ? 
      AND completed = 1
    `);
    
    const sessions: any[] = [];
    stmt.bind([date]);
    while (stmt.step()) {
      sessions.push(stmt.getAsObject());
    }
    stmt.free();

    // Calculate metrics
    const studyTime = sessions.reduce((total, session) => total + (session.duration || 0), 0);
    const sessionsCount = sessions.length;
    const uniqueSubjects = new Set(sessions.map(s => s.subject)).size;
    const subjectBreakdown: Record<string, number> = {};

    sessions.forEach(session => {
      const subject = session.subject as string;
      subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + (session.duration || 0);
    });

    const averageSessionDuration = sessionsCount > 0 ? studyTime / sessionsCount : 0;
    
    // Calculate focus score based on completed vs started sessions
    const allSessions = [];
    const allStmt = database.prepare(`
      SELECT * FROM study_sessions 
      WHERE date(start_time) = ?
    `);
    allStmt.bind([date]);
    while (allStmt.step()) {
      allSessions.push(allStmt.getAsObject());
    }
    allStmt.free();

    const focusScore = allSessions.length > 0 ? (sessionsCount / allSessions.length) * 100 : 100;
    const productivityScore = studyTime > 0 ? Math.min((studyTime / 480) * 100, 100) : 0; // 8 hours = 100%

    return {
      id: `daily_${date}`,
      metricType: 'daily',
      metricDate: date,
      studyTime,
      sessionsCount,
      subjectsStudied: uniqueSubjects,
      topicsCompleted: 0, // Would need topic completion tracking
      pomodorosCompleted: 0, // Would need pomodoro session tracking
      averageSessionDuration,
      focusScore,
      productivityScore,
      streakDays: 0, // Would need streak calculation
      subjectBreakdown,
      performanceData: {
        totalSessionsStarted: allSessions.length,
        completionRate: focusScore / 100
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error calculating daily metrics:', error);
    // Return empty metrics
    return {
      id: `daily_${date}`,
      metricType: 'daily',
      metricDate: date,
      studyTime: 0,
      sessionsCount: 0,
      subjectsStudied: 0,
      topicsCompleted: 0,
      pomodorosCompleted: 0,
      averageSessionDuration: 0,
      focusScore: 0,
      productivityScore: 0,
      streakDays: 0,
      subjectBreakdown: {},
      performanceData: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};