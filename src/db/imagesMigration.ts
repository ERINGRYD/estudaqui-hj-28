import { getDBOrThrow } from './singleton';

/**
 * Migration to add images column to questions table
 */
export const runImagesMigration = () => {
  const database = getDBOrThrow();
  
  try {
    // Check if images column already exists
    const checkColumn = database.prepare(`
      PRAGMA table_info(questions)
    `);
    
    const columns = [];
    while (checkColumn.step()) {
      const row = checkColumn.getAsObject();
      columns.push(row.name);
    }
    checkColumn.free();
    
    // Only add column if it doesn't exist
    if (!columns.includes('images')) {
      database.run(`
        ALTER TABLE questions ADD COLUMN images TEXT DEFAULT '[]'
      `);
      
      console.log('✅ Images column added to questions table');
    } else {
      console.log('📋 Images column already exists in questions table');
    }
  } catch (error) {
    console.error('❌ Error running images migration:', error);
    throw error;
  }
};