import { useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { UserContext } from "@/App";
import { useLocation } from "wouter";
import { SubscriptionTier, tierLimits, tierPrices } from "@shared/schema";
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Free Tier */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Free}
            name="Free"
            price={0}
            features={SUBSCRIPTION_FEATURES[SubscriptionTier.Free]}
            isCurrentPlan={session.tier === SubscriptionTier.Free}
            onSelect={handleSelectPlan}
          />

          {/* Basic Tier */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Basic}
            name="Basic"
            price={4.99}
            features={SUBSCRIPTION_FEATURES[SubscriptionTier.Basic]}
            isCurrentPlan={session.tier === SubscriptionTier.Basic}
            isPopular={true}
            onSelect={handleSelectPlan}
          />

          {/* Pro Tier */}
          <SubscriptionPlanCard
            tier={SubscriptionTier.Pro}
            name="Pro"
            price={9.99}
            features={SUBSCRIPTION_FEATURES[SubscriptionTier.Pro]}
            isCurrentPlan={session.tier === SubscriptionTier.Pro}
            onSelect={handleSelectPlan}
          />
        </div>
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
