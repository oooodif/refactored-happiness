import { useContext, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AuthRequiredContext } from '@/App';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function AuthRequiredDialog() {
  const { showAuthPrompt, setShowAuthPrompt } = useContext(AuthRequiredContext);
  const [, navigate] = useLocation();

  // Reset dialog state if context is not controlling it
  useEffect(() => {
    // This log remains to help debug if needed in the future
    console.log("Auth dialog rendered, current state:", showAuthPrompt);
  }, [showAuthPrompt]);

  const handleSignUp = () => {
    setShowAuthPrompt(false);
    // Use our login modal with register tab instead of separate page
    // This helps with consistent session handling
    const loginModal = document.getElementById('login-modal-trigger');
    if (loginModal) {
      (loginModal as HTMLButtonElement).click();
    } else {
      // Fallback to the register page if we can't find the login modal trigger
      navigate('/register');
    }
  };

  const handleLogin = () => {
    setShowAuthPrompt(false);
    // Use our login modal instead of separate page
    // This helps with consistent session handling
    const loginModal = document.getElementById('login-modal-trigger');
    if (loginModal) {
      (loginModal as HTMLButtonElement).click();
    } else {
      // Fallback to the login page if we can't find the login modal trigger
      navigate('/login');
    }
  };

  const handleClose = () => {
    setShowAuthPrompt(false);
  };

  // Only use the context state, no local state
  return (
    <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Required</DialogTitle>
          <DialogDescription>
            Create an account to generate and download LaTeX documents. Free accounts include 3 generations per month.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 py-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="mb-2 font-medium">Why create an account?</h3>
            <ul className="ml-4 list-disc text-sm space-y-1">
              <li>Save your generated documents for future reference</li>
              <li>Get 3 free generations per month</li>
              <li>Unlock powerful features with paid plans</li>
              <li>Support the development of this tool</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="sm:w-auto w-full order-1 sm:order-none"
          >
            Maybe Later
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={handleLogin}
              className="flex-1 sm:flex-auto"
            >
              Log In
            </Button>
            <Button 
              onClick={handleSignUp}
              className="flex-1 sm:flex-auto"
            >
              Create Account
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}