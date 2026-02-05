import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { authenticateJWT } from "./jwt-auth";

/**
 * Middleware to authenticate the user from session or JWT
 * Tries both authentication methods:
 * 1. Session-based authentication (Passport)
 * 2. JWT-based authentication (Bearer token)
 */
export function authenticateUser(req: Request, res: Response, next: NextFunction) {
  // Check for session authentication first (Passport sets req.user)
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  
  // If no session auth, try JWT authentication
  authenticateJWT(req, res, next);
}

/**
 * Middleware to require authentication
 * If user is not logged in, returns 401 Unauthorized
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // First try to authenticate the user
  authenticateUser(req, res, () => {
    // After authenticateUser runs, check if req.user is set
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  });
}

/**
 * Middleware to require admin role
 * If user is not admin, returns 403 Forbidden
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });
}