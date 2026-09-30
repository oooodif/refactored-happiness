import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { useState, useEffect } from "react";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Account from "@/pages/account";
import Subscribe from "@/pages/subscribe";
import DocumentHistory from "@/pages/document-history";
import NotFound from "@/pages/not-found";

// Components
import AuthRequiredDialog from "@/components/dialogs/auth-required-dialog";

// User context
import { UserSession } from "./lib/types";
import { SubscriptionTier } from "@shared/schema";
import { API_ROUTES } from "./lib/constants";

// Create a context to share user session data
import { createContext } from "react";
export const UserContext = createContext<{
  session: UserSession;
  setSession: React.Dispatch<React.SetStateAction<UserSession>>;
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
      <Route path="/history" component={DocumentHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialize with a loading session
  const [session, setSession] = useState<UserSession>({
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
  });
  
  // Auth prompt modal state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  // Cleanup function to ensure we clear timers
  const [authCheckTimer, setAuthCheckTimer] = useState<number | null>(null);
  
  // Add a debug effect to log relevant factors (window.fetch available, etc.)
  useEffect(() => {
    console.log("Debug info:", {
      fetchAvailable: typeof window.fetch === 'function',
      localStorage: typeof localStorage !== 'undefined',
      apiAuthMe: API_ROUTES.auth.me
    });
  }, []);

  // Immediately mark the auth check as started
  useEffect(() => {
    console.log("AUTH CHECK STARTED");
    
    // Function to check auth status
    async function checkAuthStatus() {
      try {
        console.log("AUTH CHECK RUNNING");
        
        // Make the fetch with specific no-cache headers
        const response = await fetch(API_ROUTES.auth.me, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        console.log("AUTH CHECK STATUS:", response.status);
        
        if (response.ok) {
          // Successful auth response
          const data = await response.json();
          console.log("AUTH SUCCESS:", data.user?.username);
          
          // Update user session state
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
        } else if (response.status === 401) {
          console.log("USER NOT AUTHENTICATED");
          
          // Reset to unauthenticated state
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
        } else {
          console.warn("AUTH CHECK ERROR:", response.status);
          setSession(prev => ({...prev, isLoading: false}));
        }
      } catch (error) {
        console.error("AUTH CHECK EXCEPTION:", error);
        setSession(prev => ({...prev, isLoading: false}));
      }
    }
    
    // Run immediately and set up interval
    checkAuthStatus();
    
    // Use a more reliable interval setup
    const intervalId = window.setInterval(checkAuthStatus, 2000);
    setAuthCheckTimer(intervalId);
    
    // Proper cleanup
    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ session, setSession }}>
        <AuthRequiredContext.Provider value={{ showAuthPrompt, setShowAuthPrompt }}>
          <Router />
          <AuthRequiredDialog />
          <Toaster />
        </AuthRequiredContext.Provider>
      </UserContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
