import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserContext } from "@/App";
import { useLocation } from "wouter";
import { API_ROUTES } from "@/lib/constants";
import { LoginCredentials, SubscriptionTier } from "@shared/schema";
import { Loader2, Mail, AlertCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Form schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().default(false),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const { toast } = useToast();
  const { setSession } = useContext(UserContext);
  const [, navigate] = useLocation();
  const [showRegister, setShowRegister] = useState(false);

  // We need separate forms for register and login due to type issues
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false
    }
  });
  
  // Use the appropriate form based on whether we're showing the register form
  const form = showRegister ? registerForm : loginForm;

  // Handles resending verification email
  const handleResendVerification = async () => {
    if (!verificationEmail) return;
    
    setIsResendingVerification(true);
    try {
      const response = await apiRequest("POST", API_ROUTES.auth.resendVerification, { 
        email: verificationEmail 
      });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Verification Email Sent",
          description: "Please check your inbox for the verification link",
        });
      } else {
        toast({
          title: "Failed to Resend",
          description: data.message || "Please try again later",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend verification error:", error);
      toast({
        title: "Failed to Resend",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Type-safe onSubmit that handles both login and register forms
  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      // Reset verification state
      setRequiresVerification(false);
      
      // Choose the endpoint based on whether we're registering or logging in
      const endpoint = showRegister ? API_ROUTES.auth.register : API_ROUTES.auth.login;
      
      // Prepare the data we'll send to the server
      const requestData = showRegister 
        ? {
            username: values.email, // Use email as username
            email: values.email,
            password: values.password
          }
        : {
            email: values.email,
            password: values.password
          };
      
      // Make the API request
      const response = await apiRequest("POST", endpoint, requestData);
      
      // Check for 403 status which might indicate email verification needed
      if (response.status === 403) {
        const data = await response.json();
        
        if (data.requiresEmailVerification) {
          // Store the email for resend functionality
          setVerificationEmail(values.email);
          setRequiresVerification(true);
          return;
        }
      }
      
      const data = await response.json();
      
      // If registration was successful but email verification is pending
      if (showRegister && data.emailVerificationSent === false) {
        toast({
          title: "Account Created",
          description: "However, we couldn't send the verification email. Please try again later.",
          variant: "destructive",
        });
      }
      
      // If registration was successful with email verification
      if (showRegister && data.emailVerificationSent === true) {
        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
        });
        
        // Store the email for resend functionality
        setVerificationEmail(values.email);
        setRequiresVerification(true);
        return;
      }
      
      // Set the session with the user data for successful login
      setSession({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        tier: data.user.subscriptionTier || SubscriptionTier.Free,
        usage: {
          current: data.user.monthlyUsage || 0,
          limit: data.usageLimit || 3,
          resetDate: data.user.usageResetDate || new Date().toISOString(),
        },
        refillPackCredits: data.user.refillPackCredits || 0,
      });
      
      // Show a success message
      toast({
        title: showRegister ? "Account Created!" : "Welcome back!",
        description: showRegister 
          ? "Your account has been created successfully." 
          : "You have successfully logged in.",
      });
      
      // Close the modal and navigate to the home page
      onClose();
      navigate("/");
    } catch (error) {
      console.error(showRegister ? "Registration error:" : "Login error:", error);
      toast({
        title: showRegister ? "Registration failed" : "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRegister = () => {
    form.reset();
    setShowRegister(!showRegister);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {requiresVerification 
              ? "Email Verification Required" 
              : showRegister 
                ? "Create an Account" 
                : "Sign In"
            }
          </DialogTitle>
          <DialogDescription>
            {requiresVerification
              ? "Please verify your email address to continue"
              : showRegister
                ? "Join to get more LaTeX generations and premium features"
                : "Enter your credentials to access your account"
            }
          </DialogDescription>
        </DialogHeader>

        {requiresVerification ? (
          <div className="py-6 space-y-4">
            <div className="flex flex-col items-center justify-center text-center space-y-3">
              <div className="bg-blue-50 p-3 rounded-full">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-medium text-lg">Check your email</h3>
                <p className="text-sm text-gray-500 mt-1">
                  We sent a verification link to <span className="font-medium">{verificationEmail}</span>
                </p>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>Didn't receive the email? Check your spam folder or</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={handleResendVerification}
                  disabled={isResendingVerification}
                >
                  {isResendingVerification ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend verification email"
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          type="password"
                          autoComplete={showRegister ? "new-password" : "current-password"}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!showRegister && (
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              id="remember"
                            />
                          </FormControl>
                          <label
                            htmlFor="remember"
                            className="text-sm text-gray-700"
                          >
                            Remember me
                          </label>
                        </FormItem>
                      )}
                    />
                    <Button variant="link" className="p-0 h-auto text-sm">
                      Forgot password?
                    </Button>
                  </div>
                )}

                <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-0">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      showRegister ? "Create Account" : "Sign In"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>

            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">
                {showRegister ? "Already have an account?" : "Don't have an account?"}
              </span>
              <Button
                variant="link"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 p-0 h-auto ml-1"
                onClick={toggleRegister}
              >
                {showRegister ? "Sign in" : "Create one"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
