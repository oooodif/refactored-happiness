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
  const forceAuthCheck = async (retryCount = 0, maxRetries = 1) => {
    try {
      // Avoid excessive checks if we just checked (debounce for 2 seconds)
      const now = Date.now();
      if (session.lastAuthCheck && now - session.lastAuthCheck < 2000) {
        console.log("SKIPPING AUTH CHECK - too soon since last check");
        return;
      }
      
      console.log(`FORCE CHECKING AUTH STATUS (attempt ${retryCount + 1}/${maxRetries + 1})`);
      const response = await fetch(API_ROUTES.auth.me, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-Time': now.toString() // Add timestamp to prevent caching
        }
      });
      
      console.log("FORCE AUTH CHECK RESPONSE:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("FORCE AUTH CHECK SUCCESS:", data);
        
        if (data && data.user) {
          // Update local storage backup
          localStorage.setItem('userLoggedIn', 'true');
          localStorage.setItem('userData', JSON.stringify({
            username: data.user.username,
            lastChecked: now
          }));
          
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
            refillPackCredits: data.user.refillPackCredits || 0,
            lastAuthCheck: now
          });
          
          // Show a success toast if coming from verification
          const params = new URLSearchParams(window.location.search);
          if (params.get('verified') === 'true') {
            toast({
              title: "Login successful!",
              description: "Your email has been verified and you're now logged in.",
            });
            
            // Clear the query param
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          console.log("No user data in response");
          setSession(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            lastAuthCheck: now
          }));
        }
      } else if (response.status === 401 && retryCount < maxRetries) {
        console.log(`AUTH CHECK FAILED (${response.status}), retrying in 1 second...`);
        setTimeout(() => {
          forceAuthCheck(retryCount + 1, maxRetries);
        }, 1000);
        return;
      } else {
        console.log("FORCE AUTH CHECK FAILED:", response.status);
        // User is not authenticated
        setSession(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          lastAuthCheck: now
        }));
      }
    } catch (error) {
      console.error("FORCE AUTH CHECK ERROR:", error);
      // Retry on error if we have retries left
      if (retryCount < maxRetries) {
        console.log(`AUTH CHECK ERROR, retrying in 1 second... (${retryCount + 1}/${maxRetries + 1})`);
        setTimeout(() => {
          forceAuthCheck(retryCount + 1, maxRetries);
        }, 1000);
        return;
      }
      
      // Check if we have a local storage backup
      const userLoggedIn = localStorage.getItem('userLoggedIn');
      const userDataStr = localStorage.getItem('userData');
      const now = Date.now();
      
      if (userLoggedIn === 'true' && userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          console.log("USING LOCAL STORAGE BACKUP:", userData);
          
          // Show warning toast
          toast({
            title: "Connection Issue",
            description: "Using locally stored session data. Some features may be limited.",
            variant: "destructive"
          });
          
          // Set partial session data
          setSession(prev => ({
            ...prev,
            isAuthenticated: true,
            isLoading: false,
            user: {
              ...prev.user,
              username: userData.username
            },
            lastAuthCheck: now
          }));
        } catch (e) {
          console.error("Failed to parse local storage user data:", e);
          setSession(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            lastAuthCheck: now
          }));
        }
      } else {
        // No backup, set as not authenticated
        setSession(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          lastAuthCheck: now
        }));
      }
    }
  };

  // Check for query parameters that indicate we're coming from a verification link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      console.log("DETECTED VERIFICATION REDIRECT - FORCING AUTH CHECK");
      forceAuthCheck();
    }
  }, [location]);

  // Perform a force check when the header mounts
  useEffect(() => {
    forceAuthCheck();
    
    // Set up periodic checks
    const intervalId = setInterval(() => {
      console.log("Performing periodic auth check");
      forceAuthCheck();
    }, 60000); // Check every minute
    
    // Check on window focus
    const handleFocus = () => {
      console.log("Window focused - checking auth");
      forceAuthCheck();
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Clean up
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
    };
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
      document.cookie = "connect.sid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
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

  // Force session sync
  const forceSessionSync = () => {
    console.log("FORCING SESSION SYNC");
    toast({
      title: "Refreshing Session",
      description: "Attempting to sync your session state..."
    });
    
    // Force a hard reload to sync session
    window.location.reload();
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
          {/* Debug button - only in dev */}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4 text-xs" 
            onClick={forceSessionSync}
          >
            Sync Session
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          {session.isLoading ? (
            // Loading state
            <>
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">Loading...</span>
            </>
          ) : session.isAuthenticated && session.user ? (
            // Authenticated state
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
              
              {/* Account button with username */}
              <Button
                variant="ghost"
                className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                onClick={() => navigate("/account")}
              >
                {session.user?.username || "My Account"}
              </Button>
              
              {/* Logout button */}
              <Button
                type="button" 
                variant="ghost"
                className="text-sm text-red-600 hover:text-red-800 font-medium"
                onClick={handleLogout}
              >
                Logout
              </Button>
              
              {/* Plan button */}
              <Button 
                onClick={() => setShowSubscriptionModal(true)}
                className={session.tier === SubscriptionTier.Free ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}
              >
                {session.tier === SubscriptionTier.Free ? "Upgrade" : "Manage Plan"}
              </Button>
            </>
          ) : (
            // Not authenticated state
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