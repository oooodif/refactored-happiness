import { useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { useToast } from "@/hooks/use-toast";
import { API_ROUTES } from "@/lib/constants";
import { createBillingPortalSession, cancelSubscription } from "@/lib/stripe";
import { formatDate, getUsageColor } from "@/lib/utils";
import { tierLimits, tierPrices, SubscriptionTier } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Account() {
  const { session } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log("Account page session:", session);
    if (!session.isLoading && !session.isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
    }
  }, [session.isLoading, session.isAuthenticated, navigate]);

  // Show loading state while checking authentication
  if (session.isLoading) {
    return (
      <SiteLayout fullHeight={false}>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
            <p className="mt-2 text-gray-600">Loading your account information...</p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // Return null if not authenticated
  if (!session.isAuthenticated || !session.user) {
    return null;
  }

  const usagePercentage = Math.min(
    100,
    Math.round((session.usage.current / session.usage.limit) * 100)
  );

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { url } = await createBillingPortalSession();
      window.location.href = url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll be downgraded to the free plan at the end of your billing period.")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await cancelSubscription();
      toast({
        title: "Subscription canceled",
        description: result.message,
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SiteLayout fullHeight={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

          <div className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Your account details and profile settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Username
                      </label>
                      <div className="mt-1 text-gray-900">
                        {session.user.username}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="mt-1 text-gray-900">
                        {session.user.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Account Created
                      </label>
                      <div className="mt-1 text-gray-900">
                        {formatDate(session.user.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline">Edit Profile</Button>
              </CardFooter>
            </Card>

            {/* Subscription Information */}
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  Your current plan and usage information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          {session.tier.charAt(0).toUpperCase() + session.tier.slice(1)} Plan
                        </h3>
                        {session.tier !== SubscriptionTier.Free && session.user.stripeSubscriptionId && (
                          <p className="text-sm text-gray-500">
                            Subscription ID: {session.user.stripeSubscriptionId.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">${tierPrices[session.tier]}</span>
                        <span className="text-gray-500">/month</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Monthly Usage</span>
                      <span className={`text-sm ${getUsageColor(session.usage.current, session.usage.limit)}`}>
                        {session.usage.current} / {session.usage.limit} generations
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      Resets on {formatDate(session.usage.resetDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleCancelSubscription}
                  disabled={isLoading || session.tier === SubscriptionTier.Free}
                >
                  Cancel Subscription
                </Button>
                <div className="space-x-2">
                  {session.tier === SubscriptionTier.Free ? (
                    <Button
                      onClick={() => navigate("/subscribe")}
                      disabled={isLoading}
                    >
                      Upgrade Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={handleManageSubscription}
                      disabled={isLoading}
                    >
                      Manage Subscription
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
