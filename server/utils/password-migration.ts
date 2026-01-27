import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// Same function as in auth.ts
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function migrateUserPassword(userId: number, plainPassword: string): Promise<boolean> {
  try {
    // Hash the password with the new format
    const newHashedPassword = await hashPassword(plainPassword);
    
    // Update the user's password
    const [updatedUser] = await db.update(users)
      .set({ 
        password: newHashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    return !!updatedUser;
  } catch (error) {
    console.error('Password migration error:', error);
    return false;
  }
}

/**
 * For admin use - adds a temporary migration endpoint
 * This should be removed after all users have been migrated
 */
export async function migrateAllUsersToNewPasswordFormat(oldPlainPassword: string): Promise<{
  success: boolean;
  migrated: number;
  failed: number;
  message: string;
}> {
  try {
    // Get all users
    const allUsers = await db.query.users.findMany();
    let migratedCount = 0;
    let failedCount = 0;
    
    // For each user, rehash their password
    for (const user of allUsers) {
      // Skip users who already have passwords in the new format
      if (user.password.includes('.')) {
        continue;
      }
      
      const success = await migrateUserPassword(user.id, oldPlainPassword);
      if (success) {
        migratedCount++;
      } else {
        failedCount++;
      }
    }
    
    return {
      success: true,
      migrated: migratedCount,
      failed: failedCount,
      message: `Migration completed. ${migratedCount} users migrated, ${failedCount} failed.`
    };
  } catch (error) {
    console.error('Bulk password migration error:', error);
    return {
      success: false,
      migrated: 0,
      failed: 0,
      message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}