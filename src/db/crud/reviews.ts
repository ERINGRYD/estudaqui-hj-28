import { getDBOrThrow, getScheduleSave } from '../singleton';
import { ReviewSchedule, ReviewContext, DueReviewSummary, ReviewStats } from '@/types/review';
import { Question } from '@/types/battle';
import { computeNextSchedule } from '@/utils/spacedRepetition';

// Ensure table exists
export function ensureReviewTable(): void {
  const db = getDBOrThrow();
  
  // The table creation is handled in schema.sql, but we can verify it exists
  try {
    const stmt = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='review_schedules'
    `);
    
    if (!stmt.step()) {
      console.warn('Review schedules table not found - it should be created by schema.sql');
    }
    stmt.free();
  } catch (error) {
    console.warn('Error checking review table:', error);
  }
}

export function upsertQuestionSchedule(question: Question, context: ReviewContext): ReviewSchedule {
  const db = getDBOrThrow();
  const scheduleSave = getScheduleSave();
  ensureReviewTable();
  
  // Get existing schedule
  const stmt = db.prepare(`
    SELECT * FROM review_schedules 
    WHERE item_type = 'question' AND item_id = ?
  `);
  
  stmt.bind([question.id]);
  const existing = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  let previousSchedule = null;
  
  if (existing) {
    previousSchedule = {
      repetitions: existing[5] as number,
      intervalDays: existing[6] as number,
      easeFactor: existing[7] as number,
      correctStreak: existing[8] as number
    };
  }
  
  // Compute next schedule
  const nextSchedule = computeNextSchedule(previousSchedule, context);
  
  const now = new Date().toISOString();
  const scheduleId = existing ? existing[0] as string : `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const schedule: ReviewSchedule = {
    id: scheduleId,
    itemType: 'question',
    itemId: question.id,
    topicId: question.topicId,
    subjectId: question.subjectName ? undefined : undefined, // We'll need to get this from topic relation
    repetitions: nextSchedule.repetitions,
    intervalDays: nextSchedule.intervalDays,
    easeFactor: nextSchedule.easeFactor,
    correctStreak: nextSchedule.correctStreak,
    lastReview: new Date(now),
    nextReviewAt: nextSchedule.nextReviewAt,
    lastResult: nextSchedule.lastResult,
    lastConfidence: context.confidence,
    lastRoom: context.room,
    createdAt: existing ? new Date(existing[14] as string) : new Date(now),
    updatedAt: new Date(now)
  };
  
  // Get subject_id from topic relationship
  const topicResult = db.exec(`
    SELECT t.subject_id FROM study_topics t WHERE t.id = ?
  `, [question.topicId]);
  
  const subjectId = topicResult[0]?.values[0]?.[0] as string || null;
  
  if (existing) {
    // Update existing
    db.exec(`
      UPDATE review_schedules SET
        repetitions = ?,
        interval_days = ?,
        ease_factor = ?,
        correct_streak = ?,
        last_review = ?,
        next_review_at = ?,
        last_result = ?,
        last_confidence = ?,
        last_room = ?,
        subject_id = ?,
        updated_at = ?
      WHERE id = ?
    `, [
      schedule.repetitions,
      schedule.intervalDays,
      schedule.easeFactor,
      schedule.correctStreak,
      schedule.lastReview!.toISOString(),
      schedule.nextReviewAt.toISOString(),
      schedule.lastResult,
      schedule.lastConfidence,
      schedule.lastRoom,
      subjectId,
      schedule.updatedAt.toISOString(),
      scheduleId
    ]);
  } else {
    // Insert new
    db.exec(`
      INSERT INTO review_schedules (
        id, item_type, item_id, topic_id, subject_id,
        repetitions, interval_days, ease_factor, correct_streak,
        last_review, next_review_at, last_result, last_confidence, last_room,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      scheduleId,
      'question',
      question.id,
      question.topicId,
      subjectId,
      schedule.repetitions,
      schedule.intervalDays,
      schedule.easeFactor,
      schedule.correctStreak,
      schedule.lastReview!.toISOString(),
      schedule.nextReviewAt.toISOString(),
      schedule.lastResult,
      schedule.lastConfidence,
      schedule.lastRoom,
      schedule.createdAt.toISOString(),
      schedule.updatedAt.toISOString()
    ]);
  }
  
  return schedule;
}

export function getDueQuestionIds(options: {
  subjectIds?: string[];
  limit?: number;
  includeOverdue?: boolean;
} = {}): string[] {
  const db = getDBOrThrow();
  ensureReviewTable();
  
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    SELECT DISTINCT rs.item_id
    FROM review_schedules rs
    LEFT JOIN study_topics t ON rs.topic_id = t.id
    WHERE rs.item_type = 'question' 
      AND rs.next_review_at <= ?
      ${options.subjectIds && options.subjectIds.length > 0 ? 
        ` AND rs.subject_id IN (${options.subjectIds.map(() => '?').join(',')})` : ''}
    ORDER BY rs.next_review_at ASC
    ${options.limit ? ` LIMIT ${options.limit}` : ''}
  `);
  
  const params = [now, ...(options.subjectIds || [])];
  stmt.bind(params);
  
  const results: string[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row.item_id as string);
  }
  stmt.free();
  
  return results;
}

export function getDueByEnemy(subjectIds?: string[]): DueReviewSummary[] {
  const db = getDBOrThrow();
  ensureReviewTable();
  
  const now = new Date().toISOString();
  const urgentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  let query = `
    SELECT 
      rs.topic_id,
      t.name as topic_name,
      s.id as subject_id,
      s.name as subject_name,
      COUNT(*) as due_count,
      COUNT(CASE WHEN rs.next_review_at < ? THEN 1 END) as urgent_count,
      rs.last_room
    FROM review_schedules rs
    LEFT JOIN study_topics t ON rs.topic_id = t.id
    LEFT JOIN study_subjects s ON t.subject_id = s.id
    WHERE rs.item_type = 'question' 
      AND rs.next_review_at <= ?
  `;
  
  const params: any[] = [urgentThreshold, now];
  
  if (subjectIds && subjectIds.length > 0) {
    const placeholders = subjectIds.map(() => '?').join(',');
    query += ` AND s.id IN (${placeholders})`;
    params.push(...subjectIds);
  }
  
  query += `
    GROUP BY rs.topic_id, t.name, s.id, s.name, rs.last_room
    ORDER BY urgent_count DESC, due_count DESC
  `;
  
  const result = db.exec(query, params);
  
  return result[0]?.values.map(row => ({
    topicId: row[0] as string,
    topicName: row[1] as string,
    subjectId: row[2] as string,
    subjectName: row[3] as string,
    dueCount: row[4] as number,
    urgentCount: row[5] as number,
    averageRoom: (row[6] as any) || 'triagem'
  })) || [];
}

export function getReviewStats(subjectIds?: string[]): ReviewStats {
  const db = getDBOrThrow();
  ensureReviewTable();
  
  const now = new Date().toISOString();
  
  let query = `
    SELECT 
      COUNT(*) as total_due,
      rs.last_room,
      rs.subject_id,
      AVG(rs.correct_streak) as avg_streak,
      MAX(rs.correct_streak) as max_streak,
      MIN(rs.next_review_at) as next_review
    FROM review_schedules rs
    WHERE rs.item_type = 'question' 
      AND rs.next_review_at <= ?
  `;
  
  const params: any[] = [now];
  
  if (subjectIds && subjectIds.length > 0) {
    const placeholders = subjectIds.map(() => '?').join(',');
    query += ` AND rs.subject_id IN (${placeholders})`;
    params.push(...subjectIds);
  }
  
  query += ` GROUP BY rs.last_room, rs.subject_id`;
  
  const result = db.exec(query, params);
  
  const stats: ReviewStats = {
    totalDue: 0,
    dueByRoom: { triagem: 0, vermelha: 0, amarela: 0, verde: 0 },
    dueBySubject: {},
    streakData: { averageStreak: 0, longestStreak: 0 }
  };
  
  if (result[0]?.values) {
    let totalStreak = 0;
    let count = 0;
    
    for (const row of result[0].values) {
      const due = row[0] as number;
      const room = row[1] as keyof typeof stats.dueByRoom;
      const subjectId = row[2] as string;
      const avgStreak = row[3] as number;
      const maxStreak = row[4] as number;
      const nextReview = row[5] as string;
      
      stats.totalDue += due;
      if (room && stats.dueByRoom[room] !== undefined) {
        stats.dueByRoom[room] += due;
      }
      if (subjectId) {
        stats.dueBySubject[subjectId] = (stats.dueBySubject[subjectId] || 0) + due;
      }
      
      totalStreak += avgStreak || 0;
      count++;
      
      if (maxStreak > stats.streakData.longestStreak) {
        stats.streakData.longestStreak = maxStreak;
      }
      
      if (!stats.nextReviewDate || (nextReview && new Date(nextReview) < stats.nextReviewDate)) {
        stats.nextReviewDate = new Date(nextReview);
      }
    }
    
    if (count > 0) {
      stats.streakData.averageStreak = totalStreak / count;
    }
  }
  
  return stats;
}

export function getScheduleByQuestionId(questionId: string): ReviewSchedule | null {
  const db = getDBOrThrow();
  ensureReviewTable();
  
  const result = db.exec(`
    SELECT * FROM review_schedules 
    WHERE item_type = 'question' AND item_id = ?
  `, [questionId]);
  
  const row = result[0]?.values[0];
  if (!row) return null;
  
  return {
    id: row[0] as string,
    itemType: row[1] as 'question',
    itemId: row[2] as string,
    topicId: row[3] as string,
    subjectId: row[4] as string,
    repetitions: row[5] as number,
    intervalDays: row[6] as number,
    easeFactor: row[7] as number,
    correctStreak: row[8] as number,
    lastReview: row[9] ? new Date(row[9] as string) : undefined,
    nextReviewAt: new Date(row[10] as string),
    lastResult: row[11] as number,
    lastConfidence: row[12] as any,
    lastRoom: row[13] as any,
    createdAt: new Date(row[14] as string),
    updatedAt: new Date(row[15] as string)
  };
}