import { Button } from "@/components/ui/button";
import { useState, useContext, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { UserContext } from "@/App";
import { API_ROUTES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import LoginModal from "@/components/dialogs/login-modal";
import SubscriptionModal from "@/components/dialogs/subscription-modal";
import { getUsageColor } from "@/lib/utils";
import { SubscriptionTier } from "@shared/schema.ts";
import { Loader2 } from "lucide-react";

export default function Header() {
  const [location, navigate] = useLocation();
  const { session, setSession } = useContext(UserContext);
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const handleLogout = async () => {
    try {
      // Tell the server to clear its session
      await fetch(API_ROUTES.auth.logout, {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear client-side state
      setSession({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        tier: SubscriptionTier.Free,
        usage: {
          current: 0,
          limit: 3,
          resetDate: new Date().toISOString(),
        },
        refillPackCredits: 0,
      });
      
      // Clear storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Hard reload to clear any state
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = '/';
    }
  };

  const handleEmergencyReset = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Hard reload the page
    window.location.href = '/';
  };
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <h1 className="ml-2 text-xl font-semibold text-gray-800">
              AI Latex Generator
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {session.isLoading ? (
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          ) : session.isAuthenticated && session.user ? (
            <>
              <span className={`text-sm ${getUsageColor(
                session.usage?.current || 0, 
                session.usage?.limit || 3
              )}`}>
                {session.usage?.current || 0} / {session.usage?.limit || 3} generations
              </span>
              
              {location !== "/history" && (
                <Link href="/history" className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                  History
                </Link>
              )}
              
              <Button
                variant="ghost"
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                onClick={() => navigate("/account")}
              >
                {session.user?.username || "My Account"}
              </Button>
              
              <Button
                type="button" 
                variant="ghost"
                className="text-sm text-red-600 hover:text-red-800 font-medium"
                onClick={handleLogout}
              >
                Logout
              </Button>
              
              <Button 
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-transparent"
              >
                {session.tier === SubscriptionTier.Free ? "Upgrade" : "Manage Plan"}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                className="text-sm"
                onClick={() => setShowLoginModal(true)}
              >
                Log In
              </Button>
              <Button 
                onClick={() => setShowLoginModal(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-transparent text-sm"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Login modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}
      
      {/* Subscription modal */}
      {showSubscriptionModal && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
        />
      )}
    </header>
  );
}