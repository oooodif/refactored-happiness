import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

/**
 * Middleware to track anonymous users
 * This middleware will:
 * 1. Extract fingerprint from request headers
 * 2. Look up or create anonymous user record
 * 3. Check if user has remaining free usage
 * 4. Add isAnonymousAllowed flag to request for later use
 */
export async function trackAnonymousUser(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  try {
    // Skip if user is already authenticated
    if (req.session.userId) {
      return next();
    }
    
    // Get fingerprint from request headers
    const fingerprint = req.headers["x-device-fingerprint"] as string;
    
    if (!fingerprint) {
      // No fingerprint provided, can't track anonymous usage
      req.anonymousAllowed = false;
      return next();
    }
    
    // Check if user has remaining anonymous usage
    const hasRemainingUsage = await storage.hasRemainingAnonymousUsage(fingerprint);
    
    // Add fingerprint and usage flag to request for later use
    req.anonymousFingerprint = fingerprint;
    req.anonymousAllowed = hasRemainingUsage;
    
    next();
  } catch (error) {
    console.error("Error tracking anonymous user:", error);
    // Continue anyway, but don't allow anonymous usage
    req.anonymousAllowed = false;
    next();
  }
}

/**
 * Middleware to check if anonymous usage is allowed
 * This middleware will:
 * 1. Check if user is authenticated (allow)
 * 2. If not authenticated, check if anonymous usage is allowed (from trackAnonymousUser)
 * 3. If neither, deny access
 */
export function allowAnonymousOrAuth(
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  if (req.session.userId) {
    // User is authenticated, allow
    return next();
  }
  
  if (req.anonymousAllowed) {
    // Anonymous usage is allowed, proceed
    return next();
  }
  
  // Neither authenticated nor anonymous allowed, deny access
  return res.status(401).json({ 
    message: "Authentication required", 
    isAnonymous: true,
    anonymousUsed: true 
  });
}

/**
 * Helper function to increment anonymous usage after successful generation
 */
export async function incrementAnonymousUsage(req: Request): Promise<void> {
  if (!req.session.userId && req.anonymousFingerprint) {
    try {
      // Get user by fingerprint
      let user = await storage.getAnonymousUserByFingerprint(req.anonymousFingerprint);
      
      if (!user) {
        // Create new anonymous user if not found
        user = await storage.createAnonymousUser({
          fingerprint: req.anonymousFingerprint,
          sessionId: req.sessionID,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });
      }
      
      // Increment usage
      await storage.incrementAnonymousUserUsage(req.anonymousFingerprint);
    } catch (error) {
      console.error("Error incrementing anonymous usage:", error);
    }
  }
}

// Extend Express Request type definitions
declare global {
  namespace Express {
    interface Request {
      anonymousFingerprint?: string;
      anonymousAllowed?: boolean;
    }
  }
}