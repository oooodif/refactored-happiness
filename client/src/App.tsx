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
    // Enhanced authentication check
    async function checkAuthStatus() {
      try {
        console.log("Checking authentication status...");
        
        // Try backup auth first for immediate feedback
        const hasBackupCookie = document.cookie.includes('userLoggedIn=true');
        const hasLocalStorage = localStorage.getItem('userLoggedIn') === 'true';
        const hasSessionStorage = sessionStorage.getItem('userLoggedIn') === 'true';
        
        if ((hasBackupCookie || hasLocalStorage || hasSessionStorage) && !session.isAuthenticated) {
          console.log("Backup login state detected, using temporary session while validating");
          
          // Load stored user data if available
          const savedUser = localStorage.getItem('userData');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setSession({
                user: parsedUser,
                isAuthenticated: true,
                isLoading: true, // Still loading from server
                tier: parsedUser.subscriptionTier || SubscriptionTier.Free,
                usage: {
                  current: parsedUser.monthlyUsage || 0,
                  limit: parsedUser.usageLimit || 3,
                  resetDate: parsedUser.usageResetDate || new Date().toISOString(),
                },
                refillPackCredits: parsedUser.refillPackCredits || 0,
              });
            } catch (e) {
              console.error("Error parsing saved user data:", e);
            }
          }
        }
        
        // Always verify with server
        const response = await fetch(API_ROUTES.auth.me, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          // Force fetch to bypass cache
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.user) {
            console.log("Authentication successful, server confirmed user:", data.user.username);
            
            // Store the user data for backup
            localStorage.setItem('userData', JSON.stringify(data.user));
            
            // Successfully authenticated - set the session data from server
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
            
            // Set all backup login indicators
            document.cookie = `userLoggedIn=true; path=/; max-age=${30*24*60*60}`;
            localStorage.setItem('userLoggedIn', 'true');
            sessionStorage.setItem('userLoggedIn', 'true');
            
            return; // Success - exit early
          }
        }
        
        // Only clear session if we got an explicit 401 Unauthorized
        if (response.status === 401) {
          console.log("Server confirmed user is NOT authenticated");
          
          // Clear all backup indicators
          document.cookie = "userLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
          localStorage.removeItem('userLoggedIn');
          localStorage.removeItem('userData');
          sessionStorage.removeItem('userLoggedIn');
          
          setSession(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            user: null
          }));
        } else if (!response.ok) {
          // Non-401 error, might be temporary server issue
          // Don't clear session in this case
          console.warn(`Auth check server error: ${response.status} ${response.statusText}`);
        }
      } catch (err: any) {
        console.error("Auth check network error:", err);
        // Don't clear session for network errors
      }
    }
    
    // Always check authentication on load
    checkAuthStatus();
    
    // Check auth every 15 seconds - more aggressive to prevent session loss
    const refreshInterval = setInterval(checkAuthStatus, 15000);
    
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
