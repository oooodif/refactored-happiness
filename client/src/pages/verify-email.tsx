import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Mail, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { API_ROUTES } from "@/lib/constants";

enum VerificationState {
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
  TOKEN_EXPIRED = "token_expired"
}

export default function VerifyEmail() {
  const [state, setState] = useState<VerificationState>(VerificationState.LOADING);
  const [message, setMessage] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isResending, setIsResending] = useState<boolean>(false);
  const [, setLocation] = useLocation();
  const search = useSearch();
  
  // Extract token from URL query parameters
  const params = new URLSearchParams(search);
  const token = params.get("token");
  
  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true);
    try {
      const response = await fetch(`${API_ROUTES.auth.resendVerification}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage("A new verification email has been sent.");
      } else {
        setMessage(data.message || "Failed to send verification email. Please try again.");
      }
    } catch (error) {
      console.error("Error resending verification:", error);
      setMessage("An unexpected error occurred. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };
  
  // Verify the token when component mounts
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setState(VerificationState.ERROR);
        setMessage("No verification token provided.");
        return;
      }
      
      try {
        const response = await fetch(`${API_ROUTES.auth.verifyEmail}?token=${token}`);
        const data = await response.json();
        
        if (data.success) {
          setState(VerificationState.SUCCESS);
          setMessage(data.message || "Your email has been verified successfully!");
          if (data.user?.email) {
            setEmail(data.user.email);
          }
        } else {
          if (data.tokenExpired) {
            setState(VerificationState.TOKEN_EXPIRED);
            setMessage(data.message || "Verification token has expired.");
            if (data.email) {
              setEmail(data.email);
            }
          } else {
            setState(VerificationState.ERROR);
            setMessage(data.message || "Email verification failed.");
          }
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setState(VerificationState.ERROR);
        setMessage("An unexpected error occurred during verification.");
      }
    };
    
    verifyToken();
  }, [token]);
  
  const goToLogin = () => {
    setLocation("/login");
  };
  
  const renderContent = () => {
    switch (state) {
      case VerificationState.LOADING:
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-center text-lg">Verifying your email address...</p>
          </div>
        );
        
      case VerificationState.SUCCESS:
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-green-50 p-3 rounded-full">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <CardTitle className="text-center text-xl">Email Verified!</CardTitle>
              <CardDescription className="text-center text-base mt-1">
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Your account has been successfully verified. You can now log in and enjoy the full features of LaTeX Generator.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button onClick={goToLogin} className="w-full">
                Go to Login
              </Button>
            </CardFooter>
          </Card>
        );
        
      case VerificationState.TOKEN_EXPIRED:
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-amber-50 p-3 rounded-full">
                  <AlertTriangle className="h-10 w-10 text-amber-500" />
                </div>
              </div>
              <CardTitle className="text-center text-xl">Verification Link Expired</CardTitle>
              <CardDescription className="text-center text-base mt-1">
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                The verification link has expired. Please request a new verification email.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                onClick={handleResendVerification} 
                className="w-full"
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
            </CardFooter>
          </Card>
        );
        
      case VerificationState.ERROR:
      default:
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-red-50 p-3 rounded-full">
                  <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
              </div>
              <CardTitle className="text-center text-xl">Verification Failed</CardTitle>
              <CardDescription className="text-center text-base mt-1">
                {message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                There was a problem verifying your email address. Please try again or contact support.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center flex-col gap-2">
              <Button onClick={goToLogin} className="w-full">
                Go to Login
              </Button>
              {email && (
                <Button 
                  onClick={handleResendVerification} 
                  variant="outline"
                  className="w-full"
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Verification Email"
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        );
    }
  };
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      {renderContent()}
    </div>
  );
}