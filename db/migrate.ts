import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

// This script will run all migrations in the db/migrations folder

async function runMigrations() {
  // Get database connection string from environment
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }
  
  console.log("Connecting to database...");
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  
  try {
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "db/migrations" });
    console.log("Migrations completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
  
  // Close the pool
  await pool.end();
  console.log("Database connection closed");
}

// Run migrations
runMigrations().catch(console.error);