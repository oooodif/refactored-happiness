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
      <DialogContent className="w-[95vw] max-w-6xl overflow-y-auto max-h-[90vh]">
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
        
        {/* Mobile & Tablet Grid View - Simplified Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:hidden">
            {/* Free Tier */}
            <div 
              className={cn(
                "border rounded-lg p-4 relative flex flex-col",
                session.tier === SubscriptionTier.Free ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
                "cursor-pointer"
              )}
              onClick={() => handleSelectPlan(SubscriptionTier.Free)}
            >
              <div className="text-lg font-medium">Free</div>
              <div className="text-2xl font-bold mt-1">$0</div>
              <div className="text-sm text-gray-600 mt-1">{tierLimits[SubscriptionTier.Free]} generations</div>
              {session.tier === SubscriptionTier.Free && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Basic Tier */}
            <div 
              className={cn(
                "border rounded-lg p-4 relative flex flex-col",
                session.tier === SubscriptionTier.Basic ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
                "cursor-pointer"
              )}
              onClick={() => handleSelectPlan(SubscriptionTier.Basic)}
            >
              <div className="text-lg font-medium">Basic</div>
              <div className="text-2xl font-bold mt-1">$0.99</div>
              <div className="text-sm text-gray-600 mt-1">{tierLimits[SubscriptionTier.Basic]} generations</div>
              {session.tier === SubscriptionTier.Basic && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Standard Tier */}
            <div 
              className={cn(
                "border rounded-lg p-4 relative flex flex-col",
                session.tier === SubscriptionTier.Tier2 ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
                "cursor-pointer"
              )}
              onClick={() => handleSelectPlan(SubscriptionTier.Tier2)}
            >
              <div className="text-lg font-medium">Standard</div>
              <div className="text-2xl font-bold mt-1">$2.99</div>
              <div className="text-sm text-gray-600 mt-1">{tierLimits[SubscriptionTier.Tier2]} generations</div>
              {session.tier === SubscriptionTier.Tier2 && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Pro Tier */}
            <div 
              className={cn(
                "border rounded-lg p-4 relative flex flex-col",
                session.tier === SubscriptionTier.Pro ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
                "cursor-pointer"
              )}
              onClick={() => handleSelectPlan(SubscriptionTier.Pro)}
            >
              <div className="text-lg font-medium">Pro</div>
              <div className="text-2xl font-bold mt-1">$6.99</div>
              <div className="text-sm text-gray-600 mt-1">{tierLimits[SubscriptionTier.Pro]} generations</div>
              {session.tier === SubscriptionTier.Pro && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Advanced Tier */}
            <div 
              className={cn(
                "border rounded-lg p-4 relative flex flex-col",
                session.tier === SubscriptionTier.Tier4 ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
                "cursor-pointer"
              )}
              onClick={() => handleSelectPlan(SubscriptionTier.Tier4)}
            >
              <div className="text-lg font-medium">Advanced</div>
              <div className="text-2xl font-bold mt-1">$11.99</div>
              <div className="text-sm text-gray-600 mt-1">{tierLimits[SubscriptionTier.Tier4]} generations</div>
              {session.tier === SubscriptionTier.Tier4 && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            
            {/* Power Tier */}
            <div 
              className={cn(
                "border rounded-lg p-4 relative flex flex-col",
                session.tier === SubscriptionTier.Power ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
                "cursor-pointer"
              )}
              onClick={() => handleSelectPlan(SubscriptionTier.Power)}
            >
              <div className="text-lg font-medium">Power</div>
              <div className="text-2xl font-bold mt-1">$19.99</div>
              <div className="text-sm text-gray-600 mt-1">{tierLimits[SubscriptionTier.Power]} generations</div>
              {session.tier === SubscriptionTier.Power && (
                <div className="absolute top-2 right-2">
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                Popular
              </div>
            </div>
          </div>
        
        {/* Desktop view with simplified cards - 3x3 grid for large screens */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
          {/* Free Tier */}
          <div 
            className={cn(
              "border rounded-lg p-5 relative flex flex-col w-48 depth-3d",
              session.tier === SubscriptionTier.Free ? "border-blue-500 bg-blue-50" : "glass-card",
              "cursor-pointer transition-all duration-300"
            )}
            onClick={() => handleSelectPlan(SubscriptionTier.Free)}
          >
            <div className="text-lg font-semibold">Free</div>
            <div className="text-3xl font-bold mt-2">$0</div>
            <div className="text-sm text-gray-600 mt-3">{tierLimits[SubscriptionTier.Free]} generations</div>
            {session.tier === SubscriptionTier.Free && (
              <div className="absolute top-2 right-2">
                <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Basic Tier */}
          <div 
            className={cn(
              "border rounded-lg p-5 relative flex flex-col w-48 depth-3d",
              session.tier === SubscriptionTier.Basic ? "border-blue-500 bg-blue-50" : "glass-card",
              "cursor-pointer transition-all duration-300"
            )}
            onClick={() => handleSelectPlan(SubscriptionTier.Basic)}
          >
            <div className="text-lg font-semibold">Basic</div>
            <div className="text-3xl font-bold mt-2">$0.99</div>
            <div className="text-sm text-gray-600 mt-3">{tierLimits[SubscriptionTier.Basic]} generations</div>
            {session.tier === SubscriptionTier.Basic && (
              <div className="absolute top-2 right-2">
                <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Standard Tier */}
          <div 
            className={cn(
              "border rounded-lg p-5 relative flex flex-col w-48 depth-3d",
              session.tier === SubscriptionTier.Tier2 ? "border-blue-500 bg-blue-50" : "glass-card",
              "cursor-pointer transition-all duration-300"
            )}
            onClick={() => handleSelectPlan(SubscriptionTier.Tier2)}
          >
            <div className="text-lg font-semibold">Standard</div>
            <div className="text-3xl font-bold mt-2">$2.99</div>
            <div className="text-sm text-gray-600 mt-3">{tierLimits[SubscriptionTier.Tier2]} generations</div>
            {session.tier === SubscriptionTier.Tier2 && (
              <div className="absolute top-2 right-2">
                <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Pro Tier */}
          <div 
            className={cn(
              "border rounded-lg p-5 relative flex flex-col w-48 depth-3d",
              session.tier === SubscriptionTier.Pro ? "border-blue-500 bg-blue-50" : "glass-card",
              "cursor-pointer transition-all duration-300"
            )}
            onClick={() => handleSelectPlan(SubscriptionTier.Pro)}
          >
            <div className="text-lg font-semibold">Pro</div>
            <div className="text-3xl font-bold mt-2">$6.99</div>
            <div className="text-sm text-gray-600 mt-3">{tierLimits[SubscriptionTier.Pro]} generations</div>
            {session.tier === SubscriptionTier.Pro && (
              <div className="absolute top-2 right-2">
                <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Advanced Tier */}
          <div 
            className={cn(
              "border rounded-lg p-5 relative flex flex-col w-48 depth-3d",
              session.tier === SubscriptionTier.Tier4 ? "border-blue-500 bg-blue-50" : "glass-card",
              "cursor-pointer transition-all duration-300"
            )}
            onClick={() => handleSelectPlan(SubscriptionTier.Tier4)}
          >
            <div className="text-lg font-semibold">Advanced</div>
            <div className="text-3xl font-bold mt-2">$11.99</div>
            <div className="text-sm text-gray-600 mt-3">{tierLimits[SubscriptionTier.Tier4]} generations</div>
            {session.tier === SubscriptionTier.Tier4 && (
              <div className="absolute top-2 right-2">
                <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Power Tier */}
          <div 
            className={cn(
              "border rounded-lg p-5 relative flex flex-col w-48 depth-3d",
              session.tier === SubscriptionTier.Power ? "border-blue-500 bg-blue-50" : "glass-card",
              "cursor-pointer transition-all duration-300"
            )}
            onClick={() => handleSelectPlan(SubscriptionTier.Power)}
          >
            <div className="text-lg font-semibold">Power</div>
            <div className="text-3xl font-bold mt-2">$19.99</div>
            <div className="text-sm text-gray-600 mt-3">{tierLimits[SubscriptionTier.Power]} generations</div>
            {session.tier === SubscriptionTier.Power && (
              <div className="absolute top-2 right-2">
                <svg className="h-6 w-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              Popular
            </div>
          </div>
        </div>

        {/* Refill Pack Option - Only shown to paid subscribers */}
        {session.isAuthenticated && session.tier !== 'free' && (
          <>
            <h3 className="text-lg font-medium text-gray-800 mt-8 mb-2">One-Time Refill Pack</h3>
            
            {/* Mobile view for refill pack */}
            <div className="block md:hidden">
              <div 
                className="border border-emerald-200 rounded-lg p-5 bg-emerald-50 relative cursor-pointer"
                onClick={() => {
                  onClose();
                  navigate("/refill");
                }}
              >
                <div className="text-lg font-semibold text-emerald-800">LaTeX Generation Refill</div>
                <div className="text-2xl font-bold mt-2 text-emerald-700">${REFILL_PACK_PRICE.toFixed(2)}</div>
                <div className="text-sm text-emerald-600 mt-3">{REFILL_PACK_CREDITS} generations • Never expire</div>
              </div>
            </div>
            
            {/* Desktop view for refill pack */}
            <div className="hidden md:flex md:justify-center">
              <div 
                className="border border-emerald-200 rounded-lg p-5 relative cursor-pointer flex flex-col max-w-sm depth-3d glass-card"
                onClick={() => {
                  onClose();
                  navigate("/refill");
                }}
              >
                <div className="text-lg font-semibold text-emerald-800">LaTeX Generation Refill</div>
                <div className="text-3xl font-bold mt-2 text-emerald-700">${REFILL_PACK_PRICE.toFixed(2)}</div>
                <div className="text-sm text-emerald-600 mt-3">{REFILL_PACK_CREDITS} generations • Never expire</div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// End of component
