import React from 'react';
import { Link } from 'wouter';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InfoIcon } from 'lucide-react';

interface AnonymousUserBannerProps {
  usageRemaining: boolean;
}

/**
 * Banner shown to anonymous users informing them of their free conversion
 * and encouraging them to sign up for more
 */
export function AnonymousUserBanner({ usageRemaining }: AnonymousUserBannerProps) {
  return (
    <Alert variant={usageRemaining ? "default" : "destructive"} className="mb-4">
      <InfoIcon className="h-4 w-4 mr-2" />
      <AlertTitle className="text-lg font-semibold">
        {usageRemaining 
          ? "Welcome to AI LaTeX Generator!" 
          : "You've used your free conversion"}
      </AlertTitle>
      <AlertDescription className="mt-2">
        {usageRemaining ? (
          <div>
            <p className="mb-2">
              You're currently using the free anonymous mode which allows for 1 free LaTeX conversion.
              Sign up to get more conversions and access to all features!
            </p>
            <div className="flex gap-2 mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href="/auth?tab=register">Create Account</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/auth?tab=login">Login</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-2">
              You've already used your free LaTeX conversion. Sign up now to get 
              more conversions and access to all premium features!
            </p>
            <div className="flex gap-2 mt-3">
              <Button asChild size="sm">
                <Link href="/auth?tab=register">Create Account</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/auth?tab=login">Login</Link>
              </Button>
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default AnonymousUserBanner;