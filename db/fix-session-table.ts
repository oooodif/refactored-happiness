/**
 * Fix session table issues - used as a one-time fix
 */

import { pool } from './index';

async function fixSessionTable() {
  const client = await pool.connect();
  
  try {
    console.log('Starting session table fix...');
    
    // Drop existing constraints that are causing issues
    try {
      await client.query('ALTER TABLE session DROP CONSTRAINT IF EXISTS session_pkey');
      console.log('Dropped session_pkey constraint if it existed');
    } catch (error) {
      console.log('Error dropping constraint (might not exist):', error.message);
    }
    
    // Check if the session table exists
    const tableCheck = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session')"
    );
    
    if (tableCheck.rows[0].exists) {
      console.log('Session table exists, dropping it...');
      await client.query('DROP TABLE session');
      console.log('Session table dropped successfully');
    } else {
      console.log('Session table does not exist yet, will be created by connect-pg-simple');
    }
    
    console.log('Session table fix completed. The table will be recreated on next server start.');
  } catch (error) {
    console.error('Error fixing session table:', error);
    throw error;
  } finally {
    client.release();
  }
}

fixSessionTable()
  .then(() => {
    console.log('Session table fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to fix session table:', error);
    process.exit(1);
  });