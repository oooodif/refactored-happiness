import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "../db";
import { authenticateJWT, addJwtToResponse } from "./middleware/jwt-auth";

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

async function comparePasswords(supplied: string, stored: string) {
  // Defensive check - handle null or undefined inputs
  if (!supplied || !stored) {
    console.log('Invalid password input detected');
    return false;
  }

  // Check if the stored password is in the correct format (hash.salt)
  if (!stored.includes('.')) {
    console.log('Password in old format detected - trying old format comparison');
    // For old format passwords (just plain text or MD5 hash without salt)
    try {
      // Direct comparison for plain text passwords
      return stored === supplied;
    } catch (error) {
      console.error('Old format password comparison error:', error);
      return false;
    }
  }

  try {
    // New format password with hash and salt
    const [hashed, salt] = stored.split(".");
    
    // More defensive coding - verify we have both parts
    if (!hashed || !salt) {
      console.error('Invalid password format - missing hash or salt');
      return false;
    }
    
    // Convert hash to buffer for comparison
    const hashedBuf = Buffer.from(hashed, "hex");
    
    // Hash the supplied password with the same salt
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false; // Return false instead of throwing an error
  }
}

export function setupAuth(app: Express) {
  // We're moving from session-based auth to token-based auth
  // so we'll keep this simple to avoid session table errors
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // set to true in production with HTTPS
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
          
          // Check if password is in old format (no dot separator)
          if (!user.password.includes('.')) {
            console.log('Old password format detected, attempting direct comparison');
            
            // First try direct comparison for old format passwords
            if (user.password === password) {
              console.log(`Old format password match for user: ${email}`);
              
              // Now migrate the password to new format for future logins
              const { migrateUserPassword } = await import('./utils/password-migration');
              
              // Try to migrate the user's password
              const success = await migrateUserPassword(user.id, password);
              if (success) {
                console.log(`Migrated password for user: ${email}`);
                // Get updated user and proceed with login
                const updatedUser = await storage.getUserById(user.id);
                if (updatedUser) {
                  return done(null, updatedUser);
                }
              }
              
              // Even if migration fails, allow login since direct comparison passed
              return done(null, user);
            } else {
              console.log(`Old format password mismatch for user: ${email}`);
              return done(null, false, { message: 'Invalid email or password' });
            }
          }
          
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