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
  
  // State for auth prompt modal
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  
  console.log("Auth prompt state:", showAuthPrompt);

  useEffect(() => {
    // Check if user is logged in
    async function checkAuthStatus() {
      try {
        // Use standard fetch with proper credentials
        const response = await fetch(API_ROUTES.auth.me, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.user) {
            console.log("Authentication successful, user:", data.user.username);
            
            // Successfully authenticated - set the session data
            setSession({
              user: data.user,
              isAuthenticated: true,
              isLoading: false,
              tier: data.user.subscriptionTier || SubscriptionTier.Free,
              usage: {
                current: data.user.monthlyUsage || 0,
                limit: data.usageLimit || 3,
                resetDate: data.user.usageResetDate || new Date().toISOString(),
              },
              refillPackCredits: data.user.refillPackCredits || 0,
            });
            
            // IMPORTANT: Set a cookie directly in case the server cookie isn't working
            // This is a backup to keep track of login state client-side
            document.cookie = `userLoggedIn=true; path=/; max-age=${30*24*60*60}`;
            localStorage.setItem('userLoggedIn', 'true');
          }
        } else {
          setSession(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            user: null
          }));
        }
      } catch (err: any) {
        console.error("Auth check error:", err);
        setSession(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null
        }));
      }
    }
    
    // Check for backup login indicators
    const hasBackupCookie = document.cookie.includes('userLoggedIn=true');
    const hasLocalStorage = localStorage.getItem('userLoggedIn') === 'true';
    
    // If we have a backup indicator but aren't currently authenticated, force a check
    if ((hasBackupCookie || hasLocalStorage) && !session.isAuthenticated && !session.isLoading) {
      console.log("Backup login state detected, rechecking authentication");
    }
    
    // Always check authentication on load
    checkAuthStatus();
    
    // Set up a refresh interval to periodically verify auth status
    const refreshInterval = setInterval(checkAuthStatus, 60000); // Check every minute
    
    return () => clearInterval(refreshInterval);
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
