import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserContext } from "@/App";
import { useLocation } from "wouter";
import { API_ROUTES } from "@/lib/constants";
import { LoginCredentials } from "@shared/schema";

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

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setSession } = useContext(UserContext);
  const [, navigate] = useLocation();
  const [showRegister, setShowRegister] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      // First check if there's already a session with a fetch to /api/auth/me
      const checkSession = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (checkSession.ok) {
        console.log("Already have a valid session");
        const sessionData = await checkSession.json();
        updateSessionState(sessionData);
        onClose();
        return;
      }
      
      // No valid session, proceed with login
      console.log("Attempting login with:", { email: values.email });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      const data = await response.json();
      console.log("Login successful, received data:", data);
      
      updateSessionState(data);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to update session state with consistent formatting
  const updateSessionState = (data: any) => {
    if (!data || !data.user) {
      console.error("Invalid data received:", data);
      return;
    }
    
    console.log("Updating session with:", data);
    
    setSession({
      user: data.user,
      isAuthenticated: true,
      isLoading: false,
      tier: data.user.subscriptionTier || "free",
      usage: {
        current: data.user.monthlyUsage || 0,
        limit: data.usageLimit || 3,
        resetDate: data.user.usageResetDate || new Date().toISOString(),
      },
      refillPackCredits: data.user.refillPackCredits || 0,
    });
  };

  const toggleRegister = () => {
    form.reset();
    setShowRegister(!showRegister);
  };

  // Handle registration
  const handleRegister = async (values: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      // No valid session, proceed with registration
      console.log("Attempting registration with:", { email: values.email });
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.email.split('@')[0], // Default username from email
          email: values.email,
          password: values.password,
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      const data = await response.json();
      console.log("Registration successful, received data:", data);
      
      updateSessionState(data);
      
      toast({
        title: "Account created!",
        description: "You have successfully created an account.",
      });
      
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {showRegister ? "Create an Account" : "Sign In"}
          </DialogTitle>
          <DialogDescription>
            {showRegister
              ? "Join to get more LaTeX generations and premium features"
              : "Enter your credentials to access your account"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(showRegister ? handleRegister : onSubmit)} 
            className="space-y-4"
          >
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
                {isLoading ? "Processing..." : showRegister ? "Create Account" : "Sign In"}
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
      </DialogContent>
    </Dialog>
  );
}
