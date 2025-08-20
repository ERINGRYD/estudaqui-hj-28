
import { getDBOrThrow, getScheduleSave } from '../singleton';
import type { Enemy, EnemyStats } from '@/types/enemy';
import type { Room } from '@/types/battle';
import { classifyEnemyRoom } from '@/types/enemy';

/**
 * Get all enemies (topics with questions) grouped by room
 */
export const getEnemiesByRoom = (): EnemyStats => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(`
      SELECT 
        t.id as topic_id,
        t.name as topic_name,
        s.name as subject_name,
        s.color as subject_color,
        COUNT(q.id) as total_questions,
        COALESCE(SUM(CASE WHEN qa.is_correct IS NOT NULL THEN 1 ELSE 0 END), 0) as questions_answered,
        COALESCE(SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END), 0) as questions_correct,
        MAX(qa.created_at) as last_battle_date,
        COALESCE(SUM(qa.xp_earned), 0) as total_xp_earned,
        MIN(q.created_at) as created_at,
        MAX(q.updated_at) as updated_at
      FROM study_topics t
      JOIN study_subjects s ON t.subject_id = s.id
      INNER JOIN questions q ON q.topic_id = t.id
      LEFT JOIN question_attempts qa ON qa.question_id = q.id
      GROUP BY t.id, t.name, s.name, s.color
      HAVING total_questions > 0
      ORDER BY questions_answered ASC, total_questions DESC
    `);

    const enemies: Enemy[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      const questionsAnswered = row.questions_answered as number;
      const questionsCorrect = row.questions_correct as number;
      const accuracyRate = questionsAnswered > 0 ? (questionsCorrect / questionsAnswered) * 100 : 0;
      
      // Calculate room based on current performance
      const calculatedRoom = classifyEnemyRoom(accuracyRate, questionsAnswered);
      
      const enemy: Enemy = {
        id: `enemy_${row.topic_id}`,
        topicId: row.topic_id as string,
        topicName: row.topic_name as string,
        subjectName: row.subject_name as string,
        subjectColor: row.subject_color as string || 'hsl(var(--study-primary))',
        room: calculatedRoom,
        totalQuestions: row.total_questions as number,
        questionsAnswered,
        questionsCorrect,
        accuracyRate,
        lastBattleDate: row.last_battle_date ? new Date(row.last_battle_date as string) : undefined,
        averageDifficulty: 'medium', // TODO: Calculate from questions
        totalXpEarned: row.total_xp_earned as number,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      };
      
      console.log(`Enemy ${enemy.topicName}: ${enemy.questionsCorrect}/${enemy.questionsAnswered} (${enemy.accuracyRate.toFixed(1)}%) -> ${enemy.room}`);
      enemies.push(enemy);
    }
    stmt.free();

    // Group enemies by room
    const result: EnemyStats = {
      triagem: enemies.filter(e => e.room === 'triagem'),
      vermelha: enemies.filter(e => e.room === 'vermelha'),
      amarela: enemies.filter(e => e.room === 'amarela'),
      verde: enemies.filter(e => e.room === 'verde')
    };

    console.log('Enemies by room:', {
      triagem: result.triagem.length,
      vermelha: result.vermelha.length,
      amarela: result.amarela.length,
      verde: result.verde.length
    });

    return result;
  } catch (error) {
    console.error('Error getting enemies by room:', error);
    return {
      triagem: [],
      vermelha: [],
      amarela: [],
      verde: []
    };
  }
};

/**
 * Get questions for a specific enemy (topic)
 */
export const getEnemyQuestions = (topicId: string) => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare(`
      SELECT q.*, t.name as topic_name, s.name as subject_name
      FROM questions q
      JOIN study_topics t ON q.topic_id = t.id
      JOIN study_subjects s ON t.subject_id = s.id
      WHERE q.topic_id = ?
      ORDER BY q.created_at DESC
    `);
    
    const results = [];
    stmt.bind([topicId]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        topicId: row.topic_id as string,
        title: row.title as string,
        content: row.content as string,
        options: row.options ? JSON.parse(row.options as string) : undefined,
        correctAnswer: row.correct_answer as string,
        explanation: row.explanation as string || undefined,
        difficulty: row.difficulty as string,
        tags: JSON.parse(row.tags as string || '[]'),
        images: JSON.parse(row.images as string || '[]'),
        examiningBoard: row.examining_board as string || undefined,
        position: row.position as string || undefined,
        examYear: row.exam_year as string || undefined,
        institution: row.institution as string || undefined,
        timesAnswered: row.times_answered as number,
        timesCorrect: row.times_correct as number,
        accuracyRate: row.accuracy_rate as number,
        room: row.room as Room,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string),
        topicName: row.topic_name as string,
        subjectName: row.subject_name as string
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error getting enemy questions:', error);
    return [];
  }
};

/**
 * Update enemy room after battle completion - calculates in real time
 */
export const updateEnemyRoom = (topicId: string): Room => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    // Calculate new accuracy rate for this topic based on question attempts
    const stmt = database.prepare(`
      SELECT 
        COUNT(qa.id) as questions_answered,
        SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) as questions_correct
      FROM questions q
      LEFT JOIN question_attempts qa ON qa.question_id = q.id
      WHERE q.topic_id = ? AND qa.id IS NOT NULL
    `);
    
    stmt.bind([topicId]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const questionsAnswered = row.questions_answered as number;
      const questionsCorrect = row.questions_correct as number;
      const accuracyRate = questionsAnswered > 0 ? (questionsCorrect / questionsAnswered) * 100 : 0;
      
      const newRoom = classifyEnemyRoom(accuracyRate, questionsAnswered);
      
      console.log(`Updating enemy ${topicId}: ${questionsCorrect}/${questionsAnswered} (${accuracyRate.toFixed(1)}%) -> ${newRoom}`);
      
      // Update all questions of this topic to the new room
      const updateStmt = database.prepare('UPDATE questions SET room = ? WHERE topic_id = ?');
      updateStmt.run([newRoom, topicId]);
      updateStmt.free();
      
      scheduleSave();
      stmt.free();
      return newRoom;
    }
    
    stmt.free();
    return 'triagem';
  } catch (error) {
    console.error('Error updating enemy room:', error);
    return 'triagem';
  }
};
