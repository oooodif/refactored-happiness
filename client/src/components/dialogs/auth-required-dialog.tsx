import { useContext, useEffect, useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  // Sync the local state with the context state
  useEffect(() => {
    console.log("Auth dialog context state changed:", showAuthPrompt);
    setOpen(showAuthPrompt);
  }, [showAuthPrompt]);

  // When local state changes, update the context
  useEffect(() => {
    if (open !== showAuthPrompt) {
      console.log("Updating context state from local:", open);
      setShowAuthPrompt(open);
    }
  }, [open, setShowAuthPrompt, showAuthPrompt]);

  // Debug effect to monitor dialog visibility
  useEffect(() => {
    console.log(`Auth dialog is now ${open ? 'OPEN' : 'CLOSED'}`);
  }, [open]);

  const handleSignUp = () => {
    console.log("Sign up clicked");
    setOpen(false);
    navigate('/register');
  };

  const handleLogin = () => {
    console.log("Login clicked");
    setOpen(false);
    navigate('/login');
  };

  const handleClose = () => {
    console.log("Dialog closed");
    setOpen(false);
  };

  console.log("Auth dialog render:", { contextState: showAuthPrompt, localState: open });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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