import { db } from "@db";
import { 
  users, 
  documents, 
  anonymousUsers,
  User, 
  Document, 
  AnonymousUser,
  insertUserSchema, 
  insertDocumentSchema,
  insertAnonymousUserSchema,
  SubscriptionTier,
  tierLimits
} from "@shared/schema";
import { hashPassword, comparePassword } from "./services/authService";
import { eq, and, desc, isNull } from "drizzle-orm";

/**
 * Storage interface for database operations
 */
export const storage = {
  // User operations
  async createUser(
    username: string, 
    email: string, 
    password: string, 
    verificationToken?: string
  ): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    usageLimit?: number;
  }> {
    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: (users) => 
          eq(users.username, username) || eq(users.email, email)
      });
      
      if (existingUser) {
        return {
          success: false,
          error: 'Username or email already in use'
        };
      }
      
      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Set verification token expiry (24 hours)
      const tokenExpiry = verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined;
      
      // Create user with default free tier
      const [newUser] = await db.insert(users).values({
        username,
        email,
        password: hashedPassword,
        role: 'user',
        subscriptionTier: SubscriptionTier.Free,
        subscriptionStatus: 'active',
        monthlyUsage: 0,
        usageResetDate: new Date(),
        emailVerified: false,
        verificationToken,
        verificationTokenExpiry: tokenExpiry
      }).returning();
      
      // Get usage limit for free tier
      const usageLimit = tierLimits[SubscriptionTier.Free];
      
      return {
        success: true,
        user: newUser,
        usageLimit
      };
    } catch (error) {
      console.error('Create user error:', error);
      
      // Check for duplicate email error (PostgreSQL error code 23505)
      const pgError = error as any;
      if (pgError.code === '23505') {
        if (pgError.detail && pgError.detail.includes('(email)=')) {
          return {
            success: false,
            error: 'Email address already registered. Please use a different email or try to log in.'
          };
        } else if (pgError.detail && pgError.detail.includes('(username)=')) {
          return {
            success: false,
            error: 'Username already taken. Please choose a different username.'
          };
        }
      }
      
      return {
        success: false,
        error: 'Failed to create user'
      };
    }
  },
  
  async validateUser(email: string, password: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
    usageLimit?: number;
  }> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: (users) => eq(users.email, email)
      });
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }
      
      // Verify password
      const passwordValid = await comparePassword(password, user.password);
      
      if (!passwordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }
      
      // Get usage limit for the user's tier
      const usageLimit = tierLimits[user.subscriptionTier as SubscriptionTier] || tierLimits[SubscriptionTier.Free];
      
      return {
        success: true,
        user,
        usageLimit
      };
    } catch (error) {
      console.error('Validate user error:', error);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  },
  
  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: (users) => eq(users.id, userId)
      });
      
      return user || null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },
  
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: (users) => eq(users.email, email)
      });
      
      return user || null;
    } catch (error) {
      console.error('Get user by email error:', error);
      return null;
    }
  },
  
  async getUserByVerificationToken(token: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: (users) => eq(users.verificationToken, token)
      });
      
      return user || null;
    } catch (error) {
      console.error('Get user by verification token error:', error);
      return null;
    }
  },
  
  async verifyUserEmail(token: string): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      // Find user with the token
      const user = await this.getUserByVerificationToken(token);
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid verification token'
        };
      }
      
      // Check if token is expired
      if (user.verificationTokenExpiry && new Date(user.verificationTokenExpiry) < new Date()) {
        return {
          success: false,
          error: 'Verification token expired'
        };
      }
      
      // Update user to mark email as verified and clear token
      const [updatedUser] = await db.update(users)
        .set({
          emailVerified: true,
          verificationToken: null,
          verificationTokenExpiry: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id))
        .returning();
      
      return {
        success: true,
        user: updatedUser
      };
    } catch (error) {
      console.error('Verify user email error:', error);
      return {
        success: false,
        error: 'Failed to verify email'
      };
    }
  },
  
  async getUserByStripeCustomerId(customerId: string): Promise<User | null> {
    try {
      const user = await db.query.users.findFirst({
        where: (users) => eq(users.stripeCustomerId, customerId)
      });
      
      return user || null;
    } catch (error) {
      console.error('Get user by Stripe customer ID error:', error);
      return null;
    }
  },
  
  async updateUserVerificationToken(userId: number, token: string, expiry: Date): Promise<User | null> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          verificationToken: token,
          verificationTokenExpiry: expiry,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser || null;
    } catch (error) {
      console.error('Update user verification token error:', error);
      return null;
    }
  },
  
  async updateUserStripeInfo(userId: number, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string | null;
  }): Promise<User | null> {
    try {
      const [updatedUser] = await db.update(users)
        .set(stripeInfo)
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser || null;
    } catch (error) {
      console.error('Update user Stripe info error:', error);
      return null;
    }
  },
  
  async updateUserSubscription(customerId: string, subscription: {
    stripeSubscriptionId?: string | null;
    subscriptionTier?: string;
    subscriptionStatus?: string;
  }): Promise<User | null> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          ...subscription,
          updatedAt: new Date()
        })
        .where(eq(users.stripeCustomerId, customerId))
        .returning();
      
      return updatedUser || null;
    } catch (error) {
      console.error('Update user subscription error:', error);
      return null;
    }
  },
  
  /**
   * Increment user usage and handle credit consumption with the new pricing model:
   * 1. Monthly subscription credits are used first
   * 2. Refill pack credits are used after monthly subscription credits are exhausted
   * 3. Monthly credits reset at the beginning of each month
   * 4. Refill pack credits never expire
   */
  async incrementUserUsage(userId: number): Promise<User | null> {
    try {
      const user = await this.getUserById(userId);
      
      if (!user) {
        return null;
      }
      
      const now = new Date();
      const resetDate = new Date(user.usageResetDate);
      
      // Check if it's time to reset monthly usage (new month)
      const isNewMonth = now.getMonth() !== resetDate.getMonth() || 
                        now.getFullYear() !== resetDate.getFullYear();
      
      if (isNewMonth) {
        // If it's a new month, reset the monthly usage but keep refill pack credits
        const [updatedUser] = await db.update(users)
          .set({
            monthlyUsage: 1, // Start with 1 for the current request
            usageResetDate: now,
            updatedAt: now
          })
          .where(eq(users.id, userId))
          .returning();
        
        return updatedUser || null;
      }
      
      // Get the monthly limit based on subscription tier
      const monthlyLimit = tierLimits[user.subscriptionTier as SubscriptionTier] || 
                           tierLimits[SubscriptionTier.Free];
      
      // Check if monthly credits are available
      if (user.monthlyUsage < monthlyLimit) {
        // Use monthly subscription credits
        const [updatedUser] = await db.update(users)
          .set({
            monthlyUsage: user.monthlyUsage + 1,
            updatedAt: now
          })
          .where(eq(users.id, userId))
          .returning();
        
        return updatedUser || null;
      } else if (user.refillPackCredits > 0) {
        // Monthly credits exhausted, use refill pack credits
        const [updatedUser] = await db.update(users)
          .set({
            // Monthly usage still increments for tracking purposes
            monthlyUsage: user.monthlyUsage + 1,
            // Decrement refill pack credits
            refillPackCredits: user.refillPackCredits - 1,
            updatedAt: now
          })
          .where(eq(users.id, userId))
          .returning();
        
        return updatedUser || null;
      } else {
        // No credits available (monthly or refill), still track the request
        // but return user as-is (frontend will show "out of credits" message)
        const [updatedUser] = await db.update(users)
          .set({
            monthlyUsage: user.monthlyUsage + 1,
            updatedAt: now
          })
          .where(eq(users.id, userId))
          .returning();
        
        return updatedUser || null;
      }
    } catch (error) {
      console.error('Increment user usage error:', error);
      return null;
    }
  },
  
  async getUserUsageLimit(user: User): Promise<number> {
    return tierLimits[user.subscriptionTier as SubscriptionTier] || tierLimits[SubscriptionTier.Free];
  },
  
  async resetAllUsersMonthlyUsage(): Promise<void> {
    try {
      await db.update(users)
        .set({
          monthlyUsage: 0,
          usageResetDate: new Date(),
          updatedAt: new Date()
        });
      
      console.log('Reset all users monthly usage');
    } catch (error) {
      console.error('Reset all users monthly usage error:', error);
      throw error;
    }
  },
  
  // Document operations
  async saveDocument(documentData: {
    userId: number;
    title: string;
    inputContent: string;
    latexContent: string;
    documentType: string;
    compilationSuccessful: boolean;
    compilationError?: string | null;
  }): Promise<Document> {
    try {
      const [document] = await db.insert(documents).values({
        ...documentData,
        metadata: {}
      }).returning();
      
      return document;
    } catch (error) {
      console.error('Save document error:', error);
      throw error;
    }
  },
  
  async getDocumentById(documentId: number): Promise<Document | null> {
    try {
      const document = await db.query.documents.findFirst({
        where: (documents) => eq(documents.id, documentId)
      });
      
      return document || null;
    } catch (error) {
      console.error('Get document error:', error);
      return null;
    }
  },
  
  async getUserDocuments(userId: number): Promise<Document[]> {
    try {
      const userDocuments = await db.query.documents.findMany({
        where: (documents) => eq(documents.userId, userId),
        orderBy: [desc(documents.updatedAt)]
      });
      
      return userDocuments;
    } catch (error) {
      console.error('Get user documents error:', error);
      return [];
    }
  },
  
  async updateDocument(documentId: number, documentData: {
    title?: string;
    inputContent?: string;
    latexContent?: string;
    documentType?: string;
    compilationSuccessful?: boolean;
    compilationError?: string | null;
  }): Promise<Document | null> {
    try {
      const [updatedDocument] = await db.update(documents)
        .set({
          ...documentData,
          updatedAt: new Date()
        })
        .where(eq(documents.id, documentId))
        .returning();
      
      return updatedDocument || null;
    } catch (error) {
      console.error('Update document error:', error);
      return null;
    }
  },
  
  async deleteDocument(documentId: number): Promise<void> {
    try {
      await db.delete(documents)
        .where(eq(documents.id, documentId));
    } catch (error) {
      console.error('Delete document error:', error);
      throw error;
    }
  },
  
  /**
   * Update user's refill pack credits
   * Used when a user purchases a refill pack
   */
  async updateUserRefillCredits(userId: number, newCredits: number): Promise<User | null> {
    try {
      // Update user with new refill pack credits
      const [updatedUser] = await db.update(users)
        .set({
          refillPackCredits: newCredits,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser || null;
    } catch (error) {
      console.error('Update refill credits error:', error);
      return null;
    }
  },
  
  /**
   * Add credits to a user's refill pack
   */
  async addCredits(userId: number, credits: number): Promise<User | null> {
    try {
      const user = await this.getUserById(userId);
      
      if (!user) {
        return null;
      }
      
      const currentCredits = user.refillPackCredits || 0;
      const newTotalCredits = currentCredits + credits;
      
      return this.updateUserRefillCredits(userId, newTotalCredits);
    } catch (error) {
      console.error('Add credits error:', error);
      return null;
    }
  },
  
  /**
   * Update Stripe Customer ID for a user
   */
  async updateStripeCustomerId(userId: number, customerId: string): Promise<User | null> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          stripeCustomerId: customerId,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser || null;
    } catch (error) {
      console.error('Update Stripe customer ID error:', error);
      return null;
    }
  },
  
  /**
   * Update subscription information for a user
   */
  async updateSubscription(userId: number, subscriptionData: {
    stripeSubscriptionId?: string;
    tier?: string;
    subscriptionStatus?: string;
    currentPeriodEnd?: Date | null;
  }): Promise<User | null> {
    try {
      const [updatedUser] = await db.update(users)
        .set({
          stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
          subscriptionTier: subscriptionData.tier || SubscriptionTier.Free,
          subscriptionStatus: subscriptionData.subscriptionStatus || 'active',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser || null;
    } catch (error) {
      console.error('Update subscription error:', error);
      return null;
    }
  },
  
  /**
   * Get a user by ID - a simpler version that doesn't require any special handling
   */
  async getUser(userId: number): Promise<User | null> {
    return this.getUserById(userId);
  },

  // AI model info
  async getModelInfo(modelName: string): Promise<{ tier: SubscriptionTier } | null> {
    // Map model names to their tiers
    const modelTierMap: Record<string, SubscriptionTier> = {
      // OpenAI models
      'gpt-4o': SubscriptionTier.Power,
      'gpt-3.5-turbo': SubscriptionTier.Basic,
      
      // Anthropic models
      'claude-3-7-sonnet-20250219': SubscriptionTier.Pro,
      'claude-3-haiku-20240307': SubscriptionTier.Basic,
      
      // Groq models
      'llama3-8b-8192': SubscriptionTier.Free,
      'mixtral-8x7b-32768': SubscriptionTier.Free,
      
      // TogetherAI models
      'mistral-7b-instruct': SubscriptionTier.Free,
      
      // HuggingFace models
      'HuggingFaceH4/zephyr-7b-beta': SubscriptionTier.Free,
      
      // OpenRouter models
      'google/gemini-pro': SubscriptionTier.Basic,
      'anthropic/claude-3-sonnet': SubscriptionTier.Pro,
      'openai/gpt-4': SubscriptionTier.Power
    };
    
    const tier = modelTierMap[modelName];
    
    if (!tier) {
      return null;
    }
    
    return { tier };
  }
};
