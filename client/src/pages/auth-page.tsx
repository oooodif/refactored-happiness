import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import SiteLayout from "@/components/layout/site-layout";

// Define schemas for login and registration
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { toast } = useToast();
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const defaultTab = searchParams.get("tab") === "register" ? "register" : "login";
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form handling
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Register form handling
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate("/");
      },
    });
  };

  // Handle register submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account.",
        });
        // Keep user on the page since they need to verify email
      },
    });
  };

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update the URL without navigating
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set("tab", value);
    window.history.pushState({}, "", newUrl.toString());
  };

  // SEO enhancement - set proper page title based on active tab
  useEffect(() => {
    document.title = activeTab === "login" 
      ? "Sign In - AI LaTeX Generator" 
      : "Create Account - AI LaTeX Generator";
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 
        activeTab === "login"
          ? "Sign in to your AI LaTeX Generator account to create LaTeX documents, slides, and academic content with AI assistance."
          : "Create your account for AI LaTeX Generator. Sign up to generate professional LaTeX documents with AI assistance."
      );
    }
  }, [activeTab]);

  return (
    <SiteLayout seoTitle={`${activeTab === "login" ? "Sign In" : "Create Account"} - AI LaTeX Generator`}>
      <div className="flex min-h-screen">
        {/* Left column - Auth form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 lg:p-8">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">
                  {activeTab === "login" ? "Sign in to your account" : "Create your account"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "login" 
                    ? "Enter your credentials to access your account" 
                    : "Get started with AI LaTeX Generator"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                  </TabsList>
                  
                  {/* Login Form */}
                  <TabsContent value="login">
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <FormField
                          control={loginForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={loginMutation.isPending}
                        >
                          {loginMutation.isPending ? "Signing in..." : "Sign in"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  {/* Register Form */}
                  <TabsContent value="register">
                    <Form {...registerForm}>
                      <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johnsmith" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="you@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={registerMutation.isPending}
                        >
                          {registerMutation.isPending ? "Creating account..." : "Create account"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="flex flex-col items-center">
                <p className="text-sm text-gray-500 mt-2">
                  {activeTab === "login" 
                    ? "Don't have an account? " 
                    : "Already have an account? "}
                  <Button 
                    variant="link" 
                    className="p-0 h-auto font-normal" 
                    onClick={() => handleTabChange(activeTab === "login" ? "register" : "login")}
                  >
                    {activeTab === "login" ? "Sign up" : "Sign in"}
                  </Button>
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        {/* Right column - Hero section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-r from-primary/20 to-primary/10 flex-col items-center justify-center p-12">
          <div className="max-w-lg text-center">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              AI LaTeX Generator
            </h1>
            <p className="text-xl mb-6">
              {activeTab === "login"
                ? "Welcome back! Sign in to continue creating professional LaTeX documents with the power of AI."
                : "Create professional LaTeX documents with the power of AI. Sign up today and streamline your academic writing."}
            </p>
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Easy LaTeX Generation</h3>
                <p>Generate complex LaTeX code from simple text descriptions</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Academic Excellence</h3>
                <p>Perfect for papers, presentations, theses, and more</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">PDF Preview</h3>
                <p>See your generated document with real-time PDF previews</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}