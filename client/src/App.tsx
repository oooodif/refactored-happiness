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
    // Simple, direct authentication check
    async function checkAuthStatus() {
      try {
        console.log("Checking authentication status...");
        
        // Set loading state
        setSession(prev => ({
          ...prev,
          isLoading: true
        }));
        
        // Direct server check using XMLHttpRequest for maximum compatibility
        const xhr = new XMLHttpRequest();
        xhr.open('GET', API_ROUTES.auth.me, true);
        xhr.withCredentials = true;
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Cache-Control', 'no-cache');
        
        xhr.onload = function() {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              
              if (data.user) {
                console.log("User authenticated:", data.user.username);
                
                // Set session data
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
              }
            } catch (e) {
              console.error("Error parsing auth response:", e);
              setSession(prev => ({
                ...prev,
                isAuthenticated: false,
                isLoading: false,
                user: null
              }));
            }
          } else if (xhr.status === 401) {
            // Not authenticated
            console.log("User not authenticated");
            setSession(prev => ({
              ...prev,
              isAuthenticated: false,
              isLoading: false,
              user: null
            }));
          } else {
            // Other error
            console.warn("Auth check error:", xhr.status);
            setSession(prev => ({
              ...prev,
              isLoading: false
            }));
          }
        };
        
        xhr.onerror = function() {
          console.error("Network error during auth check");
          setSession(prev => ({
            ...prev,
            isLoading: false
          }));
        };
        
        xhr.send();
      } catch (err) {
        console.error("Auth check error:", err);
        setSession(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    }
    
    // Check on load
    checkAuthStatus();
    
    // Check every 5 seconds
    const refreshInterval = setInterval(checkAuthStatus, 5000);
    
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
