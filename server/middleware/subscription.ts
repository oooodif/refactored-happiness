import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { SubscriptionTier, tierLimits } from '@shared/schema';

/**
 * Middleware to check if user has exceeded their subscription limits
 * NOTE: Usage limits have been temporarily disabled for testing purposes
 */
export async function checkSubscription(req: Request, res: Response, next: NextFunction) {
  // TEMPORARY: Skip all usage limit checks and allow unlimited generations
  return next();
  
  /* Original implementation (currently disabled)
  // Allow anonymous users a limited number of requests
  if (!req.session.userId) {
    // Anonymous users get the free tier limit
    const freeLimit = tierLimits[SubscriptionTier.Free];
    
    // Check if there's an anonymous session with usage tracking
    if (!req.session.anonymousUsage) {
      req.session.anonymousUsage = 0;
    }
    
    // Check if anonymous user has exceeded the limit
    if (req.session.anonymousUsage >= freeLimit) {
      return res.status(402).json({
        message: 'You have reached the free usage limit. Please sign in or create an account to continue.',
        usageLimit: freeLimit,
        currentUsage: req.session.anonymousUsage
      });
    }
    
    // Increment anonymous usage
    req.session.anonymousUsage++;
    
    return next();
  }
  
  try {
    const user = await storage.getUserById(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Get the usage limit for the user's subscription tier
    const usageLimit = tierLimits[user.subscriptionTier as SubscriptionTier] || tierLimits[SubscriptionTier.Free];
    
    // Check if user has exceeded their usage limit
    if (user.monthlyUsage >= usageLimit) {
      return res.status(402).json({
        message: 'You have reached your monthly usage limit. Please upgrade your subscription to continue.',
        subscriptionTier: user.subscriptionTier,
        usageLimit,
        currentUsage: user.monthlyUsage,
        nextTier: getNextTier(user.subscriptionTier as SubscriptionTier)
      });
    }
    
    // User has not exceeded their limit, continue
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    return res.status(500).json({ message: 'Server error checking subscription' });
  }
  */
}

/**
 * Get the next higher subscription tier
 */
function getNextTier(currentTier: SubscriptionTier): SubscriptionTier | null {
  const tiers = [
    SubscriptionTier.Free,
    SubscriptionTier.Basic,
    SubscriptionTier.Pro,
    SubscriptionTier.Power
  ];
  
  const currentIndex = tiers.indexOf(currentTier);
  
  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null; // Already at highest tier or invalid tier
  }
  
  return tiers[currentIndex + 1];
}

/**
 * Reset monthly usage for all users
 * Should be called by a scheduled job at the start of each month
 */
export async function resetMonthlyUsage(): Promise<void> {
  try {
    await storage.resetAllUsersMonthlyUsage();
    console.log('Monthly usage reset completed successfully');
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
  }
}

/**
 * Middleware to check if requested model is available for user's tier
 * NOTE: Model tier restrictions have been temporarily disabled for testing purposes
 */
export async function checkModelAccess(req: Request, res: Response, next: NextFunction) {
  // TEMPORARY: Skip all model access checks
  return next();
  
  /* Original implementation (currently disabled)
  const { model } = req.body.options || {};
  
  // If no specific model is requested, continue
  if (!model) {
    return next();
  }
  
  try {
    // Get user's subscription tier
    let userTier = SubscriptionTier.Free;
    
    if (req.session.userId) {
      const user = await storage.getUserById(req.session.userId);
      if (user) {
        userTier = user.subscriptionTier as SubscriptionTier;
      }
    }
    
    // Check if model is available for user's tier
    const modelInfo = await storage.getModelInfo(model);
    
    if (!modelInfo) {
      return res.status(400).json({ message: `Model "${model}" not found` });
    }
    
    const tierAccess = {
      [SubscriptionTier.Free]: [SubscriptionTier.Free],
      [SubscriptionTier.Basic]: [SubscriptionTier.Free, SubscriptionTier.Basic],
      [SubscriptionTier.Pro]: [SubscriptionTier.Free, SubscriptionTier.Basic, SubscriptionTier.Pro],
      [SubscriptionTier.Power]: [SubscriptionTier.Free, SubscriptionTier.Basic, SubscriptionTier.Pro, SubscriptionTier.Power]
    };
    
    if (!tierAccess[userTier].includes(modelInfo.tier)) {
      return res.status(403).json({
        message: `Model "${model}" requires ${modelInfo.tier} subscription or higher. You are currently on ${userTier}.`,
        requiredTier: modelInfo.tier,
        currentTier: userTier
      });
    }
    
    // Model is available for user's tier
    next();
  } catch (error) {
    console.error('Model access check error:', error);
    next(); // Continue anyway to use default model
  }
  */
}
