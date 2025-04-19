import { useContext } from "react";
import { Route, Redirect } from "wouter";
import { UserContext } from "@/App";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export default function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { session } = useContext(UserContext);
  
  // Check if auth state is still loading
  if (!session.user && session.isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }
  
  // If user is not authenticated, redirect to login
  if (!session.user && !session.isLoading) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }
  
  // User is authenticated, render the protected component
  return <Route path={path} component={Component} />;
}