import { Router, Request, Response } from 'express';
import { storage } from './storage';

export const sessionViewerRouter = Router();

// Simple HTML output to debug session information
sessionViewerRouter.get('/session-viewer', async (req: Request, res: Response) => {
  try {
    let output = '<html><head><title>Session Viewer</title></head>';
    output += '<body style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto;">';
    output += '<h1>Session Viewer</h1>';
    
    // Show session information
    output += '<h2>Session Information</h2>';
    output += '<pre style="background: #f4f4f4; padding: 1rem; overflow: auto;">';
    
    // Check if user is authenticated in session
    const sessionId = req.sessionID;
    const userId = req.session.userId;
    
    output += `Session ID: ${sessionId || 'Not set'}\n`;
    output += `User ID in session: ${userId || 'Not set'}\n`;
    
    // If user ID exists, get user details
    let user = null;
    if (userId) {
      user = await storage.getUserById(userId);
      output += `\nUser found: ${user ? user.username : 'No user found with that ID'}\n`;
      
      if (user) {
        output += `\nUser details:\n`;
        output += JSON.stringify(user, null, 2);
      }
    }
    
    output += '</pre>';
    
    // Add a form to try logging in directly
    output += '<h2>Direct Login</h2>';
    output += '<form action="/api/auth/login" method="post" style="display: flex; flex-direction: column; gap: 1rem; max-width: 400px;">';
    output += '<div>';
    output += '<label for="email" style="display: block; margin-bottom: 0.5rem;">Email:</label>';
    output += '<input type="email" id="email" name="email" style="width: 100%; padding: 0.5rem;" required>';
    output += '</div>';
    output += '<div>';
    output += '<label for="password" style="display: block; margin-bottom: 0.5rem;">Password:</label>';
    output += '<input type="password" id="password" name="password" style="width: 100%; padding: 0.5rem;" required>';
    output += '</div>';
    output += '<button type="submit" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">Login</button>';
    output += '</form>';
    
    // Link to refresh the page
    output += '<div style="margin-top: 2rem;">';
    output += '<a href="/session-viewer" style="color: #3b82f6;">Refresh Page</a>';
    output += '</div>';
    
    // Link to go to home page
    output += '<div style="margin-top: 1rem;">';
    output += '<a href="/" style="color: #3b82f6;">Go to Home Page</a>';
    output += '</div>';
    
    // Link to log out
    output += '<div style="margin-top: 1rem;">';
    output += '<a href="/session-viewer/logout" style="color: #ef4444;">Logout</a>';
    output += '</div>';
    
    // Close the tags
    output += '</body></html>';
    
    res.send(output);
  } catch (error) {
    console.error('Session viewer error:', error);
    res.status(500).send('Error viewing session');
  }
});

// Logout route
sessionViewerRouter.get('/session-viewer/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      res.status(500).send('Error logging out');
      return;
    }
    
    res.redirect('/session-viewer');
  });
});