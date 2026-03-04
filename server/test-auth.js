import express from 'express';
import { pool } from '../db';
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
    // Get test user
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users LIMIT 1');
    const user = result.rows[0];
    client.release();
    
    if (!user) {
      return res.status(404).send('No users found');
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Log in the user
    req.login(user, (err) => {
      if (err) return res.status(500).send('Error logging in: ' + err.message);
      
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });
      
      // HTML page with link to homepage
      res.send(`
        <html>
          <head>
            <title>Test Login Successful</title>
            <script>
              // Save token to localStorage
              localStorage.setItem('jwt_token', '${token}');
              console.log('Token saved to localStorage:', '${token}');
              
              // Redirect to homepage
              setTimeout(() => {
                window.location.href = '/';
              }, 2000);
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

export default router;