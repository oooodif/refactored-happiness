import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

/**
 * Middleware to authenticate the user from session
 * If user is logged in, adds user to req.user
 * If not, passes through (doesn't require authentication)
 */
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.session.userId) {
      const user = await storage.getUserById(req.session.userId);
      
      if (user) {
        // Add user to request object
        (req as any).user = user;
      }
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    next();
  }
}

/**
 * Middleware to require authentication
 * If user is not logged in, returns 401 Unauthorized
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
}

/**
 * Middleware to require admin role
 * If user is not admin, returns 403 Forbidden
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const user = await storage.getUserById(req.session.userId);
    
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
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      const user = await storage.getUserById(decoded.id);
      
      if (user) {
        (req as any).user = user;
        req.session.userId = user.id;
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
