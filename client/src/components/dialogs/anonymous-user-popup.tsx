import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AnonymousUserPopupProps {
  usageRemaining: boolean;
  onClose: () => void;
}

const AnonymousUserPopup: React.FC<AnonymousUserPopupProps> = ({ 
  usageRemaining,
  onClose
}) => {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
            {usageRemaining 
              ? "Welcome to AI LaTeX Generator!" 
              : "You've used your free conversion"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
            {usageRemaining ? (
              <span>
                You're currently using the free anonymous mode which allows for 1 free LaTeX conversion.
              </span>
            ) : (
              <span>
                You've already used your free LaTeX conversion.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 p-4 rounded-md bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-300 text-sm">
            Sign up for an account to access more conversions and premium features including:
          </p>
          <ul className="mt-2 text-blue-700 dark:text-blue-400 text-sm space-y-1 list-disc list-inside">
            <li>Generate more LaTeX documents</li>
            <li>Save your work and access it later</li>
            <li>Advanced formatting options</li>
            <li>PDF download capabilities</li>
          </ul>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Continue as guest
          </Button>
          <Link href="/login">
            <Button 
              className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-blue-500 to-blue-700"
            >
              Sign up or log in
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnonymousUserPopup;