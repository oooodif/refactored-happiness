import Stripe from 'stripe';
import { SubscriptionTier } from '@shared/schema';

// Initialize Stripe client
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil' as any, // Using latest API version
    })
  : null;

// Get price IDs from environment variables or use defaults
const PRICE_IDS = {
  [SubscriptionTier.Free]: process.env.STRIPE_PRICE_FREE_ID || 'price_free', // Usually not needed as free tier doesn't require payment
  [SubscriptionTier.Tier1]: process.env.STRIPE_PRICE_TIER1_ID || 'price_tier1',
  [SubscriptionTier.Tier2]: process.env.STRIPE_PRICE_TIER2_ID || 'price_tier2',
  [SubscriptionTier.Tier3]: process.env.STRIPE_PRICE_TIER3_ID || 'price_tier3',
  [SubscriptionTier.Tier4]: process.env.STRIPE_PRICE_TIER4_ID || 'price_tier4',
  [SubscriptionTier.Tier5]: process.env.STRIPE_PRICE_TIER5_ID || 'price_tier5'
};

// Refill pack price ID
const REFILL_PACK_PRICE_ID = process.env.STRIPE_PRICE_REFILL_PACK_ID || 'price_refill_pack';

/**
 * Create a new Stripe customer
 */
export async function createCustomer(email: string, name: string): Promise<Stripe.Customer> {
  if (!stripe) throw new Error('Stripe is not configured');

  return stripe.customers.create({
    email,
    name,
    metadata: {
      source: 'AI LaTeX Generator'
    }
  });
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  customerId: string,
  tier: SubscriptionTier
): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  // Get price ID for the tier
  const priceId = PRICE_IDS[tier];
  
  if (!priceId) {
    throw new Error(`No price ID found for tier: ${tier}`);
  }
  
  return stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { 
      save_default_payment_method: 'on_subscription',
      payment_method_types: ['link', 'card'],
    },
    expand: ['latest_invoice.payment_intent'],
  });
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  });
}

/**
 * Create a billing portal session
 */
export async function createPortalSession(customerId: string): Promise<Stripe.BillingPortal.Session> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: process.env.DOMAIN ? `${process.env.DOMAIN}/account` : 'http://localhost:5000/account',
  });
}

/**
 * Retrieve a subscription
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  return stripe.subscriptions.retrieve(subscriptionId);
}

/**
 * Update subscription items
 */
export async function updateSubscription(
  subscriptionId: string,
  tier: SubscriptionTier
): Promise<Stripe.Subscription> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  // Get subscription to retrieve current items
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Get price ID for the tier
  const priceId = PRICE_IDS[tier];
  
  if (!priceId) {
    throw new Error(`No price ID found for tier: ${tier}`);
  }
  
  // Get current subscription item ID
  const itemId = subscription.items.data[0].id;
  
  // Update the subscription with the new price
  return stripe.subscriptions.update(subscriptionId, {
    items: [{ id: itemId, price: priceId }],
  });
}

/**
 * Create a Checkout session for an existing customer
 */
export async function createCheckoutSession(
  customerId: string,
  tier: SubscriptionTier
): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  // Get price ID for the tier
  const priceId = PRICE_IDS[tier];
  
  if (!priceId) {
    throw new Error(`No price ID found for tier: ${tier}`);
  }
  
  // Create a checkout session with Link enabled
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: process.env.DOMAIN ? `${process.env.DOMAIN}/account?success=true` : 'http://localhost:5000/account?success=true',
    cancel_url: process.env.DOMAIN ? `${process.env.DOMAIN}/account?canceled=true` : 'http://localhost:5000/account?canceled=true',
    // Enable Stripe Link for faster checkout
    // Always show the Link UI option
    payment_method_configuration: process.env.STRIPE_LINK_CONFIG_ID,
    // Store payment details for future use
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  });
}

/**
 * Create a Checkout session for purchasing refill packs
 */
export async function createRefillPackCheckoutSession(
  customerId: string,
  quantity: number = 1
): Promise<Stripe.Checkout.Session> {
  if (!stripe) throw new Error('Stripe is not configured');
  
  // Create a checkout session for one-time purchase
  return stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: REFILL_PACK_PRICE_ID,
        quantity: quantity,
      },
    ],
    mode: 'payment',
    success_url: process.env.DOMAIN ? `${process.env.DOMAIN}/account?refill=success` : 'http://localhost:5000/account?refill=success',
    cancel_url: process.env.DOMAIN ? `${process.env.DOMAIN}/account?refill=canceled` : 'http://localhost:5000/account?refill=canceled',
    // Enable Stripe Link for faster checkout
    // Store payment details for future use
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
    // Add metadata to identify this is a refill pack purchase
    metadata: {
      type: 'refill_pack',
      quantity: quantity.toString(),
    },
  });
}
