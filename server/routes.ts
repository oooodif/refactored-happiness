import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateUser, requireAuth } from "./middleware/auth";
import { checkSubscription } from "./middleware/subscription";

// Import validation middleware
import { z } from "zod";
// Define validateRequest middleware function here
const validateRequest = (schema: z.ZodType<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse(req.body);
      req.body = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: error.errors
        });
      }
      return res.status(500).json({ message: 'Internal server error during validation' });
    }
  };
};
import { generateLatexSchema } from "@shared/schema";
import { generateLatex, getAvailableModels, callProviderWithModel } from "./services/aiProvider";
import { compileLatex, compileAndFixLatex } from "./services/latexService";
import { 
  createCustomer, 
  createSubscription, 
  cancelSubscription, 
  createPortalSession,
  createRefillPackCheckoutSession
} from "./services/stripeService";
import { testPostmarkConnection, generateVerificationToken, sendVerificationEmail } from "./utils/email";
import Stripe from "stripe";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "../db";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing STRIPE_SECRET_KEY, Stripe functionality will be limited');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-04-30.basil" as any, // Using latest API version
    })
  : undefined;

// Add custom request type definition to handle session.userId
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple health check endpoints for deployment
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server is running' });
  });
  
  // Root health check endpoint (required by some hosting providers)
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // Enhanced session middleware configuration with maximum reliability
  const PostgresStore = pgSession(session);
  
  // Create the session store
  const sessionStore = new PostgresStore({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true,  // Ensure the table exists
    pruneSessionInterval: 60,    // Clean old sessions every minute
    // Lower error threshold for session store errors
    errorLog: console.error
  });
  
  // Set up session with robust configuration
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'latex-generator-session-secret',
    resave: true,                   // Always save session with every request
    rolling: true,                  // Reset expiration with each request
    saveUninitialized: false,       // Don't save empty sessions
    // Use the most reliable cookie configuration
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: false,                // Set to false for development
      httpOnly: true,               // Prevent JavaScript access
      sameSite: 'lax',             // Allow cross-site requests in specific cases
      path: '/'                     // Ensure cookies are sent with all requests
    },
    name: 'latex.sid'              // Custom name to avoid conflicts
  }));
  
  // Add development middleware to help debug session issues
  if (process.env.NODE_ENV !== 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' && req.path.startsWith('/api/')) {
        console.log('Session ID:', req.sessionID);
        console.log('Session data:', req.session);
      }
      next();
    });
  }
  // Authentication routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { username, email, password } = req.body;
    
    try {
      // Generate verification token
      const verificationToken = await generateVerificationToken();
      
      // Create user with verification token
      const result = await storage.createUser(username, email, password, verificationToken);
      
      if (result.success && result.user) {
        // Send verification email
        const emailResult = await sendVerificationEmail(email, verificationToken);
        
        if (!emailResult.success) {
          console.warn(`Failed to send verification email: ${emailResult.message}`);
          // Continue with registration even if email fails
        }
        
        // Set the user ID in the session
        req.session.userId = result.user.id;
        
        return res.status(201).json({
          user: result.user,
          usageLimit: result.usageLimit,
          emailVerificationSent: emailResult.success
        });
      } else {
        return res.status(400).json({ message: result.error });
      }
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Registration failed" });
    }
  });

  // Email verification endpoint
  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: "Invalid verification token" });
    }
    
    try {
      const result = await storage.verifyUserEmail(token);
      
      if (result.success && result.user) {
        // Set the user ID in the session
        req.session.userId = result.user.id;
        
        return res.status(200).json({
          success: true,
          message: "Email verified successfully",
          user: result.user
        });
      } else {
        return res.status(400).json({ 
          success: false,
          message: result.error || "Email verification failed" 
        });
      }
    } catch (error) {
      console.error("Email verification error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Email verification failed due to server error" 
      });
    }
  });

  // Test Postmark connection endpoint
  app.get("/api/auth/test-email", async (req: Request, res: Response) => {
    try {
      const result = await testPostmarkConnection();
      return res.status(200).json(result);
    } catch (error) {
      console.error("Test email error:", error);
      return res.status(500).json({ 
        success: false,
        message: "Failed to test email connection" 
      });
    }
  });
  
  // Resend verification email endpoint
  app.post("/api/auth/resend-verification", async (req: Request, res: Response) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    console.log(`Resend verification request for email: ${email}`);
    
    try {
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        // For security reasons, still return success even if user doesn't exist
        console.log(`User with email ${email} not found in database`);
        return res.status(200).json({
          success: true,
          message: "If your email is registered, a verification link has been sent"
        });
      }
      
      // If already verified, no need to resend
      if (user.emailVerified) {
        console.log(`User with email ${email} is already verified`);
        return res.status(200).json({
          success: true,
          message: "Your email is already verified, please log in"
        });
      }
      
      console.log(`Generating new verification token for user: ${user.id}`);
      // Generate new verification token
      const verificationToken = await generateVerificationToken();
      
      // Update user with new token
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      const updatedUser = await storage.updateUserVerificationToken(user.id, verificationToken, tokenExpiry);
      
      if (!updatedUser) {
        return res.status(500).json({
          success: false,
          message: "Failed to update verification token"
        });
      }
      
      // Send verification email
      const emailResult = await sendVerificationEmail(email, verificationToken);
      
      return res.status(200).json({
        success: true,
        message: "Verification email has been sent",
        emailSent: emailResult.success
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to resend verification email"
      });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    try {
      const result = await storage.validateUser(email, password);
      
      if (result.success && result.user) {
        // Check if email is verified
        if (!result.user.emailVerified) {
          return res.status(403).json({ 
            message: "Please verify your email before logging in",
            requiresEmailVerification: true
          });
        }
        
        // Set the user ID in the session
        req.session.userId = result.user.id;
        
        // Explicitly save the session to ensure it's persisted
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Failed to save session" });
          }
          
          // Set a cookie with a 30-day expiration
          res.cookie('userLoggedIn', 'true', { 
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: false, // Allow JavaScript access
            path: '/',
            sameSite: 'lax'
          });
          
          console.log(`User ${result.user.username} logged in successfully, session ID saved`);
          
          return res.status(200).json({
            user: result.user,
            usageLimit: result.usageLimit
          });
        });
      } else {
        return res.status(401).json({ message: result.error || "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    // Clear the backup cookie first
    res.clearCookie('userLoggedIn', { 
      path: '/', 
      httpOnly: false 
    });
    
    // Then destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      
      // Clear the session cookie
      res.clearCookie("latex.sid", { 
        path: '/' 
      });
      
      console.log("User logged out successfully, session destroyed");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticateUser, async (req: Request, res: Response) => {
    const userId = req.session.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const user = await storage.getUserById(userId);
      
      if (!user) {
        console.log(`User with ID ${userId} not found in database`);
        // Clear invalid session
        req.session.userId = undefined;
        return res.status(404).json({ message: "User not found" });
      }
      
      const usageLimit = await storage.getUserUsageLimit(user);
      
      return res.status(200).json({
        user,
        usageLimit
      });
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // LaTeX Generation Routes
  app.post("/api/latex/generate", 
    authenticateUser, // Allow anonymous users
    checkSubscription, // Already set to allow unlimited for testing
    validateRequest(generateLatexSchema),
    async (req: Request, res: Response) => {
      const { content, documentType, options } = req.body;
      const userId = req.session.userId; // May be undefined for guest users
      const isAuthenticated = !!userId; // Check if user is authenticated
      const shouldCompile = req.body.compile === true; // Optional flag to compile or not
      
      // GUEST MODE ENABLED - for testing purposes
      const GUEST_MODE = true;
      
      try {
        console.log(`LaTeX generation request - Auth: ${isAuthenticated ? 'Yes' : 'No (Guest)'}, Type: ${documentType}`);
        
        // Generate LaTeX using AI
        const latexResult = await generateLatex(content, documentType, options);
        
        if (!latexResult.success) {
          return res.status(500).json({ message: latexResult.error });
        }
        
        // Default empty compilation result
        let compilationResult = {
          success: false,
          pdf: null,
          error: null,
          errorDetails: null
        };
        
        // Only compile if explicitly requested
        if (shouldCompile) {
          console.log("Compiling LaTeX (requested)");
          compilationResult = await compileLatex(latexResult.latex);
        }
        
        // Only track usage and save document if user is authenticated
        let documentId;
        
        if (isAuthenticated) {
          // Increment usage counter for the user
          await storage.incrementUserUsage(userId);
          
          // Save the document
          const document = await storage.saveDocument({
            userId,
            title: getDocumentTitle(content),
            inputContent: content,
            latexContent: latexResult.latex,
            documentType,
            compilationSuccessful: shouldCompile ? compilationResult.success : false,
            compilationError: shouldCompile ? (compilationResult.error || null) : null
          });
          
          documentId = document.id;
        }
        
        return res.status(200).json({
          latex: latexResult.latex,
          compilationResult,
          documentId
        });
      } catch (error) {
        console.error("LaTeX generation error:", error);
        return res.status(500).json({ message: "Failed to generate LaTeX" });
      }
    }
  );

  app.post("/api/latex/compile", 
    authenticateUser, // Allow guest users 
    async (req: Request, res: Response) => {
      const { latex } = req.body;
      const isAuthenticated = !!req.session.userId;
      
      console.log(`LaTeX compilation request - Auth: ${isAuthenticated ? 'Yes' : 'No (Guest)'}`);
      
      if (!latex) {
        return res.status(400).json({ message: "LaTeX content is required" });
      }
      
      try {
        const compilationResult = await compileLatex(latex);
        
        return res.status(200).json({
          latex,
          compilationResult
        });
      } catch (error) {
        console.error("LaTeX compilation error:", error);
        return res.status(500).json({ message: "Failed to compile LaTeX" });
      }
    }
  );

  app.post("/api/latex/compile/fix", 
    authenticateUser,
    async (req: Request, res: Response) => {
      const { latex, errorDetails } = req.body;
      
      if (!latex) {
        return res.status(400).json({ message: "LaTeX content is required" });
      }
      
      try {
        const result = await compileAndFixLatex(latex, errorDetails);
        
        return res.status(200).json({
          latex: result.fixedLatex,
          compilationResult: result.compilationResult
        });
      } catch (error) {
        console.error("LaTeX fix error:", error);
        return res.status(500).json({ message: "Failed to fix LaTeX" });
      }
    }
  );

  // Document routes
  app.get("/api/documents", 
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId;
      
      try {
        const documents = await storage.getUserDocuments(userId);
        return res.status(200).json(documents);
      } catch (error) {
        console.error("Get documents error:", error);
        return res.status(500).json({ message: "Failed to get documents" });
      }
    }
  );

  app.get("/api/documents/:id", 
    requireAuth,
    async (req: Request, res: Response) => {
      const documentId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      try {
        const document = await storage.getDocumentById(documentId);
        
        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }
        
        if (document.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        return res.status(200).json(document);
      } catch (error) {
        console.error("Get document error:", error);
        return res.status(500).json({ message: "Failed to get document" });
      }
    }
  );

  app.get("/api/documents/:id/pdf", 
    requireAuth,
    async (req: Request, res: Response) => {
      const documentId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      try {
        const document = await storage.getDocumentById(documentId);
        
        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }
        
        if (document.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        if (!document.compilationSuccessful) {
          return res.status(400).json({ message: "Document has not been successfully compiled" });
        }
        
        // Compile the LaTeX to get the PDF
        const compilationResult = await compileLatex(document.latexContent);
        
        if (!compilationResult.success) {
          return res.status(500).json({ message: "Failed to compile LaTeX" });
        }
        
        return res.status(200).json({
          pdf: compilationResult.pdf
        });
      } catch (error) {
        console.error("Get document PDF error:", error);
        return res.status(500).json({ message: "Failed to get document PDF" });
      }
    }
  );

  app.post("/api/documents", 
    requireAuth,
    async (req: Request, res: Response) => {
      const userId = req.session.userId;
      const { title, inputContent, latexContent, documentType, compilationSuccessful, compilationError } = req.body;
      
      try {
        const document = await storage.saveDocument({
          userId,
          title,
          inputContent,
          latexContent,
          documentType,
          compilationSuccessful,
          compilationError
        });
        
        return res.status(201).json(document);
      } catch (error) {
        console.error("Save document error:", error);
        return res.status(500).json({ message: "Failed to save document" });
      }
    }
  );

  app.patch("/api/documents/:id", 
    requireAuth,
    async (req: Request, res: Response) => {
      const documentId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      try {
        const existingDocument = await storage.getDocumentById(documentId);
        
        if (!existingDocument) {
          return res.status(404).json({ message: "Document not found" });
        }
        
        if (existingDocument.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        const { title, inputContent, latexContent, documentType, compilationSuccessful, compilationError } = req.body;
        
        const updatedDocument = await storage.updateDocument(documentId, {
          title,
          inputContent,
          latexContent,
          documentType,
          compilationSuccessful,
          compilationError
        });
        
        return res.status(200).json(updatedDocument);
      } catch (error) {
        console.error("Update document error:", error);
        return res.status(500).json({ message: "Failed to update document" });
      }
    }
  );

  app.delete("/api/documents/:id", 
    requireAuth,
    async (req: Request, res: Response) => {
      const documentId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      try {
        const document = await storage.getDocumentById(documentId);
        
        if (!document) {
          return res.status(404).json({ message: "Document not found" });
        }
        
        if (document.userId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        await storage.deleteDocument(documentId);
        
        return res.status(200).json({ message: "Document deleted successfully" });
      } catch (error) {
        console.error("Delete document error:", error);
        return res.status(500).json({ message: "Failed to delete document" });
      }
    }
  );

  // Subscription routes
  app.post("/api/subscription/create", 
    requireAuth,
    async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const { tier } = req.body;
      const userId = req.session.userId;
      
      try {
        const user = await storage.getUserById(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // If user already has a subscription, return the portal URL instead
        if (user.stripeSubscriptionId) {
          const session = await createPortalSession(user.stripeCustomerId);
          return res.status(200).json({ url: session.url });
        }
        
        // Create or get a Stripe customer
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          const customer = await createCustomer(user.email, user.username);
          customerId = customer.id;
          
          // Update user with Stripe customer ID
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: customerId
          });
        }
        
        // Create subscription
        const subscription = await createSubscription(customerId, tier);
        
        // Get the client secret from the latest invoice's payment intent
        const latestInvoice = subscription.latest_invoice as any;
        const paymentIntent = latestInvoice?.payment_intent;
        const clientSecret = paymentIntent?.client_secret;
        
        return res.status(200).json({
          clientSecret: clientSecret
        });
      } catch (error) {
        console.error("Create subscription error:", error);
        return res.status(500).json({ message: "Failed to create subscription" });
      }
    }
  );

  app.post("/api/subscription/cancel", 
    requireAuth,
    async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const userId = req.session.userId;
      
      try {
        const user = await storage.getUserById(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.stripeSubscriptionId) {
          return res.status(400).json({ message: "No active subscription found" });
        }
        
        // Cancel the subscription
        const cancelResult = await cancelSubscription(user.stripeSubscriptionId);
        
        return res.status(200).json({
          success: true,
          message: "Your subscription has been cancelled and will end at the end of the billing period."
        });
      } catch (error) {
        console.error("Cancel subscription error:", error);
        return res.status(500).json({ message: "Failed to cancel subscription" });
      }
    }
  );

  app.post("/api/subscription/portal", 
    requireAuth,
    async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const userId = req.session.userId;
      
      try {
        const user = await storage.getUserById(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.stripeCustomerId) {
          return res.status(400).json({ message: "No Stripe customer found" });
        }
        
        // Create a billing portal session
        const session = await createPortalSession(user.stripeCustomerId);
        
        return res.status(200).json({ url: session.url });
      } catch (error) {
        console.error("Create portal session error:", error);
        return res.status(500).json({ message: "Failed to create portal session" });
      }
    }
  );
  
  // Create payment intent for refill pack
  app.post("/api/subscription/refill/create", 
    requireAuth,
    async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const userId = req.session.userId;
      
      try {
        const user = await storage.getUserById(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Only allow paid subscribers to purchase refill packs
        if (user.subscriptionTier === SubscriptionTier.Free) {
          return res.status(403).json({ 
            message: "Refill packs are only available for paid subscribers. Please upgrade to a paid plan first." 
          });
        }
        
        // Create a payment intent for the refill pack
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(REFILL_PACK_PRICE * 100), // Convert to cents
          currency: "usd",
          customer: user.stripeCustomerId,
          metadata: {
            userId: userId.toString(),
            type: "refill_pack",
            credits: REFILL_PACK_CREDITS.toString()
          }
        });
        
        return res.status(200).json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating refill payment intent:", error);
        return res.status(500).json({ message: "Failed to create payment intent" });
      }
    }
  );
  
  // Process refill pack purchase webhook
  app.post("/api/subscription/refill", 
    requireAuth,
    async (req: Request, res: Response) => {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe is not configured" });
      }
      
      const userId = req.session.userId;
      const quantity = req.body.quantity || 1;
      
      try {
        const user = await storage.getUserById(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          // Create a new customer
          const customer = await createCustomer(user.email, user.username);
          customerId = customer.id;
          
          // Update user with Stripe customer ID
          await storage.updateUserStripeInfo(userId, {
            stripeCustomerId: customerId
          });
        }
        
        // Create a checkout session for the refill pack
        const session = await createRefillPackCheckoutSession(customerId, quantity);
        
        return res.status(200).json({
          sessionId: session.id,
          url: session.url
        });
      } catch (error) {
        console.error("Create refill pack checkout error:", error);
        return res.status(500).json({ message: "Failed to create checkout session for refill pack" });
      }
    }
  );

  // Stripe webhook
  app.post("/webhook/stripe", 
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(500).json({ message: "Stripe is not fully configured" });
      }
      
      const sig = req.headers['stripe-signature'] as string;
      
      try {
        const event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        
        // Handle the event
        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const subscriptionId = subscription.id;
            const status = subscription.status;
            const priceId = subscription.items.data[0].price.id;
            
            // Get tier from price ID
            const tierMapping: Record<string, string> = {
              [process.env.STRIPE_PRICE_TIER1_ID || 'price_tier1']: 'tier1',
              [process.env.STRIPE_PRICE_TIER2_ID || 'price_tier2']: 'tier2',
              [process.env.STRIPE_PRICE_TIER3_ID || 'price_tier3']: 'tier3',
              [process.env.STRIPE_PRICE_TIER4_ID || 'price_tier4']: 'tier4',
              [process.env.STRIPE_PRICE_TIER5_ID || 'price_tier5']: 'tier5'
            };
            
            const tier = tierMapping[priceId] || 'tier1';
            
            // Update user subscription info
            await storage.updateUserSubscription(customerId, {
              stripeSubscriptionId: subscriptionId,
              subscriptionTier: tier,
              subscriptionStatus: status
            });
            
            break;
          }
          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            
            // Downgrade user to free tier
            await storage.updateUserSubscription(customerId, {
              stripeSubscriptionId: null,
              subscriptionTier: 'free',
              subscriptionStatus: 'inactive'
            });
            
            break;
          }
          // Add more event types as needed
        }
        
        res.json({ received: true });
      } catch (err) {
        console.error('Webhook error:', err);
        return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
  );

  // API route for available AI models
  app.get("/api/models", 
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const userId = req.session.userId;
        const user = await storage.getUserById(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        const models = await getAvailableModels(user.subscriptionTier);
        
        return res.status(200).json(models);
      } catch (error) {
        console.error("Get models error:", error);
        return res.status(500).json({ message: "Failed to get available models" });
      }
    }
  );

  // Extract title from LaTeX content using AI
  app.post("/api/latex/extract-title", 
    authenticateUser,
    async (req: Request, res: Response) => {
      try {
        const { latex } = req.body;
        
        if (!latex) {
          return res.status(400).json({ message: "LaTeX content is required" });
        }
        
        // Always use AI to generate a title without relying on heuristics
        // Determine which AI provider to use
        const userId = req.session.userId;
        let provider = "groq"; // Default to Groq as it's efficient and cost-effective
          
        if (userId) {
          const user = await storage.getUserById(userId);
          if (user) {
            // Use a provider based on user's subscription tier
            // For now just use Groq
            provider = "groq";
          }
        }
        
        // Generate a meaningful title based on the LaTeX content
        try {
          // Improved prompt focusing on key concepts and meaningful title generation
          const prompt = `Analyze this LaTeX document content and generate a concise, meaningful title (3-7 words) that captures its core subject matter.
          
Your title should be descriptive, academically appropriate, and directly relevant to the content. 
Avoid generic titles like "Assignment" or "Document". Focus on identifying the main theme or research topic.

Return ONLY the title with no quotes, explanations, or additional formatting:

${latex.substring(0, 5000)}`;  // Limit content to avoid token overflow
          
          // Use our existing AI provider interface
          const generatedTitle = await callProviderWithModel(`${provider}/llama3-8b-8192`, prompt);
          
          // Clean up the title (remove quotes, line breaks, etc.)
          let title = generatedTitle
            .replace(/["'`]/g, '')  // Remove quotes
            .replace(/\\n|\\r/g, '') // Remove line breaks
            .replace(/^Title:\s*/i, '')  // Remove "Title:" prefix
            .replace(/\\LaTeX|\\TeX/g, 'LaTeX') // Fix LaTeX command formatting
            .replace(/^\s+|\s+$/g, '')  // Trim whitespace
            .substring(0, 100);  // Limit length
          
          // Use default if we got an empty title
          if (!title || title.length < 3) {
            // Try to extract from LaTeX as fallback
            title = extractTitleFromLatex(latex);
          }
          
          return res.status(200).json({ title });
        } catch (error) {
          console.error("Error generating title with AI:", error);
          
          // Fall back to heuristic extraction
          const title = extractTitleFromLatex(latex);
          return res.status(200).json({ title });
        }
      } catch (error) {
        console.error("Title extraction error:", error);
        return res.status(500).json({ 
          message: "Failed to extract title", 
          title: "Generated Document"  // Provide fallback
        });
      }
    }
  );
  
  // Helper function to extract title from LaTeX content using heuristics
  function extractTitleFromLatex(latex: string): string {
    // Try various patterns to find the title in the LaTeX code
    const patterns = [
      /\\title\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/,      // \title{...} command
      /\\begin\{document\}[\s\S]*?\\section\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/, // First section after begin{document}
      /\\begin\{document\}[\s\S]*?\\chapter\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/, // First chapter after begin{document}
      /\\maketitle[\s\S]*?\\section\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/,         // First section after maketitle
    ];
    
    for (const pattern of patterns) {
      const match = latex.match(pattern);
      if (match && match[1] && match[1].trim()) {
        let title = match[1].trim();
        
        // Remove LaTeX commands from the title
        title = title.replace(/\\[a-zA-Z]+(\{[^{}]*\}|\[[^[\]]*\])?/g, '');
        title = title.replace(/[\\\{\}]/g, '');
        
        return title.trim() || "Untitled Document";
      }
    }
    
    return "Untitled Document";
  }
  
  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to extract a title from content
function getDocumentTitle(content: string): string {
  // Try to find a heading or title in the content
  const titleMatch = content.match(/^#\s+(.+)$/m) || 
                    content.match(/^Title:\s*(.+)$/mi) ||
                    content.match(/^(.{1,50})/);
  
  if (titleMatch && titleMatch[1].trim()) {
    return titleMatch[1].trim();
  }
  
  return "Untitled Document";
}
