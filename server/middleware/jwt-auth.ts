import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "../storage";

// Secret key for JWT tokens
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "development-secret-key";

// JWT token expiration time
const TOKEN_EXPIRATION = "30d"; // 30 days

// Generate JWT token for a user
export const generateToken = (userId: number): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
};

// Middleware to authenticate requests with JWT token
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check for the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No token, continue to next middleware (will check session auth)
      return next();
    }

    // Extract the token
    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    if (!decoded || !decoded.id) {
      return next();
    }

    // Get the user from the database
    const user = await storage.getUserById(decoded.id);
    if (!user) {
      return next();
    }

    // Add user to request
    req.user = user;
    return next();
  } catch (error) {
    console.error("JWT authentication error:", error);
    return next();
  }
};

// Response handler to add JWT token to response
export const addJwtToResponse = (res: Response, userId: number) => {
  const token = generateToken(userId);
  return { token };
};