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
  
  // Ultra-simple authentication check
  useEffect(() => {
    // Define the auth check function
    async function checkAuthStatus() {
      try {
        // Simple fetch with all proper headers
        const response = await fetch(API_ROUTES.auth.me, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          // Successful auth
          const data = await response.json();
          console.log("Auth success:", data.user?.username);
          
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
        } else if (response.status === 401) {
          // Not authenticated
          console.log("Not authenticated");
          
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
          // Server error
          console.warn("Auth check server error:", response.status);
          
          // Just mark as not loading, preserve other state
          setSession(prev => ({
            ...prev,
            isLoading: false
          }));
        }
      } catch (error) {
        console.error("Auth check fetch error:", error);
        setSession(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    }
    
    // Check immediately
    checkAuthStatus();
    
    // Set up interval check
    const intervalId = window.setInterval(checkAuthStatus, 3000);
    setAuthCheckTimer(intervalId);
    
    // Cleanup when component unmounts
    return () => {
      if (authCheckTimer) {
        window.clearInterval(authCheckTimer);
      }
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
