import Stripe from 'stripe';
import { STRIPE_PRICE_IDS } from '@shared/stripe-config';
import { SubscriptionTier } from '@shared/schema';
import { storage } from '../storage';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
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

    // If user already has Stripe info, handle appropriately
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

    // If user has an existing subscription, check if we should update or cancel
    if (user.stripeSubscriptionId) {
      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Cancel at period end and create new subscription
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
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
          
          await storage.updateSubscription(userId, {
            stripeSubscriptionId: data.id,
            tier,
            subscriptionStatus: data.status,
            currentPeriodEnd: new Date(data.current_period_end * 1000),
          });
        }
        break;
      
      case 'customer.subscription.deleted':
        // Reset to free tier when subscription is canceled or expires
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