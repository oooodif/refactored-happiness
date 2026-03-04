import { Router, Request, Response } from "express";
import { db } from "../db";
import { users, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import { generateToken } from "./middleware/jwt-auth";

export const testLoginRouter = Router();

testLoginRouter.get('/test-login', async (req: Request, res: Response) => {
  try {
    // Get the first user from the database
    const user = await db.query.users.findFirst();
    
    if (!user) {
      return res.status(404).json({ message: 'No users found' });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Login the user
    req.login(user as User, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to log in user', error: err.message });
      }
      
      // Set cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      // Redirect to home page with token in URL
      res.redirect(`/?token=${token}`);
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ message: 'Test login failed', error: error.message });
  }
});

testLoginRouter.get('/test-token', async (req: Request, res: Response) => {
  try {
    // Get the first user from the database
    const user = await db.query.users.findFirst();
    
    if (!user) {
      return res.status(404).json({ message: 'No users found' });
    }
    
    // Generate JWT token
    const token = generateToken(user.id);
    
    // Return token
    res.json({ token, userId: user.id, username: user.username });
  } catch (error) {
    console.error('Test token error:', error);
    res.status(500).json({ message: 'Failed to generate test token', error: error.message });
  }
});