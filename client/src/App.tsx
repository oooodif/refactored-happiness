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

// User context
import { UserSession } from "./lib/types";
import { SubscriptionTier } from "@shared/schema";
import { API_ROUTES } from "./lib/constants";
import ProtectedRoute from "./lib/protected-route";

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

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/account" component={Account} />
      <ProtectedRoute path="/subscribe" component={Subscribe} />
      <ProtectedRoute path="/history" component={DocumentHistory} />
      
      {/* 404 page */}
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
        <Router />
        <Toaster />
      </UserContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
