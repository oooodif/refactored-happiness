import { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserContext } from "@/App";
import { useLocation } from "wouter";
import { API_ROUTES } from "@/lib/constants";
import { SubscriptionTier } from "@shared/schema";
import SiteLayout from "@/components/layout/site-layout";

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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

// Form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { session, setSession } = useContext(UserContext);
  const [, navigate] = useLocation();

  // Track if we've modified the page to prevent auto-redirects
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Add SEO enhancement for register page
  useEffect(() => {
    // Update page title and meta description
    document.title = "Create Account - AI LaTeX Generator";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        "Create your AI LaTeX Generator account. Sign up to generate LaTeX documents, academic papers, and presentations with AI assistance.");
    }
  }, []);
  
  // Only redirect if already logged in - but don't auto-redirect on page load
  useEffect(() => {
    // Don't redirect if user has interacted with the page
    if (hasInteracted) return;
    
    // Only redirect after auth check is complete and user is authenticated
    if (!session.isLoading && session.isAuthenticated) {
      // Show a toast instead of immediately redirecting
      toast({
        title: "Already logged in",
        description: "You're already signed in to your account."
      });
      
      // Allow user to stay on the page and don't automatically redirect
      setHasInteracted(true);
    }
  }, [session.isLoading, session.isAuthenticated, navigate, hasInteracted, toast]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    // Mark that the user has interacted with the page
    setHasInteracted(true);
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", API_ROUTES.auth.register, {
        username: values.username,
        email: values.email,
        password: values.password,
      });
      
      const data = await response.json();
      
      if (!data.user) {
        throw new Error("Registration failed: Invalid response from server");
      }
      
      setSession({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        tier: data.user.subscriptionTier || SubscriptionTier.Free,
        usage: {
          current: data.user.monthlyUsage || 0,
          limit: data.usageLimit || 3,
          resetDate: data.user.usageResetDate || null,
        },
        refillPackCredits: data.user.refillPackCredits || 0,
      });
      
      toast({
        title: "Account created",
        description: "Your account has been successfully created.",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SiteLayout fullHeight={false} seoTitle="Register for AI LaTeX Generator - Create an Account">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>
                Join to get more LaTeX generations and premium features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="johndoe"
                            autoComplete="username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          At least 8 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="••••••••"
                            type="password"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <div className="text-center">
                <span className="text-sm text-gray-600">
                  Already have an account?
                </span>
                <Link href="/login">
                  <a className="text-sm font-medium text-blue-600 hover:text-blue-500 ml-1">
                    Sign in
                  </a>
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}
