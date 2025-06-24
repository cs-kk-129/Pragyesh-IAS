
import { db, pool } from './db';
import * as schema from '@shared/schema';

async function debugDatabase() {
  try {
    console.log('=== DATABASE DEBUG ===');
    
    // Check quiz_attempts table structure
    const tableInfoQuery = `
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'quiz_attempts'
      ORDER BY ordinal_position;
    `;
    
    const tableInfo = await pool.query(tableInfoQuery);
    console.log('\nQUIZ_ATTEMPTS TABLE STRUCTURE:');
    console.table(tableInfo.rows);
    
    // Check if table exists and has data
    const countQuery = 'SELECT COUNT(*) as count FROM quiz_attempts';
    const countResult = await pool.query(countQuery);
    console.log('\nQUIZ_ATTEMPTS COUNT:', countResult.rows[0].count);
    
    // Check recent quiz attempts
    const recentQuery = 'SELECT * FROM quiz_attempts ORDER BY completed_at DESC LIMIT 5';
    const recentResult = await pool.query(recentQuery);
    console.log('\nRECENT QUIZ ATTEMPTS:');
    console.table(recentResult.rows);
    
    // Check quiz table
    const quizCountQuery = 'SELECT COUNT(*) as count FROM quizzes WHERE quiz_type = \'mock_test\'';
    const quizCountResult = await pool.query(quizCountQuery);
    console.log('\nMOCK TEST QUIZZES COUNT:', quizCountResult.rows[0].count);
    
    // Check recent quizzes
    const recentQuizQuery = 'SELECT id, title, quiz_type, created_at FROM quizzes WHERE quiz_type = \'mock_test\' ORDER BY created_at DESC LIMIT 5';
    const recentQuizResult = await pool.query(recentQuizQuery);
    console.log('\nRECENT MOCK TEST QUIZZES:');
    console.table(recentQuizResult.rows);
    
  } catch (error) {
    console.error('Database debug error:', error);
  } finally {
    process.exit(0);
  }
}

debugDatabase();
