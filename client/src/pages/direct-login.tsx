import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserContext } from '@/App';
import { useContext } from 'react';

export default function DirectLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { setSession } = useContext(UserContext);

  // Perform the login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use native fetch for guaranteed credentials inclusion
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const userData = await response.json();
      console.log('Login successful:', userData);
      
      // Store JWT token in localStorage if it exists
      if (userData.token) {
        console.log('Storing JWT token in localStorage');
        localStorage.setItem('jwt_token', userData.token);
      } else {
        console.warn('No JWT token received from server');
      }
      
      // Update session data
      setSession({
        user: userData.user,
        isAuthenticated: true,
        isLoading: false,
        tier: userData.user.subscriptionTier,
        usage: {
          current: userData.user.monthlyUsage || 0,
          limit: userData.usageLimit || 3,
          resetDate: userData.user.usageResetDate || new Date().toISOString(),
        },
        refillPackCredits: userData.user.refillPackCredits || 0,
      });

      // Force a complete page reload to ensure session is recognized
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: err.message || 'Invalid email or password',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Direct Login</CardTitle>
          <CardDescription>
            Log in to access your AI LaTeX Generator account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleLogin}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <span className="text-sm text-gray-500">
            Having trouble? Try resetting your browser cache.
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}