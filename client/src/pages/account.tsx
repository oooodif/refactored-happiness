import { useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { useToast } from "@/hooks/use-toast";
import { API_ROUTES } from "@/lib/constants";
import { createBillingPortalSession, cancelSubscription } from "@/lib/stripe";
import { formatDate, getUsageColor } from "@/lib/utils";
import { tierLimits, tierPrices, SubscriptionTier } from "@shared/schema";
import { checkAuthStatus } from "@/lib/queryClient";
import SubscriptionModal from "@/components/dialogs/subscription-modal";

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
  const { session, setSession } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  
  // SEO enhancement for the account page
  useEffect(() => {
    // Update page title and meta description
    document.title = "My Account - AI LaTeX Generator";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        "Manage your AI LaTeX Generator account, subscription plan, and usage statistics. Access your saved documents and templates.");
    }
    
    // Add JSON-LD structured data for the account dashboard
    const head = document.querySelector('head');
    if (head) {
      const existingSchema = document.querySelector('script#account-schema');
      if (existingSchema) {
        existingSchema.remove();
      }
      
      const schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.id = 'account-schema';
      
      // WebPage schema for account dashboard
      const schemaData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "My Account - AI LaTeX Generator",
        "description": "Manage your AI LaTeX Generator account, subscription plan, and usage statistics.",
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://aitexgen.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "My Account",
              "item": "https://aitexgen.com/account"
            }
          ]
        }
      };
      
      schemaScript.textContent = JSON.stringify(schemaData);
      head.appendChild(schemaScript);
    }
  }, []);

  // Force a session check when the component mounts
  useEffect(() => {
    const verifySession = async (retryCount = 0, maxRetries = 2) => {
      try {
        console.log(`Account page: Verifying session... (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        // If we already have a valid session, skip the check
        if (session.isAuthenticated && session.user && !session.isLoading) {
          console.log("Account page: Already has valid session:", session.user.username);
          setPageIsLoading(false);
          return;
        }
        
        const authData = await checkAuthStatus();
        
        if (authData.isAuthenticated && authData.user) {
          console.log("Account page: Session verified, user:", authData.user.username);
          
          // Update the session with fresh data
          setSession({
            user: authData.user,
            isAuthenticated: true,
            isLoading: false,
            tier: authData.user.subscriptionTier || SubscriptionTier.Free,
            usage: {
              current: authData.user.monthlyUsage || 0,
              limit: authData.usageLimit || 3,
              resetDate: authData.user.usageResetDate || new Date().toISOString()
            },
            refillPackCredits: authData.user.refillPackCredits || 0,
            lastAuthCheck: Date.now()
          });
          setPageIsLoading(false);
        } else if (retryCount < maxRetries) {
          // Not authenticated but we have retries left
          console.log(`Account page: Auth check failed, retrying (${retryCount + 1}/${maxRetries})...`);
          
          // Wait 1 second before retrying
          setTimeout(() => {
            verifySession(retryCount + 1, maxRetries);
          }, 1000);
          return;
        } else {
          console.log("Account page: Not authenticated after retries");
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive"
          });
          setPageIsLoading(false);
          navigate("/");
        }
      } catch (error) {
        console.error("Account page: Error verifying session:", error);
        
        // Retry on error
        if (retryCount < maxRetries) {
          console.log(`Account page: Error, retrying (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => {
            verifySession(retryCount + 1, maxRetries);
          }, 1000);
          return;
        }
        
        toast({
          title: "Error Loading Account",
          description: "There was a problem loading your account information. Please try again.",
          variant: "destructive"
        });
        setPageIsLoading(false);
        navigate("/");
      }
    };
    
    // Remove automatic timeout - let users stay on the loading page as long as needed
    // Just run the session verification without a timeout
    verifySession();
    
    // No timeout to clean up
    return () => {};
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log("Account page session state:", {
      isLoading: session.isLoading,
      isAuthenticated: session.isAuthenticated,
      hasUser: !!session.user,
      userDetails: session.user ? {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email
      } : null
    });
    
    if (!session.isLoading && !session.isAuthenticated) {
      console.log("Not authenticated, redirecting to login page");
      toast({
        title: "Authentication Required",
        description: "Please log in to view your account",
      });
      navigate("/");
    }
  }, [session.isLoading, session.isAuthenticated, navigate]);

  // Show loading state while checking authentication
  if (pageIsLoading || session.isLoading) {
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
    console.log("Account page: No authenticated user found in session, showing error");
    return (
      <SiteLayout fullHeight={false}>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-600 mb-2">Authentication Required</p>
            <p className="text-gray-600 mb-4">Please log in to view your account information.</p>
            <Button onClick={() => navigate("/")}>Return to Home</Button>
          </div>
        </div>
      </SiteLayout>
    );
  }

  // Safe access to session properties
  const current = session.usage?.current || 0;
  const limit = session.usage?.limit || 3;
  
  const usagePercentage = Math.min(
    100,
    Math.round((current / limit) * 100)
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
      {/* Subscription modal */}
      <SubscriptionModal 
        isOpen={isSubscriptionModalOpen} 
        onClose={() => setIsSubscriptionModalOpen(false)} 
      />

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
                          {(session.tier || SubscriptionTier.Free).charAt(0).toUpperCase() + (session.tier || SubscriptionTier.Free).slice(1)} Plan
                        </h3>
                        {session.tier !== SubscriptionTier.Free && session.user.stripeSubscriptionId && (
                          <p className="text-sm text-gray-500">
                            Subscription ID: {session.user.stripeSubscriptionId.slice(0, 8)}...
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold">${tierPrices[session.tier || SubscriptionTier.Free]}</span>
                        <span className="text-gray-500">/month</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">Monthly Usage</span>
                      <span className={`text-sm ${getUsageColor(current, limit)}`}>
                        {current} / {limit} generations
                      </span>
                    </div>
                    <Progress value={usagePercentage} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      Resets on {formatDate(session.usage?.resetDate || new Date().toISOString())}
                    </p>
                    
                    {/* Show refill credits if user has any */}
                    {session.refillPackCredits > 0 && (
                      <div className="mt-3 p-2 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-700">
                          <span className="font-medium">Bonus Credits:</span> {session.refillPackCredits} additional generations available
                        </p>
                      </div>
                    )}
                    
                    {/* Show refill or upgrade option if out of credits */}
                    {current >= limit && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-800 mb-2">
                          You've used all your monthly generations.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          {session.tier !== 'free' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => navigate("/refill")}
                            >
                              Refill 100 Credits for $0.99
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant={session.tier === 'free' ? "default" : "outline"}
                            onClick={() => setIsSubscriptionModalOpen(true)}
                          >
                            {session.tier === 'free' ? 'Upgrade Plan' : 'View All Plans'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                {session.tier === SubscriptionTier.Free ? (
                  <Button
                    onClick={() => setIsSubscriptionModalOpen(true)}
                    disabled={isLoading}
                  >
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-blue-700 text-white transition-all duration-300 hover:shadow-md hover:translate-y-[-1px] px-8"
                  >
                    Manage Subscription
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
