import { Switch, Route } from "wouter";
import {
  Suspense,
  lazy,
  useState,
  useEffect,
  useCallback,
  createContext,
} from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient, checkAuthStatus } from "./lib/queryClient";
import AuthRequiredDialog from "@/components/dialogs/auth-required-dialog";
import { UserSession } from "./lib/types";
import { SubscriptionTier } from "@shared/schema";
import { API_ROUTES } from "./lib/constants";

// Lazy-loaded pages
const Home = lazy(() => import("@/pages/home"));
const Login = lazy(() => import("@/pages/login"));
const Register = lazy(() => import("@/pages/register"));
const Account = lazy(() => import("@/pages/account"));
const Subscribe = lazy(() => import("@/pages/subscribe"));
const DocumentHistory = lazy(() => import("@/pages/document-history"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Contexts
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

export const AuthRequiredContext = createContext<{
  showAuthPrompt: boolean;
  setShowAuthPrompt: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  showAuthPrompt: false,
  setShowAuthPrompt: () => {},
});

function Router() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/account" component={Account} />
        <Route path="/subscribe" component={Subscribe} />
        <Route path="/history" component={DocumentHistory} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
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

  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const checkAndUpdateSession = useCallback(async () => {
    try {
      console.log("MANUAL SESSION CHECK TRIGGERED");
      const authData = await checkAuthStatus();

      if (authData.isAuthenticated && authData.user) {
        console.log("SESSION CHECK SUCCESS:", authData.user.username);
        setSession({
          user: authData.user,
          isAuthenticated: true,
          isLoading: false,
          tier: authData.user.subscriptionTier || SubscriptionTier.Free,
          usage: {
            current: authData.user.monthlyUsage || 0,
            limit: authData.usageLimit || 3,
            resetDate: authData.user.usageResetDate || new Date().toISOString(),
          },
          refillPackCredits: authData.user.refillPackCredits || 0,
        });
        return;
      }

      console.log("SESSION CHECK - NOT AUTHENTICATED");
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
    } catch (error) {
      console.error("SESSION CHECK ERROR:", error);
      setSession((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("Page became visible, checking auth status");
        checkAndUpdateSession();
      }
    };

    const handleFocus = () => {
      console.log("Window focused, checking auth status");
      checkAndUpdateSession();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAndUpdateSession]);

  useEffect(() => {
    console.log("Debug info:", {
      fetchAvailable: typeof window.fetch === "function",
      localStorage: typeof localStorage !== "undefined",
      apiAuthMe: API_ROUTES.auth.me,
    });
  }, []);

  useEffect(() => {
    console.log("INITIAL AUTH CHECK STARTED");
    checkAndUpdateSession();
    const intervalId = window.setInterval(checkAndUpdateSession, 10000);
    return () => window.clearInterval(intervalId);
  }, [checkAndUpdateSession]);

  return (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider
        value={{ session, setSession, checkAndUpdateSession }}
      >
        <AuthRequiredContext.Provider
          value={{ showAuthPrompt, setShowAuthPrompt }}
        >
          <Router />
          <AuthRequiredDialog />
          <Toaster />
        </AuthRequiredContext.Provider>
      </UserContext.Provider>
    </QueryClientProvider>
  );
}

export default App;
