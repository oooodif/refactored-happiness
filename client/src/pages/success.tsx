import { useEffect, useState, useContext } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserContext } from "@/App";
import SiteLayout from "@/components/layout/site-layout";
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const sessionId = params.get('session_id');
  const { checkAndUpdateSession } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Refresh user session to get updated subscription info
    const updateUserInfo = async () => {
      try {
        await checkAndUpdateSession();
        setIsLoading(false);
      } catch (error) {
        console.error('Error refreshing session:', error);
        setIsLoading(false);
      }
    };

    if (sessionId) {
      updateUserInfo();
    } else {
      setIsLoading(false);
    }
  }, [sessionId, checkAndUpdateSession]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="ml-2">Processing your payment...</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Thank you for your purchase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-gray-700">
              Your subscription has been activated. You now have access to additional features and increased generation limits.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/account')}
                variant="outline"
              >
                View Account
              </Button>
              <Button onClick={() => navigate('/')}>
                Start Generating
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  );
}