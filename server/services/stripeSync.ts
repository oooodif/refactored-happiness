import Stripe from 'stripe';
import { storage } from '../storage';
import { SubscriptionTier, User } from '@shared/schema';

/**
 * Service for keeping our database in sync with Stripe's API
 * 
 * This service handles bidirectional synchronization between our database and Stripe.
 * It also enforces the rule that users can only have one active subscription at a time
 * by sorting and retaining only the most recent subscription when multiple are found.
 */

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil' as any, // Using latest API version
});

export const stripeSync = {
  /**
   * Synchronize a user from our database to Stripe
   * This ensures that Stripe has up-to-date information about our user
   */
  async syncUserToStripe(userId: number): Promise<{
    success: boolean;
    message: string;
    stripeCustomerId?: string;
  }> {
    try {
      // Get the user from our database
      const user = await storage.getUser(userId);
      
      if (!user) {
        return {
          success: false,
          message: `User with ID ${userId} not found in database`,
        };
      }
      
      // If the user already has a Stripe Customer ID, fetch and update the customer
      if (user.stripeCustomerId) {
        try {
          // Get the customer from Stripe
          const customer = await stripe.customers.retrieve(user.stripeCustomerId);
          
          // If customer exists and isn't deleted, update it
          if (customer && !('deleted' in customer && customer.deleted)) {
            // Update the customer with latest user information
            await stripe.customers.update(user.stripeCustomerId, {
              email: user.email || user.username,
              name: user.username,
              metadata: {
                userId: user.id.toString(),
                tier: user.subscriptionTier,
              },
            });
            
            return {
              success: true,
              message: `User ${userId} (${user.username}) successfully synced to Stripe Customer ${user.stripeCustomerId}`,
              stripeCustomerId: user.stripeCustomerId,
            };
          }
          
          // If the customer was deleted in Stripe, create a new one
          // and update our database
          console.log(`Stripe Customer ${user.stripeCustomerId} for User ${userId} was deleted, creating new customer`);
        } catch (error) {
          // If we get a "no such customer" error, create a new one
          console.log(`Stripe Customer ${user.stripeCustomerId} for User ${userId} not found in Stripe, creating new customer`);
        }
      }
      
      // Create a new Stripe customer
      const newCustomer = await stripe.customers.create({
        email: user.email || user.username,
        name: user.username,
        metadata: {
          userId: user.id.toString(),
          tier: user.subscriptionTier,
        },
      });
      
      // Update our database with the new Stripe Customer ID
      await storage.updateStripeCustomerId(userId, newCustomer.id);
      
      return {
        success: true,
        message: `Created new Stripe Customer ${newCustomer.id} for User ${userId} (${user.username})`,
        stripeCustomerId: newCustomer.id,
      };
    } catch (error) {
      console.error('Error syncing user to Stripe:', error);
      return {
        success: false,
        message: `Error syncing user to Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  
  /**
   * Reconcile a Stripe customer with our database
   * If we get a webhook event for a customer that isn't in our database,
   * we can use this to find or create the corresponding user
   */
  async reconcileStripeCustomer(stripeCustomerId: string): Promise<{
    success: boolean;
    message: string;
    userId?: number;
  }> {
    try {
      // Try to find a user with this Stripe Customer ID
      const existingUser = await storage.getUserByStripeCustomerId(stripeCustomerId);
      
      if (existingUser) {
        return {
          success: true,
          message: `Found matching user ${existingUser.id} (${existingUser.username}) for Stripe Customer ${stripeCustomerId}`,
          userId: existingUser.id,
        };
      }
      
      // If no user found, get the customer from Stripe
      const customer = await stripe.customers.retrieve(stripeCustomerId);
      
      if ('deleted' in customer && customer.deleted) {
        return {
          success: false,
          message: `Stripe Customer ${stripeCustomerId} is deleted`,
        };
      }
      
      // Check if customer has userId in metadata
      if (customer.metadata?.userId) {
        const userId = Number(customer.metadata.userId);
        const user = await storage.getUser(userId);
        
        if (user) {
          // Update the user with this Stripe Customer ID
          await storage.updateStripeCustomerId(userId, stripeCustomerId);
          
          return {
            success: true,
            message: `Updated User ${userId} (${user.username}) with Stripe Customer ID ${stripeCustomerId}`,
            userId,
          };
        }
      }
      
      // Try to find user by email
      if (customer.email) {
        const userByEmail = await storage.getUserByEmail(customer.email);
        
        if (userByEmail) {
          // Update the user with this Stripe Customer ID
          await storage.updateStripeCustomerId(userByEmail.id, stripeCustomerId);
          
          return {
            success: true,
            message: `Matched User ${userByEmail.id} (${userByEmail.username}) with Stripe Customer ${stripeCustomerId} by email`,
            userId: userByEmail.id,
          };
        }
      }
      
      // If we couldn't find a matching user, log a warning
      return {
        success: false,
        message: `Could not find a matching user for Stripe Customer ${stripeCustomerId}`,
      };
    } catch (error) {
      console.error('Error reconciling Stripe customer:', error);
      return {
        success: false,
        message: `Error reconciling Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  
  /**
   * Sync all Stripe subscriptions for a user
   * This ensures that our database correctly reflects the user's subscription status in Stripe
   */
  async syncUserSubscriptions(userId: number): Promise<{
    success: boolean;
    message: string;
    tierUpdated?: boolean;
  }> {
    try {
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeCustomerId) {
        return {
          success: false,
          message: `User ${userId} not found or has no Stripe Customer ID`,
        };
      }
      
      // Get all subscriptions for this customer
      const subscriptions = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: 'active',
        expand: ['data.items.data.price'],
      });
      
      if (subscriptions.data.length === 0) {
        // If no active subscriptions, ensure user is on free tier if they have a subscription ID
        if (user.stripeSubscriptionId) {
          await storage.updateSubscription(userId, {
            tier: SubscriptionTier.Free,
            subscriptionStatus: 'canceled',
            currentPeriodEnd: null,
          });
          
          return {
            success: true,
            message: `No active subscriptions found for User ${userId}. Reset to free tier.`,
            tierUpdated: true,
          };
        }
        
        return {
          success: true,
          message: `No active subscriptions found for User ${userId}. User already on free tier.`,
          tierUpdated: false,
        };
      }
      
      // Check if there are multiple active subscriptions
      if (subscriptions.data.length > 1) {
        console.log(`User ${userId} has ${subscriptions.data.length} active subscriptions. Will use the most recent and cancel others.`);
        
        // Sort subscriptions by creation date (newest first)
        subscriptions.data.sort((a, b) => b.created - a.created);
        
        // Cancel all but the most recent subscription
        const keepSubscription = subscriptions.data[0];
        for (let i = 1; i < subscriptions.data.length; i++) {
          const subscription = subscriptions.data[i];
          try {
            await stripe.subscriptions.update(subscription.id, {
              cancel_at_period_end: true,
            });
            console.log(`SyncUserSubscriptions: Canceled subscription ${subscription.id} for user ${userId}`);
          } catch (error) {
            console.error(`Error canceling subscription ${subscription.id}:`, error);
          }
        }
      }
      
      // Get the most recent active subscription
      const latestSubscription = subscriptions.data[0];
      
      // Get the price ID to determine the tier
      const priceId = latestSubscription.items.data[0]?.price.id;
      let tier = SubscriptionTier.Free;
      let tierUpdated = false;
      
      // Find the tier based on price ID
      // This leverages the existing code pattern in stripeService
      if (priceId) {
        // Import dynamically to avoid circular dependency
        const { STRIPE_PRICE_IDS } = await import('@shared/stripe-config');
        
        for (const [key, value] of Object.entries(STRIPE_PRICE_IDS)) {
          if (value === priceId && key !== 'refillPack') {
            tier = key as SubscriptionTier;
            break;
          }
        }
      }
      
      // Only update if the tier or subscription ID has changed
      if (user.subscriptionTier !== tier || user.stripeSubscriptionId !== latestSubscription.id) {
        const periodEnd = (latestSubscription as any).current_period_end;
        await storage.updateSubscription(userId, {
          stripeSubscriptionId: latestSubscription.id,
          tier,
          subscriptionStatus: latestSubscription.status,
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        });
        
        tierUpdated = true;
      }
      
      return {
        success: true,
        message: tierUpdated 
          ? `Updated User ${userId} subscription to tier ${tier} with Stripe Subscription ${latestSubscription.id}`
          : `User ${userId} subscription already in sync with Stripe`,
        tierUpdated,
      };
    } catch (error) {
      console.error('Error syncing user subscriptions:', error);
      return {
        success: false,
        message: `Error syncing user subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  
  /**
   * Audit function to find all Stripe customers that don't have a matching user in our database
   * This can be used to identify potential data inconsistencies
   */
  async findOrphanedStripeCustomers(): Promise<{
    success: boolean;
    orphanedCustomers: Array<{
      id: string;
      email: string | null;
      metadata: Stripe.Metadata;
    }>;
  }> {
    try {
      const orphanedCustomers: Array<{
        id: string;
        email: string | null;
        metadata: Stripe.Metadata;
      }> = [];
      
      // Paginate through all Stripe customers
      let hasMore = true;
      let startingAfter: string | undefined = undefined;
      
      while (hasMore) {
        const options: Stripe.CustomerListParams = {
          limit: 100,
        };
        
        if (startingAfter) {
          options.starting_after = startingAfter;
        }
        
        const customers = await stripe.customers.list(options);
        
        for (const customer of customers.data) {
          // Skip deleted customers
          if ('deleted' in customer && customer.deleted) {
            continue;
          }
          
          // Try to find by Customer ID
          const existingUser = await storage.getUserByStripeCustomerId(customer.id);
          
          if (existingUser) {
            continue;
          }
          
          // Try to find by email
          if (customer.email) {
            const userByEmail = await storage.getUserByEmail(customer.email);
            
            if (userByEmail) {
              // Found by email, update the user with this Stripe Customer ID
              await storage.updateStripeCustomerId(userByEmail.id, customer.id);
              continue;
            }
          }
          
          // Try to find by userId in metadata
          if (customer.metadata?.userId) {
            const userId = Number(customer.metadata.userId);
            const user = await storage.getUser(userId);
            
            if (user) {
              // Found by userId in metadata, update the user with this Stripe Customer ID
              await storage.updateStripeCustomerId(user.id, customer.id);
              continue;
            }
          }
          
          // If we couldn't find a matching user, add to the orphaned list
          orphanedCustomers.push({
            id: customer.id,
            email: customer.email,
            metadata: customer.metadata,
          });
        }
        
        // Check if there are more pages
        hasMore = customers.has_more;
        
        // Update the starting_after cursor
        if (customers.data.length > 0) {
          startingAfter = customers.data[customers.data.length - 1].id;
        } else {
          hasMore = false;
        }
      }
      
      return {
        success: true,
        orphanedCustomers,
      };
    } catch (error) {
      console.error('Error finding orphaned Stripe customers:', error);
      return {
        success: false,
        orphanedCustomers: [],
      };
    }
  }
};