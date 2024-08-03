import { loadStripe } from "@stripe/stripe-js";
import { API_ROUTES } from "./constants";
import { apiRequest } from "./queryClient";
import { SubscriptionTier } from "@shared/schema";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

export const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

export async function createSubscription(tier: SubscriptionTier): Promise<{ clientSecret: string }> {
  try {
    const response = await apiRequest("POST", API_ROUTES.subscription.create, { tier });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create subscription");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
}

export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest("POST", API_ROUTES.subscription.cancel, {});
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to cancel subscription");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    throw error;
  }
}

export async function createBillingPortalSession(): Promise<{ url: string }> {
  try {
    const response = await apiRequest("POST", API_ROUTES.subscription.portal, {});
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create portal session");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating portal session:", error);
    throw error;
  }
}
