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
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { setSession } = useContext(UserContext);
  const [, navigate] = useLocation();
  const [showRegister, setShowRegister] = useState(false);

  // Use the appropriate schema based on whether we're showing the register form
  const currentSchema = showRegister ? registerSchema : loginSchema;
  
  // Form with dynamic schema resolution
  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: showRegister 
      ? {
          username: "",
          email: "",
          password: "",
        }
      : {
          email: "",
          password: "",
          rememberMe: false,
        },
  });

  // Type-safe onSubmit that handles both login and register forms
  const onSubmit = async (values: any) => {
    setIsLoading(true);
    try {
      // Choose the endpoint based on whether we're registering or logging in
      const endpoint = showRegister ? API_ROUTES.auth.register : API_ROUTES.auth.login;
      
      // Prepare the data we'll send to the server
      const requestData = showRegister 
        ? {
            username: values.username,
            email: values.email,
            password: values.password
          }
        : {
            email: values.email,
            password: values.password
          };
      
      // Make the API request
      const response = await apiRequest("POST", endpoint, requestData);
      const data = await response.json();
      
      // Set the session with the user data
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
            {showRegister ? "Create an Account" : "Sign In"}
          </DialogTitle>
          <DialogDescription>
            {showRegister
              ? "Join to get more LaTeX generations and premium features"
              : "Enter your credentials to access your account"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Username field - only show when registering */}
            {showRegister && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="yourname"
                        type="text"
                        autoComplete="username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
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
