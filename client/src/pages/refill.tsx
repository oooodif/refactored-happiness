import { useState, useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { useStripe, Elements, PaymentElement, useElements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { REFILL_PACK_CREDITS, REFILL_PACK_PRICE } from "@shared/schema";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Check if Stripe is properly initialized
const isStripeAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

// Payment form component
const RefillForm = () => {
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
        return_url: window.location.origin + "/account?refill=success",
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
        className="w-full bg-emerald-600 hover:bg-emerald-700" 
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? "Processing..." : "Purchase Refill Pack"}
      </Button>
    </form>
  );
};

export default function RefillPage() {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Redirect to login if not authenticated
    if (!session.isAuthenticated) {
      navigate("/auth");
      return;
    }
    
    // Only allow paid subscribers to purchase refill packs
    if (session.tier === 'free') {
      setError("Refill packs are only available for paid subscribers. Please upgrade to a paid plan first.");
      setIsLoading(false);
      return;
    }
    
    // Check if Stripe is available
    if (!isStripeAvailable) {
      setError("Payment system is not configured. Please contact the administrator.");
      setIsLoading(false);
      return;
    }
    
    // Create the payment intent for refill pack
    const createRefillPayment = async () => {
      try {
        const response = await apiRequest("POST", "/api/subscription/refill/create", {});
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create payment");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Error creating refill payment:", err);
        setError(err instanceof Error ? err.message : "Failed to create refill payment");
      } finally {
        setIsLoading(false);
      }
    };
    
    createRefillPayment();
  }, [session.isAuthenticated, navigate, isStripeAvailable]);
  
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
              <CardTitle className="text-red-600">Payment Error</CardTitle>
              <CardDescription>There was a problem setting up your payment</CardDescription>
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
              <CardDescription>Something went wrong with the payment setup</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Unable to create payment information. Please try again later.
              </p>
              <Button onClick={() => navigate("/account")}>Return to Account</Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );
  }
  
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Purchase Refill Pack</CardTitle>
            <CardDescription>
              Get {REFILL_PACK_CREDITS} additional generations for ${REFILL_PACK_PRICE.toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">LaTeX Generation Refill Pack</span>
                <span className="font-medium">${REFILL_PACK_PRICE.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {REFILL_PACK_CREDITS} credits that never expire
              </div>
            </div>
            
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <RefillForm />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}