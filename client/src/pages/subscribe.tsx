import { useContext, useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  useStripe,
  Elements,
  PaymentElement,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise, createSubscription } from "@/lib/stripe";
import { SubscriptionTier } from "@shared/schema";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ------------------------------------------------------------------ */
/*  Subscribe‑form (Stripe PaymentElement)                            */
/* ------------------------------------------------------------------ */
const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe isn’t loaded yet. Try again.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/account` },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message ?? "An error occurred.",
        variant: "destructive",
      });
      setProcessing(false);
    }
    // success redirects via return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || processing}
      >
        {processing ? "Processing…" : "Subscribe Now"}
      </Button>
    </form>
  );
};

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */
export default function Subscribe() {
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  const search = useSearch();
  const tier =
    (new URLSearchParams(search).get("tier") as SubscriptionTier) ??
    SubscriptionTier.Basic;

  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isStripeAvailable = !!import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  /* ------------------------  Setup subscription  ----------------------- */
  useEffect(() => {
    if (!session.isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!isStripeAvailable) {
      setError("Payment system is not configured. Contact support.");
      setLoading(false);
      return;
    }

    const setup = async () => {
      try {
        const { clientSecret } = await createSubscription(tier);
        setClientSecret(clientSecret);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Subscription setup failed",
        );
      } finally {
        setLoading(false);
      }
    };

    setup();
  }, [session.isAuthenticated, tier]);

  /* ---------------------------  UI states  ----------------------------- */
  if (!session.isAuthenticated) return null;

  if (loading)
    return (
      <SiteLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </SiteLayout>
    );

  if (error)
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Subscription Error</CardTitle>
              <CardDescription>
                Problem setting up your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-700">{error}</p>
              <Button onClick={() => navigate("/")}>Return Home</Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );

  if (!clientSecret)
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle>No Payment Required</CardTitle>
              <CardDescription>
                Your subscription is already active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-gray-700">
                You already have an active subscription.
              </p>
              <Button onClick={() => navigate("/account")}>
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    );

  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);

  /* -----------------------------  Render  ----------------------------- */
  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Subscribe to {tierName} Plan</CardTitle>
            <CardDescription>
              Complete your subscription payment
            </CardDescription>
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
