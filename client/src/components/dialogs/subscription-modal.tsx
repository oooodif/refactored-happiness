import { useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserContext } from "@/App";
import { useLocation } from "wouter";
import { 
  SubscriptionTier, 
  tierLimits, 
  tierPrices, 
  REFILL_PACK_CREDITS, 
  REFILL_PACK_PRICE 
} from "@shared/schema";
import { SUBSCRIPTION_FEATURES } from "@/lib/constants";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription>
            Select a subscription tier that fits your needs
          </DialogDescription>
        </DialogHeader>

        {/* Monthly Subscription Plans */}
        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Monthly Subscription Plans</h3>
        
        {/* Mobile-friendly tab navigation for smaller screens */}
        <div className="block md:hidden mb-4">
          <div className="flex overflow-x-auto pb-2 space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className={session.tier === SubscriptionTier.Free ? "bg-blue-50 border-blue-300" : ""}
              onClick={() => handleSelectPlan(SubscriptionTier.Free)}
            >
              Free
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={session.tier === SubscriptionTier.Basic ? "bg-blue-50 border-blue-300" : ""}
              onClick={() => handleSelectPlan(SubscriptionTier.Basic)}
            >
              Basic ($0.99)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={session.tier === SubscriptionTier.Tier2 ? "bg-blue-50 border-blue-300" : ""}
              onClick={() => handleSelectPlan(SubscriptionTier.Tier2)}
            >
              Standard ($2.99)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={session.tier === SubscriptionTier.Pro ? "bg-blue-50 border-blue-300" : ""}
              onClick={() => handleSelectPlan(SubscriptionTier.Pro)}
            >
              Pro ($6.99)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={session.tier === SubscriptionTier.Tier4 ? "bg-blue-50 border-blue-300" : ""}
              onClick={() => handleSelectPlan(SubscriptionTier.Tier4)}
            >
              Advanced ($11.99)
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className={cn(
                session.tier === SubscriptionTier.Power ? "bg-blue-50 border-blue-300" : "",
                "relative"
              )}
              onClick={() => handleSelectPlan(SubscriptionTier.Power)}
            >
              Power ($19.99)
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1 py-0.5 rounded-full">Popular</span>
            </Button>
          </div>
        </div>
        
        {/* Desktop view with cards */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Free Tier */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Free}
            name="Free"
            price={0}
            features={[`${tierLimits[SubscriptionTier.Free]} LaTeX generations/month`]}
            isCurrentPlan={session.tier === SubscriptionTier.Free}
            onSelect={handleSelectPlan}
          />

          {/* Basic Tier (Tier 1) */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Basic}
            name="Basic"
            price={0.99}
            features={[`${tierLimits[SubscriptionTier.Basic]} LaTeX generations/month`]}
            isCurrentPlan={session.tier === SubscriptionTier.Basic}
            onSelect={handleSelectPlan}
          />

          {/* Tier 2 */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Tier2}
            name="Standard"
            price={2.99}
            features={[`${tierLimits[SubscriptionTier.Tier2]} LaTeX generations/month`]}
            isCurrentPlan={session.tier === SubscriptionTier.Tier2}
            onSelect={handleSelectPlan}
          />

          {/* Pro Tier (Tier 3) */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Pro}
            name="Pro"
            price={6.99}
            features={[`${tierLimits[SubscriptionTier.Pro]} LaTeX generations/month`]}
            isCurrentPlan={session.tier === SubscriptionTier.Pro}
            onSelect={handleSelectPlan}
          />
          
          {/* Tier 4 */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Tier4}
            name="Advanced"
            price={11.99}
            features={[`${tierLimits[SubscriptionTier.Tier4]} LaTeX generations/month`]}
            isCurrentPlan={session.tier === SubscriptionTier.Tier4}
            onSelect={handleSelectPlan}
          />
          
          {/* Power Tier (Tier 5) */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Power}
            name="Power"
            price={19.99}
            features={[`${tierLimits[SubscriptionTier.Power]} LaTeX generations/month`]}
            isCurrentPlan={session.tier === SubscriptionTier.Power}
            isPopular={true}
            onSelect={handleSelectPlan}
          />
        </div>
        
        {/* Mobile detailed view of selected plan */}
        <div className="block md:hidden mt-4">
          <div className="border rounded-lg p-6 bg-white">
            <h3 className="text-lg font-medium text-gray-800">
              {session.tier === SubscriptionTier.Free ? "Free" : 
               session.tier === SubscriptionTier.Basic ? "Basic" :
               session.tier === SubscriptionTier.Tier2 ? "Standard" :
               session.tier === SubscriptionTier.Pro ? "Pro" :
               session.tier === SubscriptionTier.Tier4 ? "Advanced" :
               session.tier === SubscriptionTier.Power ? "Power" : "Free"} Plan
            </h3>
            
            <p className="text-3xl font-bold mt-2">
              ${tierPrices[session.tier || SubscriptionTier.Free].toFixed(2)}
              <span className="text-base font-normal text-gray-600">/month</span>
            </p>
            
            <p className="text-gray-600 mt-3">
              {session.tier === SubscriptionTier.Free
                ? "Basic access to get you started"
                : session.tier === SubscriptionTier.Basic
                ? "Perfect for students and hobbyists"
                : "For professionals and power users"}
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
                <span className="text-gray-700">
                  {tierLimits[session.tier || SubscriptionTier.Free]} LaTeX generations/month
                </span>
              </li>
            </ul>
            
            <Button
              onClick={() => handleSelectPlan(session.tier || SubscriptionTier.Free)}
              className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={session.tier === (session.tier || SubscriptionTier.Free)}
            >
              {session.tier === (session.tier || SubscriptionTier.Free) ? "Current Plan" : "Select This Plan"}
            </Button>
          </div>
        </div>

        {/* Refill Pack Option - Only shown to paid subscribers */}
        {session.isAuthenticated && session.tier !== 'free' && (
          <>
            <h3 className="text-lg font-medium text-gray-800 mt-8 mb-2">One-Time Refill Pack</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="border rounded-lg p-6 bg-white col-span-1 md:col-span-3 lg:col-span-2 flex flex-col">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-800">LaTeX Generation Refill</h3>
                  <p className="text-3xl font-bold mt-2">
                    ${REFILL_PACK_PRICE.toFixed(2)}
                    <span className="text-base font-normal text-gray-600"> one-time</span>
                  </p>
                  <p className="text-gray-600 mt-3">
                    Add extra generation credits without changing your subscription
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
                      <span className="text-gray-700">{REFILL_PACK_CREDITS} additional LaTeX generations</span>
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
                      <span className="text-gray-700">Used after monthly credits are exhausted</span>
                    </li>
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    // Navigate to refill purchase page
                    onClose();
                    navigate("/refill");
                  }}
                  className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Purchase Refill Pack
                </Button>
              </div>
            </div>
          </>
        )}
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
        "border rounded-lg p-6 bg-white relative overflow-hidden",
        isPopular ? "border-blue-500 shadow-md" : "border-gray-200"
      )}
    >
      {isPopular && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 transform translate-x-6 rotate-45">
          POPULAR
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-800">{name}</h3>
      <p className="text-3xl font-bold mt-2">
        ${price.toFixed(2)}
        <span className="text-base font-normal text-gray-600">/month</span>
      </p>
      <p className="text-gray-600 mt-3">
        {tier === SubscriptionTier.Free
          ? "Basic access to get you started"
          : tier === SubscriptionTier.Basic
          ? "Perfect for students and hobbyists"
          : "For professionals and power users"}
      </p>

      <ul className="mt-6 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
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
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(tier)}
        className={cn(
          "w-full mt-8 transition-colors duration-150 ease-in-out font-medium",
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
