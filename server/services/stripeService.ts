import Stripe from 'stripe';
import { STRIPE_PRICE_IDS } from '@shared/stripe-config';
import { SubscriptionTier } from '@shared/schema';
import { storage } from '../storage';

/**
 * Service for interacting with Stripe
 * 
 * This service ensures that users can only have one active subscription at a time.
 * When a user subscribes to a new plan:
 * 1. We check for any existing subscriptions and cancel them
 * 2. Create a new subscription using Stripe Checkout
 * 3. Handle webhooks to ensure the database is updated with the correct subscription
 */

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil' as any, // Using latest API version
});

export const stripeService = {
  /**
   * Creates a checkout session for subscription
   */
  async createSubscriptionSession(userId: number, tier: SubscriptionTier, successUrl: string, cancelUrl: string) {
    const user = await storage.getUser(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // If user already has Stripe info and a subscription, handle appropriately
    if (user.stripeCustomerId && user.stripeSubscriptionId) {
      // User already has a subscription, let's update it
      return this.updateSubscription(userId, tier, successUrl, cancelUrl);
    }

    // Create a new Stripe customer if none exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || user.username,
        name: user.username,
        metadata: {
          userId: user.id.toString(),
        },
      });
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await storage.updateStripeCustomerId(userId, customerId);
    } else {
      // Check if user has any active subscriptions not tracked in our database
      const existingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 100
      });

      // If there are active subscriptions, cancel them before creating a new one
      for (const subscription of existingSubscriptions.data) {
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: true
        });
        console.log(`Canceled existing subscription ${subscription.id} for customer ${customerId}`);
      }
    }

    // Create checkout session for subscription
    const priceId = STRIPE_PRICE_IDS[tier];
    if (!priceId) {
      throw new Error(`No price ID found for tier: ${tier}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        tier,
      },
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          tier,
        }
      },
      // Prevent multiple subscriptions
      customer_update: {
        address: 'auto',
        name: 'auto',
        shipping: 'auto'
      },
      allow_promotion_codes: true,
    });

    return session;
  },

  /**
   * Updates an existing subscription
   */
  async updateSubscription(userId: number, tier: SubscriptionTier, successUrl: string, cancelUrl: string) {
    const user = await storage.getUser(userId);

    if (!user || !user.stripeCustomerId) {
      throw new Error('User not found or no Stripe customer ID');
    }

    // Get all active subscriptions for this customer
    const existingSubscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 100
    });

    // Cancel all existing subscriptions
    for (const subscription of existingSubscriptions.data) {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });
      console.log(`Canceled existing subscription ${subscription.id} for customer ${user.stripeCustomerId}`);
    }

    // Create a new checkout session
    const priceId = STRIPE_PRICE_IDS[tier];
    if (!priceId) {
      throw new Error(`No price ID found for tier: ${tier}`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        tier,
      },
      subscription_data: {
        metadata: {
          userId: userId.toString(),
          tier,
        }
      },
      // Prevent multiple subscriptions
      customer_update: {
        address: 'auto',
        name: 'auto',
        shipping: 'auto'
      },
      allow_promotion_codes: true,
      // Only allow users to have one subscription at a time
      // This will cancel and replace any existing subscription
    });

    return session;
  },

  /**
   * Creates a checkout session for refill pack
   */
  async createRefillSession(userId: number, successUrl: string, cancelUrl: string) {
    const user = await storage.getUser(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Create a new Stripe customer if none exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || user.username,
        name: user.username,
        metadata: {
          userId: user.id.toString(),
        },
      });
      customerId = customer.id;
      
      // Update user with Stripe customer ID
      await storage.updateStripeCustomerId(userId, customerId);
    }

    // Create checkout session for one-time purchase
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_IDS.refillPack,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId.toString(),
        type: 'refill',
      },
    });

    return session;
  },

  /**
   * Handles subscription webhook events from Stripe
   */
  async handleSubscriptionEvent(event: Stripe.Event) {
    const data = event.data.object as Stripe.Subscription;
    const userId = Number(data.metadata?.userId);
    
    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    // Get the user from our database
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`User ${userId} not found in database for subscription event`);
      return;
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Update user subscription details
        if (data.status === 'active' || data.status === 'trialing') {
          // Get the price ID to determine the tier
          const priceId = data.items.data[0]?.price.id;
          let tier = SubscriptionTier.Free;
          
          // Find the tier based on price ID
          for (const [key, value] of Object.entries(STRIPE_PRICE_IDS)) {
            if (value === priceId && key !== 'refillPack') {
              tier = key as SubscriptionTier;
              break;
            }
          }
          
          // Cancel any other active subscriptions this user might have
          if (user.stripeCustomerId) {
            const existingSubscriptions = await stripe.subscriptions.list({
              customer: user.stripeCustomerId,
              status: 'active',
              limit: 100
            });

            // Cancel all other active subscriptions (except this one)
            for (const subscription of existingSubscriptions.data) {
              // Skip the current subscription we're processing
              if (subscription.id === data.id) {
                continue;
              }
              
              try {
                await stripe.subscriptions.update(subscription.id, {
                  cancel_at_period_end: true,
                });
                console.log(`Webhook canceled duplicate subscription ${subscription.id} for user ${userId}`);
              } catch (error) {
                console.error(`Error canceling duplicate subscription ${subscription.id}:`, error);
              }
            }
          }
          
          const periodEnd = (data as any).current_period_end;
          await storage.updateSubscription(userId, {
            stripeSubscriptionId: data.id,
            tier,
            subscriptionStatus: data.status,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          });
        }
        break;
      
      case 'customer.subscription.deleted':
        // Check if there are any other active subscriptions for this user before downgrading
        if (user.stripeCustomerId) {
          const activeSubscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1
          });
          
          if (activeSubscriptions.data.length > 0) {
            // User has other active subscriptions, let's use that instead
            // This will be handled by the created/updated webhooks
            console.log(`User ${userId} has other active subscriptions, not downgrading to free tier`);
            return;
          }
        }

        // No other active subscriptions, reset to free tier
        await storage.updateSubscription(userId, {
          tier: SubscriptionTier.Free,
          subscriptionStatus: 'canceled',
          currentPeriodEnd: null,
        });
        break;
    }
  },

  /**
   * Handles checkout session completion (for refill packs)
   */
  async handleCheckoutCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Handle one-time purchases (refill packs)
    if (session.mode === 'payment' && session.metadata?.type === 'refill') {
      const userId = Number(session.metadata.userId);
      
      if (!userId) {
        console.error('No userId in checkout session metadata');
        return;
      }
      
      // Get the current user and add credits
      const user = await storage.getUser(userId);
      if (user) {
        await storage.addCredits(userId, 100); // 100 credits for refill pack
      }
    }
  }
};