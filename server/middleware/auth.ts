import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to authenticate the user from session
 * If user is logged in, req.user is already set by Passport
 * If not, passes through (doesn't require authentication)
 */
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  // Passport.js already sets req.user if authenticated
  console.log(`Authentication status: ${req.isAuthenticated() ? 'Authenticated' : 'Not authenticated'}`);
  if (req.isAuthenticated()) {
    console.log(`User found: ${req.user.username}`);
  } else {
    console.log('No authenticated user');
  }
  next();
}

/**
 * Middleware to require authentication
 * If user is not logged in, returns 401 Unauthorized
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

/**
 * Middleware to require admin role
 * If user is not admin, returns 403 Forbidden
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const user = req.user;
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Middleware to extract user ID from JWT token in Authorization header
 * Alternative to session-based authentication for API clients
 */
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  // Skip if already authenticated via session
  if (req.isAuthenticated()) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      const user = await storage.getUserById(decoded.id);
      
      if (user) {
        // In Passport, we would normally use req.login
        // But that requires a callback, so we'll manually set it
        (req as any).user = user;
        // No need to set session.userId as Passport handles this
      }
    } catch (error) {
      // Invalid token, continue without authentication
      console.error('JWT authentication error:', error);
    }
  }
  
  next();
}

// JWT utility for token verification
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'latex-generator-jwt-secret-key';
