import express from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import jwt from 'jsonwebtoken';
import passport from 'passport';

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "development-secret-key";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

// Simple endpoint to log in test user
router.get('/login', async (req, res) => {
  try {
    // Get test user using Drizzle ORM
    const user = await db.query.users.findFirst();
    
    if (!user) {
      return res.status(404).send('No users found');
    }
    
    console.log('Test login for user:', user);
    
    // Generate token
    const token = generateToken(user.id);
    
    // Log in the user (this sets up the session)
    req.login(user, (err) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).send('Error logging in: ' + err.message);
      }
      
      console.log('User logged in via session. Session ID:', req.sessionID);
      
      // HTML page with link to homepage
      res.send(`
        <html>
          <head>
            <title>Test Login Successful</title>
            <script>
              // Save token to localStorage
              localStorage.setItem('jwt_token', '${token}');
              console.log('Token saved to localStorage:', '${token}');
              
              // Set a flag to show we're logged in
              localStorage.setItem('is_authenticated', 'true');
              
              // Force fetch from /api/auth/me to update app state
              fetch('/api/auth/me', {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ${token}'
                },
                credentials: 'include'
              })
              .then(response => response.json())
              .then(data => {
                console.log('Auth check response:', data);
                // Redirect to homepage
                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);
              })
              .catch(error => {
                console.error('Auth check failed:', error);
                // Redirect anyway
                setTimeout(() => {
                  window.location.href = '/';
                }, 2000);
              });
            </script>
          </head>
          <body>
            <h1>Login Successful!</h1>
            <p>Logged in as ${user.username} (ID: ${user.id})</p>
            <p>JWT Token has been saved to localStorage.</p>
            <p>Redirecting to homepage in 2 seconds...</p>
            <p><a href="/">Click here if not redirected automatically</a></p>
          </body>
        </html>
      `);
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).send('Error: ' + error.message);
  }
});

// Debug endpoint to check auth status
router.get('/check', async (req, res) => {
  res.json({
    user: req.user,
    sessionID: req.sessionID,
    session: req.session
  });
});

export default router;