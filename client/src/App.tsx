import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient, checkAuthStatus } from "./lib/queryClient";
import { useState, useEffect, useCallback } from "react";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Account from "@/pages/account";
import Subscribe from "@/pages/subscribe";
import RefillPage from "@/pages/refill";
import DocumentHistory from "@/pages/document-history";
import VerifyEmail from "@/pages/verify-email";
import Success from "@/pages/success";
import UIPlayground from "@/pages/ui-playground";
import TemplateRedirect from "@/pages/template-redirect";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";

// Components
import AuthRequiredDialog from "@/components/dialogs/auth-required-dialog";
import LoadingFix from "@/components/LoadingFix";

// User context
import { UserSession } from "./lib/types";
import { SubscriptionTier } from "@shared/schema";
import { API_ROUTES } from "./lib/constants";

// Create a context to share user session data
import { createContext } from "react";
export const UserContext = createContext<{
  session: UserSession;
  setSession: React.Dispatch<React.SetStateAction<UserSession>>;
  checkAndUpdateSession: () => Promise<void>;
}>({
  session: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    tier: SubscriptionTier.Free,
    usage: {
      current: 0,
      limit: 3,
      resetDate: new Date().toISOString(),
    },
    refillPackCredits: 0,
  },
  setSession: () => {},
  checkAndUpdateSession: async () => {},
});

// Create an Auth Required context to control the signup/login prompt
export const AuthRequiredContext = createContext<{
  showAuthPrompt: boolean;
  setShowAuthPrompt: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  showAuthPrompt: false,
  setShowAuthPrompt: () => {},
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/account" component={Account} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/refill" component={RefillPage} />
      <Route path="/success" component={Success} />
      <Route path="/history" component={DocumentHistory} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/ui-playground" component={UIPlayground} />
      <Route path="/template/:type" component={TemplateRedirect} />
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Basic default initialization
  const [session, setSession] = useState<UserSession>({
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
  
  // Auth prompt modal state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  // Create a reusable function to check and update session that can be passed down via context
  const checkAndUpdateSession = useCallback(async (retryCount = 0, maxRetries = 2) => {
    try {
      console.log(`MANUAL SESSION CHECK TRIGGERED (attempt ${retryCount + 1}/${maxRetries + 1})`);
      // First make a hard call to the server to check the actual session state
      const res = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Request-Time': Date.now().toString() // Add timestamp to prevent caching
        }
      });
      
      console.log("SESSION CHECK STATUS:", res.status);
      
      if (res.ok) {
        const authData = await res.json();
        console.log("SESSION CHECK RESPONSE:", authData);
        
        if (authData.user) {
          console.log("SESSION CHECK SUCCESS: AUTHENTICATED as", authData.user.username);
          
          // Update the session with fresh data - ensure required fields exist
          if (!authData.user || typeof authData.user.id !== 'number') {
            console.error("Invalid user data received from server, missing ID:", authData);
            throw new Error("Invalid user data received from server");
          }
          
          // Validate and set session with proper data
          setSession({
            user: {
              ...authData.user,
              id: authData.user.id // Ensure ID is passed explicitly
            },
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
          
          // Update local storage as a backup
          localStorage.setItem('userLoggedIn', 'true');
          localStorage.setItem('userData', JSON.stringify({
            username: authData.user.username,
            lastChecked: Date.now()
          }));
          
          return;
        }
      } else if (res.status === 401 && retryCount < maxRetries) {
        // Might be a temporary session issue, retry after a short delay
        console.log(`SESSION CHECK FAILED (${res.status}), retrying in 1 second...`);
        setTimeout(() => {
          checkAndUpdateSession(retryCount + 1, maxRetries);
        }, 1000); // 1 second delay before retry
        return;
      }
      
      // Not authenticated or max retries reached
      console.log("SESSION CHECK - NOT AUTHENTICATED");
      
      // Clear any local storage session data
      localStorage.removeItem('userLoggedIn');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('userLoggedIn');
      
      // Force complete reset of session state
      const resetSession = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        tier: SubscriptionTier.Free,
        usage: {
          current: 0,
          limit: 3,
          resetDate: new Date().toISOString()
        },
        refillPackCredits: 0,
        lastAuthCheck: Date.now()
      };
      
      setSession(resetSession);
      
      // Allow certain pages to handle their own auth state without auto-redirecting
      const noRedirectPaths = ['/', '/login', '/register', '/auth'];
      if (res && res.status === 401 && !noRedirectPaths.includes(window.location.pathname) && 
          !window.location.pathname.startsWith('/template/')) {
        console.log("401 detected, but not redirecting for protected path:", window.location.pathname);
        // Don't force redirect, let the page handle its own auth state
      }
    } catch (error) {
      console.error("SESSION CHECK ERROR:", error);
      setSession(prev => ({...prev, isLoading: false}));
      
      // Retry on network errors
      if (retryCount < maxRetries) {
        console.log(`SESSION CHECK ERROR, retrying in 1 second... (${retryCount + 1}/${maxRetries + 1})`);
        setTimeout(() => {
          checkAndUpdateSession(retryCount + 1, maxRetries);
        }, 1000);
      }
    }
  }, []);
  
  // Add event listeners for focus and visibility changes to refresh auth status
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log("Page became visible, checking auth status");
        checkAndUpdateSession();
      }
    };
    
    const handleFocus = () => {
      console.log("Window focused, checking auth status");
      checkAndUpdateSession();
    };
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    // Remove event listeners on cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkAndUpdateSession]);
  
  // Add a debug effect to log relevant factors (window.fetch available, etc.)
  useEffect(() => {
    console.log("Debug info:", {
      fetchAvailable: typeof window.fetch === 'function',
      localStorage: typeof localStorage !== 'undefined',
      apiAuthMe: API_ROUTES.auth.me
    });
  }, []);

  // Add a loading timeout to ensure we never stay in loading state forever
  useEffect(() => {
    if (session.isLoading) {
      // Create a timeout to force the loading state to resolve after 5 seconds
      console.log("Setting loading timeout failsafe");
      const loadingTimeout = setTimeout(() => {
        console.log("Loading timeout triggered - forcing loading state to resolve");
        setSession(prev => {
          if (prev.isLoading) {
            return {
              ...prev,
              isLoading: false
            };
          }
          return prev;
        });
      }, 5000); // 5 second timeout
      
      return () => {
        clearTimeout(loadingTimeout);
      };
    }
  }, [session.isLoading]);
  
  // Initial auth check on app start
  useEffect(() => {
    console.log("INITIAL AUTH CHECK STARTED");
    
    // Skip localStorage check and go straight to server check
    // This prevents intermittent loading state issues
    console.log("Skipping localStorage check to avoid state cycles");
    
    // Perform proper server-side check immediately
    // Add a small delay to ensure the app has time to properly initialize
    setTimeout(() => {
      checkAndUpdateSession();
    }, 100);
    
    // Setup polling for auth status (backup mechanism) at a reduced frequency
    const checkIntervalMs = 120000; // 2 minutes (reduced frequency)
    const intervalId = window.setInterval(checkAndUpdateSession, checkIntervalMs);
    
    // Proper cleanup
    return () => {
      window.clearInterval(intervalId);
    };
  }, [checkAndUpdateSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ session, setSession, checkAndUpdateSession }}>
        <AuthRequiredContext.Provider value={{ showAuthPrompt, setShowAuthPrompt }}>
          {session.isLoading && <LoadingFix />}
          <Router />
          <AuthRequiredDialog />
          <Toaster />
        </AuthRequiredContext.Provider>
      </UserContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
