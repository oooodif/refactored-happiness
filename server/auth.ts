import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool, db } from "../db";
import { authenticateJWT, addJwtToResponse } from "./middleware/jwt-auth";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const PostgresSessionStore = connectPg(session);
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Always use the same password comparison method
async function comparePasswords(supplied: string, stored: string) {
  // If we have a password in old format, just do direct comparison
  if (!stored.includes('.')) {
    return stored === supplied;
  }
  
  // New format with salt
  try {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    // If comparison fails, try direct comparison as fallback
    return stored === supplied;
  }
}

// Admin function to reset a user's password
export async function resetPassword(userId: number, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword);
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error('Password reset error:', error);
    return false;
  }
}

// Function to delete a user account
export async function deleteUserAccount(userId: number): Promise<boolean> {
  try {
    // Delete the user
    await db.delete(users)
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error('User deletion error:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  // Session store using PostgreSQL - use existing table without trying to create it
  const sessionStore = new PostgresSessionStore({
    pool,
    tableName: 'session', // Use the existing table name
    createTableIfMissing: false, // Don't try to create the table, it already exists
    schemaName: 'public'
  });

  // Session settings with the PostgreSQL store
  const sessionSettings: session.SessionOptions = {
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // only set to true in production with HTTPS
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          console.log(`Attempting login for email: ${email}`);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log(`No user found with email: ${email}`);
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          // We handle both old and new password formats in comparePasswords function now
          
          // Normal password check
          const passwordValid = await comparePasswords(password, user.password);
          if (!passwordValid) {
            console.log(`Invalid password for user: ${email}`);
            return done(null, false, { message: 'Invalid email or password' });
          }
          
          console.log(`User logged in: ${user.username} (ID: ${user.id})`);
          return done(null, user);
        } catch (error) {
          console.error('Login error:', error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user ID: ${user.id} to session`);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user from ID: ${id}`);
      const user = await storage.getUserById(id);
      if (!user) {
        console.log(`No user found with ID: ${id}`);
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Deserialize error:', error);
      done(error, null);
    }
  });

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Create the user
      const hashedPassword = await hashPassword(password);
      const result = await storage.createUser(username, email, hashedPassword);

      if (!result.success || !result.user) {
        return res.status(400).json({ message: result.error || "Failed to create user" });
      }

      // Log the user in
      req.login(result.user, (err) => {
        if (err) return next(err);
        
        // Generate JWT token for the user
        const jwtData = addJwtToResponse(res, result.user.id);
        
        res.status(201).json({ 
          user: result.user, 
          usageLimit: result.usageLimit || 3,
          token: jwtData.token 
        });
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Server error during registration" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        console.log(`User logged in: ${user.username} (ID: ${user.id}), session ID: ${req.sessionID}`);
        
        // Generate JWT token for the user
        const jwtData = addJwtToResponse(res, user.id);
        
        // Include token in response
        return res.json({ 
          user, 
          usageLimit: 3,
          token: jwtData.token
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    const userId = req.user?.id;
    console.log(`Logging out user ID: ${userId}`);
    
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return next(err);
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return next(err);
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: 'Logged out successfully' });
      });
    });
  });

  app.get("/api/auth/me", authenticateJWT, (req, res) => {
    console.log(`Session ID: ${req.sessionID}`);
    
    // After authenticateJWT runs, it may have set req.user from JWT token
    // Otherwise, check session authentication
    if (!req.user && !req.isAuthenticated()) {
      console.log(`No userId in session or JWT token`);
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // By this point, req.user should be set either by session or JWT
    console.log(`User authenticated: ${req.user?.username} (ID: ${req.user?.id})`);
    res.json({ user: req.user, usageLimit: 3 });
  });
  
  // Debug endpoint
  app.get("/api/auth/session-debug", (req, res) => {
    res.json({
      sessionID: req.sessionID,
      session: req.session,
      isAuthenticated: req.isAuthenticated(),
      user: req.user
    });
  });
}