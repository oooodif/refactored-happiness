import { Button } from "@/components/ui/button";
import { useState, useContext } from "react";
import { Link, useLocation } from "wouter";
import { UserContext } from "@/App";
import { API_ROUTES } from "@/lib/constants";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import LoginModal from "@/components/dialogs/login-modal";
import SubscriptionModal from "@/components/dialogs/subscription-modal";
import { getUsageColor } from "@/lib/utils";
import { SubscriptionTier } from "@shared/schema";

export default function Header() {
  const [location, navigate] = useLocation();
  const { session, setSession } = useContext(UserContext);
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Debug log to check authentication state
  console.log("Header authentication state:", {
    isAuthenticated: session.isAuthenticated,
    user: session.user,
    tier: session.tier
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", API_ROUTES.auth.logout, {});
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
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
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
              AI LaTeX Generator
            </h1>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          {session.isAuthenticated ? (
            <>
              <span className={`text-sm ${getUsageColor(session.usage.current, session.usage.limit)}`}>
                {session.usage.current} / {session.usage.limit} generations
              </span>
              {location !== "/history" && (
                <Link href="/history" className="text-sm text-gray-600 hover:text-gray-800 font-medium">
                  History
                </Link>
              )}
              <div className="relative group">
                <Button
                  variant="ghost"
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  {session.user?.username}
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 hidden group-hover:block">
                  <div className="py-1">
                    <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => setShowSubscriptionModal(true)}
                className={session.tier === "free" ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}
              >
                {session.tier === "free" ? "Upgrade" : "Manage Plan"}
              </Button>
            </>
          ) : (
            <>
              <span className="text-sm text-gray-600">
                3 generations left
              </span>
              <Button
                variant="ghost"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => setShowLoginModal(true)}
              >
                Sign In
              </Button>
              <Button 
                onClick={() => setShowSubscriptionModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upgrade
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      
      <SubscriptionModal 
        isOpen={showSubscriptionModal} 
        onClose={() => setShowSubscriptionModal(false)} 
      />
    </header>
  );
}
