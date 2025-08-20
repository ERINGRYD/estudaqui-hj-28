import { getDBOrThrow, getScheduleSave } from '../singleton';
import type { BattleSession, UserProgress, Room } from '@/types/battle';
import { calculateLevel } from '@/types/battle';

/**
 * Start a new battle session
 */
export const startBattleSession = (room: Room, totalQuestions: number): string => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();
  const sessionId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    database.run(`
      INSERT INTO battle_sessions (
        id, room, total_questions, start_time
      ) VALUES (?, ?, ?, ?)
    `, [
      sessionId,
      room,
      totalQuestions,
      new Date().toISOString()
    ]);

    scheduleSave();
    return sessionId;
  } catch (error) {
    console.error('Error starting battle session:', error);
    throw error;
  }
};

/**
 * Complete a battle session
 */
export const completeBattleSession = (
  sessionId: string,
  correctAnswers: number,
  totalXp: number
): boolean => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    const session = getBattleSession(sessionId);
    if (!session) return false;

    const accuracyRate = session.totalQuestions > 0 ? (correctAnswers / session.totalQuestions) * 100 : 0;
    const duration = Math.floor((Date.now() - session.startTime.getTime()) / 1000);

    database.run(`
      UPDATE battle_sessions 
      SET 
        correct_answers = ?,
        total_xp = ?,
        accuracy_rate = ?,
        end_time = ?,
        duration = ?,
        completed = 1
      WHERE id = ?
    `, [
      correctAnswers,
      totalXp,
      accuracyRate,
      new Date().toISOString(),
      duration,
      sessionId
    ]);

    // Update user progress
    updateUserProgress(totalXp, correctAnswers, session.totalQuestions);

    scheduleSave();
    return true;
  } catch (error) {
    console.error('Error completing battle session:', error);
    return false;
  }
};

/**
 * Get battle session by ID
 */
export const getBattleSession = (sessionId: string): BattleSession | null => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare('SELECT * FROM battle_sessions WHERE id = ?');
    stmt.bind([sessionId]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      
      return {
        id: row.id as string,
        room: row.room as Room,
        totalQuestions: row.total_questions as number,
        correctAnswers: row.correct_answers as number,
        totalXp: row.total_xp as number,
        accuracyRate: row.accuracy_rate as number,
        startTime: new Date(row.start_time as string),
        endTime: row.end_time ? new Date(row.end_time as string) : undefined,
        duration: row.duration as number || undefined,
        completed: Boolean(row.completed),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      };
    }
    stmt.free();
    
    return null;
  } catch (error) {
    console.error('Error getting battle session:', error);
    return null;
  }
};

/**
 * Get recent battle sessions
 */
export const getRecentBattleSessions = (limit: number = 10): BattleSession[] => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(`
      SELECT * FROM battle_sessions 
      WHERE completed = 1
      ORDER BY start_time DESC 
      LIMIT ?
    `);
    
    const results: BattleSession[] = [];
    stmt.bind([limit]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        room: row.room as Room,
        totalQuestions: row.total_questions as number,
        correctAnswers: row.correct_answers as number,
        totalXp: row.total_xp as number,
        accuracyRate: row.accuracy_rate as number,
        startTime: new Date(row.start_time as string),
        endTime: row.end_time ? new Date(row.end_time as string) : undefined,
        duration: row.duration as number || undefined,
        completed: Boolean(row.completed),
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting recent battle sessions:', error);
    return [];
  }
};

/**
 * Get or create user progress
 */
export const getUserProgress = (): UserProgress => {
  const database = getDBOrThrow();

  try {
    let stmt = database.prepare('SELECT * FROM user_progress WHERE id = ?');
    stmt.bind(['user_progress']);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      
      return {
        id: row.id as string,
        totalXp: row.total_xp as number,
        currentLevel: row.current_level as number,
        xpForNextLevel: row.xp_for_next_level as number,
        battlesWon: row.battles_won as number,
        questionsAnswered: row.questions_answered as number,
        questionsCorrect: row.questions_correct as number,
        streakDays: row.streak_days as number,
        lastBattleDate: row.last_battle_date ? new Date(row.last_battle_date as string) : undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      };
    }
    stmt.free();
    
    // Create initial user progress if it doesn't exist
    const scheduleSave = getScheduleSave();
    database.run(`
      INSERT INTO user_progress (
        id, total_xp, current_level, xp_for_next_level
      ) VALUES (?, ?, ?, ?)
    `, ['user_progress', 0, 1, 100]);
    
    scheduleSave();
    
    return {
      id: 'user_progress',
      totalXp: 0,
      currentLevel: 1,
      xpForNextLevel: 100,
      battlesWon: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      streakDays: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
  } catch (error) {
    console.error('Error getting user progress:', error);
    // Return default progress
    return {
      id: 'user_progress',
      totalXp: 0,
      currentLevel: 1,
      xpForNextLevel: 100,
      battlesWon: 0,
      questionsAnswered: 0,
      questionsCorrect: 0,
      streakDays: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
};

/**
 * Update user progress after battle
 */
export const updateUserProgress = (
  xpGained: number,
  correctAnswers: number,
  totalQuestions: number
): void => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    const currentProgress = getUserProgress();
    const newTotalXp = currentProgress.totalXp + xpGained;
    const { level, xpForNext } = calculateLevel(newTotalXp);
    
    const battlesWon = correctAnswers === totalQuestions ? currentProgress.battlesWon + 1 : currentProgress.battlesWon;
    
    database.run(`
      UPDATE user_progress 
      SET 
        total_xp = ?,
        current_level = ?,
        xp_for_next_level = ?,
        battles_won = ?,
        questions_answered = questions_answered + ?,
        questions_correct = questions_correct + ?,
        last_battle_date = ?
      WHERE id = ?
    `, [
      newTotalXp,
      level,
      xpForNext,
      battlesWon,
      totalQuestions,
      correctAnswers,
      new Date().toISOString(),
      'user_progress'
    ]);

    scheduleSave();
  } catch (error) {
    console.error('Error updating user progress:', error);
  }
};

/**
 * Add XP to user progress (for individual question answers)
 */
export const addXpToUser = (xpAmount: number): UserProgress => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    const currentProgress = getUserProgress();
    const newTotalXp = currentProgress.totalXp + xpAmount;
    const { level, xpForNext } = calculateLevel(newTotalXp);
    
    database.run(`
      UPDATE user_progress 
      SET 
        total_xp = ?,
        current_level = ?,
        xp_for_next_level = ?
      WHERE id = ?
    `, [
      newTotalXp,
      level,
      xpForNext,
      'user_progress'
    ]);

    scheduleSave();
    
    return {
      ...currentProgress,
      totalXp: newTotalXp,
      currentLevel: level,
      xpForNextLevel: xpForNext
    };
  } catch (error) {
    console.error('Error adding XP to user:', error);
    return getUserProgress();
  }
};