import { useState, useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { createRefillPackCheckout } from "@/lib/stripe";
import { REFILL_PACK_CREDITS, REFILL_PACK_PRICE } from "@shared/schema";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Check if Stripe is properly initialized
const isStripeAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

export default function RefillPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // SEO enhancement for refill page
  useEffect(() => {
    // Update page title and meta description
    document.title = "Buy Credits - AI LaTeX Generator";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        `Purchase additional credits for AI LaTeX Generator. Get ${REFILL_PACK_CREDITS} additional document generations for only $${REFILL_PACK_PRICE.toFixed(2)}.`);
    }
    
    // Add JSON-LD structured data for the refill page
    const head = document.querySelector('head');
    if (head) {
      const existingSchema = document.querySelector('script#refill-schema');
      if (existingSchema) {
        existingSchema.remove();
      }
      
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.id = 'refill-schema';
      
      // Product schema for refill pack
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "AI LaTeX Generator Credit Pack",
        "description": `Get ${REFILL_PACK_CREDITS} additional document generations at any time. Credits never expire.`,
        "offers": {
          "@type": "Offer",
          "price": REFILL_PACK_PRICE.toFixed(2),
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
          "url": "https://aitexgen.com/refill"
        },
        "category": "Digital Credits",
        "brand": {
          "@type": "Brand",
          "name": "AI LaTeX Generator"
        }
      };
      
      schemaScript.textContent = JSON.stringify(schemaData);
      head.appendChild(schemaScript);
    }
  }, []);
  
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
    
    // Create the checkout session for refill pack
    const initiateRefillCheckout = async () => {
      try {
        const { url } = await createRefillPackCheckout();
        
        if (url) {
          // Redirect to Stripe Checkout
          window.location.href = url;
        } else {
          setError("Failed to create checkout session");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error creating refill checkout:", err);
        setError(err instanceof Error ? err.message : "Failed to create refill checkout");
        setIsLoading(false);
      }
    };
    
    initiateRefillCheckout();
  }, [session.isAuthenticated, navigate, isStripeAvailable]);
  
  if (!session.isAuthenticated) {
    return null;
  }
  
  if (isLoading) {
    return (
      <SiteLayout seoTitle="Purchase LaTeX Generation Credits - AI LaTeX Generator">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
          <p className="ml-2">Preparing checkout...</p>
        </div>
      </SiteLayout>
    );
  }
  
  if (error) {
    return (
      <SiteLayout seoTitle="Payment Error - AI LaTeX Generator">
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
  
  // We should not reach here since we're redirecting to Stripe's checkout
  // But just in case there's some issue with the redirect
  return (
    <SiteLayout seoTitle="Purchase LaTeX Generation Credits - AI LaTeX Generator">
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
            
            <p className="text-gray-700 mb-4">
              Redirecting to secure checkout page...
            </p>
            <Button 
              onClick={() => navigate("/account")}
              className="w-full"
            >
              Cancel and Return to Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}