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
      const response = await apiRequest("POST", API_ROUTES.auth.login, {
        email: values.email,
        password: values.password,
      });
      
      const data = await response.json();
      
      setSession({
        user: data.user,
        isAuthenticated: true,
        tier: data.user.subscriptionTier,
        usage: {
          current: data.user.monthlyUsage,
          limit: data.usageLimit,
          resetDate: data.user.usageResetDate,
        },
      });
      
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
