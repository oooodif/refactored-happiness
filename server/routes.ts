import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticateUser, requireAuth } from "./middleware/auth";
import { checkSubscription } from "./middleware/subscription";
import { setupAuth } from "./auth";

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

  // Setup authentication with Passport.js
  setupAuth(app);
  
  // Debugging middleware for sessions
  app.use((req, res, next) => {
    console.debug(`Session ID: ${req.sessionID}`);
    console.debug(`Session user ID: ${req.user?.id}`);
    next();
  });

  // LaTeX Generation Routes
  app.post("/api/latex/generate", 
    authenticateUser, // Allow anonymous users
    checkSubscription,
    validateRequest(generateLatexSchema),
    async (req: Request, res: Response) => {
      const { content, documentType, options } = req.body;
      const userId = req.user?.id; // Get user ID from Passport
      const isAuthenticated = req.isAuthenticated(); // Check if user is authenticated
      const shouldCompile = req.body.compile === true; // Optional flag to compile or not
      
      try {
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
    authenticateUser,
    async (req: Request, res: Response) => {
      const { latex } = req.body;
      
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
      const userId = req.user.id;
      
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
      const userId = req.user.id;
      
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
      const userId = req.user.id;
      
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
      const userId = req.user.id;
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
      const userId = req.user.id;
      
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
      const userId = req.user.id;
      
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
      const userId = req.user.id;
      
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
      
      const userId = req.user.id;
      
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
  
  // Purchase refill pack endpoint
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
        
        // Try to extract title from LaTeX content using heuristics first
        let title = extractTitleFromLatex(latex);
        
        // If we couldn't find a title using heuristics, use AI to extract a meaningful one
        if (title === "Untitled Document") {
          // Determine which AI provider to use
          const userId = req.session.userId;
          let provider = "groq"; // Default to Groq since you mentioned it works well
          
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
            const prompt = `Extract a concise, descriptive title (3-7 words) from this LaTeX document. Focus on the main topic and purpose. Return ONLY the title with no quotation marks or formatting:

${latex.substring(0, 5000)}`;  // Limit content to avoid token overflow
            
            // Use our existing AI provider interface
            const generatedTitle = await callProviderWithModel(`${provider}/llama3-8b-8192`, prompt);
            
            // Clean up the title (remove quotes, line breaks, etc.)
            title = generatedTitle
              .replace(/["'`]/g, '')  // Remove quotes
              .replace(/\\n|\\r/g, '') // Remove line breaks
              .replace(/^Title:\s*/i, '')  // Remove "Title:" prefix
              .replace(/^\s+|\s+$/g, '')  // Trim whitespace
              .substring(0, 100);  // Limit length
            
            // Use default if we got an empty title
            if (!title) {
              title = "Generated Document";
            }
          } catch (error) {
            console.error("Error generating title with AI:", error);
            title = "Generated Document";  // Fallback
          }
        }
        
        return res.status(200).json({ title });
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

/**
 * Temporary migration endpoint - to be removed after all users are migrated 
 */
import { migrateUserPassword, migrateAllUsersToNewPasswordFormat } from "./utils/password-migration";

export function addMigrationEndpoints(app: Express) {
  // Add this endpoint for individual password migration
  app.post("/api/auth/migrate-password", async (req: Request, res: Response) => {
    try {
      const { userId, password } = req.body;
      
      if (!userId || !password) {
        return res.status(400).json({ message: "Missing userId or password" });
      }
      
      const success = await migrateUserPassword(userId, password);
      
      if (success) {
        return res.status(200).json({ message: "Password migrated successfully" });
      } else {
        return res.status(500).json({ message: "Failed to migrate password" });
      }
    } catch (error) {
      console.error('Password migration error:', error);
      return res.status(500).json({ message: "Server error during password migration" });
    }
  });

  // Add this endpoint for bulk password migration
  app.post("/api/auth/migrate-all-passwords", async (req: Request, res: Response) => {
    try {
      const { adminPassword } = req.body;
      
      if (!adminPassword) {
        return res.status(400).json({ message: "Missing admin password" });
      }
      
      const result = await migrateAllUsersToNewPasswordFormat(adminPassword);
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Bulk password migration error:', error);
      return res.status(500).json({ message: "Server error during bulk password migration" });
    }
  });
}
