import { loadStripe } from "@stripe/stripe-js";
import { API_ROUTES } from "./constants";
import { apiRequest } from "./queryClient";
import { SubscriptionTier } from "@shared/schema";

// Check for Stripe key but don't throw an error
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  console.warn('No Stripe key found (VITE_STRIPE_PUBLIC_KEY). Payment features will be limited.');
}

// Create a dummy promise for development if no key is available
export const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : Promise.resolve(null);

export async function createSubscription(tier: SubscriptionTier): Promise<{ sessionId: string; url: string }> {
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

export async function createRefillPackCheckout(): Promise<{ sessionId: string; url: string }> {
  try {
    const response = await apiRequest("POST", API_ROUTES.subscription.refill.create, {});
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create refill pack checkout");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating refill pack checkout:", error);
    throw error;
  }
}
