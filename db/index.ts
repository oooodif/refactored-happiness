import * as schema from "@shared/schema";
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from "ws";

// Check if we're in a Railway environment
const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';

// Only use WebSocket for non-Railway environments (like Replit/local)
if (!isRailway) {
  // Configure Neon with WebSockets for environments like Replit
  neonConfig.webSocketConstructor = ws;
  console.log('[DB] Using WebSocket connection for Neon database');
} else {
  console.log('[DB] Running in Railway - using direct PostgreSQL connection');
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });