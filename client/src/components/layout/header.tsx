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
  
  // Debug information
  useEffect(() => {
    console.log("HEADER AUTH STATE:", {
      isAuthenticated: session.isAuthenticated,
      user: session.user?.username,
      tier: session.tier,
      isLoading: session.isLoading
    });
  }, [session]);
  
  // This function forces a check of auth status immediately
  const forceAuthCheck = async () => {
    try {
      console.log("FORCE CHECKING AUTH STATUS");
      const response = await fetch(API_ROUTES.auth.me, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("FORCE AUTH CHECK SUCCESS:", data);
        
        // Update session with user data
        setSession({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          tier: data.user.subscriptionTier || SubscriptionTier.Free,
          usage: {
            current: data.user.monthlyUsage || 0,
            limit: data.usageLimit || 3,
            resetDate: data.user.usageResetDate || new Date().toISOString()
          },
          refillPackCredits: data.user.refillPackCredits || 0
        });
      } else {
        console.log("FORCE AUTH CHECK FAILED:", response.status);
      }
    } catch (error) {
      console.error("FORCE AUTH CHECK ERROR:", error);
    }
  };

  // Perform a force check when the header mounts
  useEffect(() => {
    forceAuthCheck();
  }, []);

  const handleLogout = async () => {
    try {
      console.log("LOGOUT STARTED");
      
      // Tell the server to clear its session first
      const logoutResponse = await fetch(API_ROUTES.auth.logout, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
      
      if (!logoutResponse.ok) {
        console.error("SERVER LOGOUT FAILED:", await logoutResponse.text());
      } else {
        console.log("SERVER LOGOUT SUCCESS");
      }
      
      // Clear all backup cookies and storage
      document.cookie = "userLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "latex.sid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('userLoggedIn');
      
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
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      
      // Hard reload to clear any state
      window.location.href = '/';
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
      
      // Even if there's an error, clear client state
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
        title: "Error",
        description: "There was an issue logging out, but your local session has been cleared.",
        variant: "destructive",
      });
      
      // Hard reload
      window.location.href = '/';
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
              AITexGen
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
              {/* Simple buttons for logged-in user actions */}
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
