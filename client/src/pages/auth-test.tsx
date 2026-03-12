import { useState, useEffect, useContext } from "react";
import { UserContext } from "../App";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";
import { SubscriptionTier } from "@shared/schema";

export default function AuthTest() {
  const { session, setSession } = useContext(UserContext);
  const [tokenFromStorage, setTokenFromStorage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for JWT token in localStorage
    const token = localStorage.getItem('jwt_token');
    setTokenFromStorage(token);
  }, []);
  
  const checkTestAuth = async () => {
    try {
      const response = await fetch('/test-auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestResult(data);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const testDirectLogin = async () => {
    try {
      window.location.href = '/test-auth/login';
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const checkAuthMe = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestResult(data);
      
      // Update the global user session
      if (data.user) {
        setSession({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          tier: data.user.subscriptionTier,
          usage: {
            current: data.user.monthlyUsage || 0,
            limit: data.usageLimit || 3,
            resetDate: data.user.usageResetDate || new Date().toISOString(),
          },
          refillPackCredits: data.user.refillPackCredits || 0,
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const clearToken = () => {
    localStorage.removeItem('jwt_token');
    setTokenFromStorage(null);
    
    // Reset session
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
    
    // Clear result
    setTestResult(null);
  };
  
  return (
    <div className="container max-w-4xl py-10">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
          <CardDescription>
            Use this page to test and debug authentication functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <h2 className="text-lg font-semibold">Current Session State:</h2>
            <div className="bg-muted p-4 rounded-md overflow-auto">
              <pre>{JSON.stringify(session, null, 2)}</pre>
            </div>
          </div>
          
          <div className="grid gap-2">
            <h2 className="text-lg font-semibold">JWT Token in localStorage:</h2>
            {tokenFromStorage ? (
              <div className="bg-muted p-4 rounded-md break-all">
                <p className="text-sm font-mono">{tokenFromStorage}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No token found in localStorage</p>
            )}
          </div>
          
          {testResult && (
            <div className="grid gap-2">
              <h2 className="text-lg font-semibold">Test Result:</h2>
              <div className="bg-muted p-4 rounded-md overflow-auto">
                <pre>{JSON.stringify(testResult, null, 2)}</pre>
              </div>
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={checkTestAuth}>
            Check Test Auth
          </Button>
          <Button onClick={checkAuthMe}>
            Check /api/auth/me
          </Button>
          <Button onClick={testDirectLogin} variant="secondary">
            Test Direct Login
          </Button>
          {tokenFromStorage && (
            <Button onClick={clearToken} variant="destructive">
              Clear Token
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}