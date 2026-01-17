import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "../db";

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
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionStore = new PostgresSessionStore({ 
    pool,
    tableName: 'session',
    createTableIfMissing: true
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'development-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
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
      const user = await storage.createUser(username, email, hashedPassword);

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ user, usageLimit: 3 });
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
        return res.json({ user, usageLimit: 3 });
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

  app.get("/api/auth/me", (req, res) => {
    console.log(`Session ID: ${req.sessionID}`);
    console.log(`Session user ID: ${req.session.passport?.user}`);
    
    if (!req.isAuthenticated()) {
      console.log(`No userId in session`);
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    console.log(`Looking up user ID ${req.user.id} from session`);
    console.log(`User found: ${req.user.username}`);
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