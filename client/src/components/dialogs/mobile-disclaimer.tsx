import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Flag to enable/disable the mobile disclaimer
// Set to true to activate the feature
const SHOW_MOBILE_DISCLAIMER = false;

export default function MobileDisclaimer() {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    // Only proceed if the feature is enabled
    if (!SHOW_MOBILE_DISCLAIMER) return;
    
    // Check if we're on a mobile device
    const isMobile = (typeof window !== 'undefined') && 
      (window.innerWidth < 768 || 
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    if (isMobile) {
      // Check if user has already dismissed the disclaimer
      const hasSeenDisclaimer = localStorage.getItem("mobile-disclaimer-seen");
      
      if (!hasSeenDisclaimer) {
        setOpen(true);
      }
    }
  }, []);
  
  const handleDismiss = () => {
    // Save to localStorage so we don't show it again
    localStorage.setItem("mobile-disclaimer-seen", "true");
    setOpen(false);
  };
  
  // Don't render anything if not open
  if (!open) return null;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mobile Experience Note</DialogTitle>
          <DialogDescription>
            For the best experience with AI LaTeX Generator
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <ul className="space-y-2 list-disc pl-5">
            <li>This tool works best in landscape orientation on tablets</li>
            <li>For optimal editing, consider using a larger screen</li>
            <li>Your LaTeX documents sync across all your devices</li>
            <li>Use the toolbar buttons for quick LaTeX formatting</li>
          </ul>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleDismiss}
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}