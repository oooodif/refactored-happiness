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
    fetch(API_ROUTES.auth.me, { credentials: "include" })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Not authenticated");
      })
      .then((data) => {
        setSession({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          tier: data.user.subscriptionTier,
          usage: {
            current: data.user.monthlyUsage,
            limit: data.usageLimit,
            resetDate: data.user.usageResetDate,
          },
          refillPackCredits: data.user.refillPackCredits || 0,
        });
      })
      .catch((err) => {
        console.log("Not logged in:", err.message);
        setSession(prev => ({
          ...prev,
          isLoading: false
        }));
      });
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
