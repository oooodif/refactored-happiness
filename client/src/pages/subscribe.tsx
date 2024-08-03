import { useState, useEffect, useContext } from "react";
import { useLocation, useSearch } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { createSubscription } from "@/lib/stripe";
import { SubscriptionTier } from "@shared/schema";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Make sure the stripe promise is created correctly
if (!stripePromise) {
  throw new Error('Stripe is not initialized. Make sure VITE_STRIPE_PUBLIC_KEY is set.');
}

// Payment form component
const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe is not loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    // Confirm the payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/account",
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } 
    // Success case is handled by the return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? "Processing..." : "Subscribe Now"}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tier = params.get("tier") as SubscriptionTier || SubscriptionTier.Basic;
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!session.isAuthenticated) {
      navigate("/login");
      return;
    }
    
    // Create the subscription
    const setupSubscription = async () => {
      try {
        const { clientSecret: secret } = await createSubscription(tier);
        setClientSecret(secret);
      } catch (err) {
        console.error("Error creating subscription:", err);
        setError(err instanceof Error ? err.message : "Failed to create subscription");
      } finally {
        setIsLoading(false);
      }
    };
    
    setupSubscription();
  }, [session.isAuthenticated, navigate, tier]);
  
  if (!session.isAuthenticated) {
    return null;
  }
  
  if (isLoading) {
    return (
      <SiteLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </SiteLayout>
    );
  }
  
  if (error) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Subscription Error</CardTitle>
              <CardDescription>There was a problem setting up your subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{error}</p>
              <Button onClick={() => navigate("/")}>Return to Home</Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }
  
  if (!clientSecret) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>No Payment Required</CardTitle>
              <CardDescription>Your subscription is already active</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                You already have an active subscription. No payment is required at this time.
              </p>
              <Button onClick={() => navigate("/account")}>Manage Subscription</Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }
  
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Subscribe to {tierName} Plan</CardTitle>
            <CardDescription>Complete your subscription payment</CardDescription>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}
