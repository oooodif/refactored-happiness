import * as schema from "@shared/schema";
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";
import pg from 'pg';

// Detect Railway environment
const isRailway = !!process.env.RAILWAY_ENVIRONMENT;

// Log environment info for debugging
console.log(`[DB] Environment: ${isRailway ? 'Railway' : 'Local/Replit'}`);
console.log(`[DB] DATABASE_URL starts with: ${process.env.DATABASE_URL?.substring(0, 15)}...`);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create the appropriate database connection based on environment
let pool;

if (isRailway) {
  console.log('[DB] Using standard PostgreSQL connection for Railway');
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL
  });
} else {
  console.log('[DB] Using WebSocket connection for local/Replit environment');
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

// Set up Drizzle with the appropriate pool
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
const db = isRailway
  ? pgDrizzle(pool, { schema })
  : drizzle({ client: pool as any, schema });

// Export both the pool (for session store) and db (for queries)
export { pool, db };