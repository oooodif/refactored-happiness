import Stripe from 'stripe';
import { SubscriptionTier } from '@shared/schema';

// Initialize Stripe client
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    })
  : null;

// Get price IDs from environment variables or use defaults
const PRICE_IDS = {
  [SubscriptionTier.Basic]: process.env.STRIPE_PRICE_BASIC_ID || 'price_basic',
  [SubscriptionTier.Pro]: process.env.STRIPE_PRICE_PRO_ID || 'price_pro',
  [SubscriptionTier.Power]: process.env.STRIPE_PRICE_POWER_ID || 'price_power'
};

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
    payment_settings: { save_default_payment_method: 'on_subscription' },
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
  
  // Create a checkout session
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
  });
}
