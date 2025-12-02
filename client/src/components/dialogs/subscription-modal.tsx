import { useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserContext } from "@/App";
import { useLocation } from "wouter";
import { SubscriptionTier } from "@shared/schema";
import { SUBSCRIPTION_FEATURES, SUBSCRIPTION_DISPLAY_NAMES, SUBSCRIPTION_PRICES } from "@/lib/constants";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubscriptionModal({ isOpen, onClose }: SubscriptionModalProps) {
  const { session } = useContext(UserContext);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (!session.isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upgrade your subscription.",
      });
      onClose();
      return;
    }

    if (tier === session.tier) {
      toast({
        title: "Current plan",
        description: "You are already subscribed to this plan.",
      });
      return;
    }

    if (tier === SubscriptionTier.Free) {
      toast({
        title: "Downgrade to Free",
        description: "Please manage your subscription in the Account page to downgrade.",
      });
      onClose();
      navigate("/account");
      return;
    }

    // Navigate to the subscribe page with the selected tier
    onClose();
    navigate(`/subscribe?tier=${tier}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription>
            Select a subscription tier that fits your needs
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="monthly" className="w-full mt-6">
          <TabsList className="grid w-[300px] grid-cols-2 mx-auto mb-6">
            <TabsTrigger value="monthly">Monthly Plans</TabsTrigger>
            <TabsTrigger value="refill">Refill Packs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="monthly">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
              {/* Free Tier */}
              <SubscriptionPlanCard
                tier={SubscriptionTier.Free}
                name={SUBSCRIPTION_DISPLAY_NAMES[SubscriptionTier.Free]}
                price={SUBSCRIPTION_PRICES[SubscriptionTier.Free]}
                features={SUBSCRIPTION_FEATURES[SubscriptionTier.Free]}
                isCurrentPlan={session.tier === SubscriptionTier.Free}
                onSelect={handleSelectPlan}
              />

              {/* Tier 1 (Basic) */}
              <SubscriptionPlanCard
                tier={SubscriptionTier.Tier1}
                name={SUBSCRIPTION_DISPLAY_NAMES[SubscriptionTier.Tier1]}
                price={SUBSCRIPTION_PRICES[SubscriptionTier.Tier1]}
                features={SUBSCRIPTION_FEATURES[SubscriptionTier.Tier1]}
                isCurrentPlan={session.tier === SubscriptionTier.Tier1}
                onSelect={handleSelectPlan}
              />

              {/* Tier 2 (Standard) */}
              <SubscriptionPlanCard
                tier={SubscriptionTier.Tier2}
                name={SUBSCRIPTION_DISPLAY_NAMES[SubscriptionTier.Tier2]}
                price={SUBSCRIPTION_PRICES[SubscriptionTier.Tier2]}
                features={SUBSCRIPTION_FEATURES[SubscriptionTier.Tier2]}
                isCurrentPlan={session.tier === SubscriptionTier.Tier2}
                onSelect={handleSelectPlan}
              />

              {/* Tier 3 (Pro) */}
              <SubscriptionPlanCard
                tier={SubscriptionTier.Tier3}
                name={SUBSCRIPTION_DISPLAY_NAMES[SubscriptionTier.Tier3]}
                price={SUBSCRIPTION_PRICES[SubscriptionTier.Tier3]}
                features={SUBSCRIPTION_FEATURES[SubscriptionTier.Tier3]}
                isCurrentPlan={session.tier === SubscriptionTier.Tier3}
                onSelect={handleSelectPlan}
              />
              
              {/* Tier 4 (Max) */}
              <SubscriptionPlanCard
                tier={SubscriptionTier.Tier4}
                name={SUBSCRIPTION_DISPLAY_NAMES[SubscriptionTier.Tier4]}
                price={SUBSCRIPTION_PRICES[SubscriptionTier.Tier4]}
                features={SUBSCRIPTION_FEATURES[SubscriptionTier.Tier4]}
                isCurrentPlan={session.tier === SubscriptionTier.Tier4}
                onSelect={handleSelectPlan}
              />
              
              {/* Tier 5 (Pro Max) */}
              <SubscriptionPlanCard
                tier={SubscriptionTier.Tier5}
                name={SUBSCRIPTION_DISPLAY_NAMES[SubscriptionTier.Tier5]}
                price={SUBSCRIPTION_PRICES[SubscriptionTier.Tier5]}
                features={SUBSCRIPTION_FEATURES[SubscriptionTier.Tier5]}
                isCurrentPlan={session.tier === SubscriptionTier.Tier5}
                isPopular={true}
                onSelect={handleSelectPlan}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="refill">
            <div className="max-w-md mx-auto p-6 bg-white border rounded-lg shadow-sm">
              <h3 className="text-lg font-medium text-gray-800">Refill Pack</h3>
              <p className="text-3xl font-bold mt-2">
                $0.99
                <span className="text-base font-normal text-gray-600"> one-time</span>
              </p>
              <p className="text-gray-600 mt-3">
                Add 100 generations to your account
              </p>

              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-emerald-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span className="text-gray-700">100 additional generations</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-emerald-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span className="text-gray-700">Credits never expire</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-emerald-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span className="text-gray-700">Used after monthly credits</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-emerald-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span className="text-gray-700">Buy as many as you need</span>
                </li>
              </ul>

              <Button
                onClick={() => navigate("/subscribe?product=refill")}
                className="w-full mt-8 transition-colors duration-150 ease-in-out font-medium bg-blue-600 hover:bg-blue-700 text-white"
              >
                Buy Refill Pack
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface SubscriptionPlanCardProps {
  tier: SubscriptionTier;
  name: string;
  price: number;
  features: string[];
  isCurrentPlan?: boolean;
  isPopular?: boolean;
  onSelect: (tier: SubscriptionTier) => void;
}

function SubscriptionPlanCard({
  tier,
  name,
  price,
  features,
  isCurrentPlan = false,
  isPopular = false,
  onSelect,
}: SubscriptionPlanCardProps) {
  return (
    <div
      className={cn(
        "border rounded-lg p-4 bg-white relative overflow-hidden flex flex-col h-full",
        isPopular ? "border-blue-500 shadow-md" : "border-gray-200"
      )}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 transform translate-x-6 rotate-45">
          POPULAR
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-800">{name}</h3>
      <p className="text-2xl font-bold mt-2">
        ${price.toFixed(2)}
        <span className="text-sm font-normal text-gray-600">/month</span>
      </p>
      
      <div className="text-sm text-gray-600 mt-2">
        {tier === SubscriptionTier.Free
          ? "Basic access to get you started"
          : tier === SubscriptionTier.Tier1
          ? "Perfect for students and hobbyists" 
          : tier === SubscriptionTier.Tier2
          ? "Great for regular users"
          : tier === SubscriptionTier.Tier3
          ? "For professionals"
          : tier === SubscriptionTier.Tier4
          ? "For power users"
          : "Ultimate professional package"}
      </div>

      <ul className="mt-4 space-y-2 text-sm flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="h-4 w-4 text-emerald-500 mr-1 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(tier)}
        className={cn(
          "w-full mt-4 transition-colors duration-150 ease-in-out font-medium text-sm",
          isCurrentPlan
            ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
            : isPopular
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
        )}
      >
        {isCurrentPlan ? "Current Plan" : `Upgrade to ${name}`}
      </Button>
    </div>
  );
}
