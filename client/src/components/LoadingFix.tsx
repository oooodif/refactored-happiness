import { useEffect, useContext } from 'react';
import { UserContext } from '@/App';
import { SubscriptionTier } from "@shared/schema";

/**
 * This component is a temporary workaround to fix the infinite loading issue
 * It forces the session to stop loading after a short delay with an extremely
 * simple implementation to avoid any potential complications
 */
export default function LoadingFix() {
  const { session, setSession } = useContext(UserContext);

  useEffect(() => {
    // This effect runs once on mount
    console.log("LoadingFix mounted - Simple Version - session state:", {
      isLoading: session.isLoading,
      isAuthenticated: session.isAuthenticated
    });

    // Single simple timer to force loading state to false after a short delay
    const timer = setTimeout(() => {
      console.log("LoadingFix: Forcing loading state to false (200ms)");
      
      // Direct set session approach - no complexity
      if (session.isLoading) {
        setSession({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          tier: SubscriptionTier.Free,
          usage: {
            current: 0,
            limit: 3,
            resetDate: new Date().toISOString()
          },
          refillPackCredits: 0
        });
      }
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [session.isLoading, setSession]); // Include deps to avoid lint warnings

  // This component doesn't render anything
  return null;
}