import { SubscriptionTier } from './schema';

// Use environment variables for Stripe Price IDs
export const STRIPE_PRICE_IDS = {
  [SubscriptionTier.Free]: '',                           // Free tier (no price ID needed)
  [SubscriptionTier.Basic]: process.env.STRIPE_PRICE_TIER1_ID || '', // $0.99/month (Basic Plan)
  [SubscriptionTier.Tier2]: process.env.STRIPE_PRICE_TIER2_ID || '', // $2.99/month (Standard Plan)
  [SubscriptionTier.Pro]: process.env.STRIPE_PRICE_TIER3_ID || '',   // $6.99/month (Advanced Plan)
  [SubscriptionTier.Tier4]: process.env.STRIPE_PRICE_TIER4_ID || '', // $11.99/month (Pro Plan)
  [SubscriptionTier.Power]: process.env.STRIPE_PRICE_TIER5_ID || '', // $19.99/month (Power Plan)
  refillPack: process.env.STRIPE_PRICE_REFILL_PACK_ID || '',         // $0.99 one-time (Refill Pack)
};

// Helpful information about each tier for display
export const tierInfo = {
  [SubscriptionTier.Free]: {
    name: 'Free',
    price: 0,
    generations: 3,
    features: ['3 LaTeX generations per month', 'Access to basic templates', 'Email support']
  },
  [SubscriptionTier.Basic]: {
    name: 'Basic',
    price: 0.99,
    generations: 100,
    features: ['100 LaTeX generations per month', 'Access to all templates', 'Email support', 'PDF export']
  },
  [SubscriptionTier.Tier2]: {
    name: 'Standard',
    price: 2.99,
    generations: 500,
    features: ['500 LaTeX generations per month', 'Access to all templates', 'Priority support', 'PDF export']
  },
  [SubscriptionTier.Pro]: {
    name: 'Pro',
    price: 6.99,
    generations: 1200,
    features: ['1,200 LaTeX generations per month', 'Access to all templates', 'Priority support', 'Advanced customization', 'PDF export']
  },
  [SubscriptionTier.Tier4]: {
    name: 'Advanced',
    price: 11.99,
    generations: 2500,
    features: ['2,500 LaTeX generations per month', 'Access to all templates', 'Priority support', 'Advanced customization', 'PDF export']
  },
  [SubscriptionTier.Power]: {
    name: 'Power',
    price: 19.99,
    generations: 5000,
    features: ['5,000 LaTeX generations per month', 'Access to all templates', 'Priority support', 'Advanced customization', 'PDF export', 'Access to premium models']
  }
};

// Refill pack information
export const REFILL_PACK_PRICE = 0.99;
export const REFILL_PACK_CREDITS = 100;