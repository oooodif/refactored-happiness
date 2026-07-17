import { pool } from './index';

/**
 * Create session table for connect-pg-simple
 */
async function createSessionTable() {
  try {
    // SQL for creating session table based on connect-pg-simple
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `;
    
    // Create index on expire field
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
    `;
    
    // Execute queries
    await pool.query(createTableSQL);
    await pool.query(createIndexSQL);
    
    console.log('✅ Session table created successfully');
  } catch (error) {
    console.error('Error creating session table:', error);
    throw error;
  }
}

// Run the function
createSessionTable()
  .then(() => {
    console.log('Session table setup complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Session table setup failed:', error);
    process.exit(1);
  });