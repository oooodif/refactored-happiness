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
import DirectLogin from "@/pages/direct-login";
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

// Import auth test page
import AuthTest from "@/pages/auth-test";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/direct-login" component={DirectLogin} />
      <Route path="/register" component={Register} />
      <Route path="/account" component={Account} />
      <Route path="/subscribe" component={Subscribe} />
      <Route path="/history" component={DocumentHistory} />
      <Route path="/auth-test" component={AuthTest} />
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
        console.log("Checking authentication status...");
        
        // Get JWT token if it exists in localStorage
        const token = localStorage.getItem('jwt_token');
        
        // Prepare headers
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        };
        
        // Add JWT token if it exists
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          console.log("Including JWT token in auth check");
        } else {
          console.log("No JWT token found in localStorage");
        }
        
        // Using fetch with credentials included for session cookies
        // and headers for JWT token
        const response = await fetch('/api/auth/me', { 
          method: 'GET',
          credentials: "include", // For backward compatibility with session cookies
          headers
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log("User not authenticated");
            // If token exists but auth failed, clear it
            if (token) {
              console.log("Clearing invalid JWT token");
              localStorage.removeItem('jwt_token');
            }
          } else if (response.status === 404) {
            console.log("User not found - may have been deleted");
          } else {
            console.log(`Auth check failed with status: ${response.status}`);
          }
          throw new Error(`Not authenticated: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Authentication successful:", data);
        
        if (!data.user) {
          throw new Error("User data not found in response");
        }
        
        // Successfully authenticated
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
      } catch (err: any) {
        console.log("Not logged in:", err.message);
        setSession(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          user: null,
          tier: SubscriptionTier.Free,
        }));
      }
    }
    
    // Call immediately
    checkAuthStatus();
    
    // Set up a periodic check every 30 seconds to keep session fresh
    const interval = setInterval(checkAuthStatus, 30000);
    
    return () => clearInterval(interval);
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
