import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { API_ROUTES } from '@/lib/constants';

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token from URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link. No token provided.');
          return;
        }
        
        // Call verification endpoint
        const response = await fetch(`${API_ROUTES.auth.verifyEmail}?token=${token}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify your email address. The token may be invalid or expired.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email address. Please try again later.');
      }
    };
    
    verifyEmail();
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Email Verification'}
            {status === 'success' && 'Verification Successful'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'loading' && 'Please wait while we verify your email address'}
            {status === 'success' && 'Your account is now activated'}
            {status === 'error' && 'We encountered a problem with your verification'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="mt-4 text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <p className="mt-4 text-gray-600">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <p className="mt-4 text-gray-600">{message}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === 'success' && (
            <Button onClick={() => setLocation('/')}>
              Go to Dashboard
            </Button>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col space-y-2 w-full">
              <Button variant="default" onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Link href="/" className="text-center">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}