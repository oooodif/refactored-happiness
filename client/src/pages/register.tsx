import { useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SiteLayout from "@/components/layout/site-layout";
import { UserContext } from "@/App";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ROUTES } from "@/lib/constants";
import { SubscriptionTier } from "@shared/schema";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Link } from "wouter";

/* -----------------------------  Zod schema  ----------------------------- */
const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;
/* ----------------------------------------------------------------------- */

export default function Register() {
  const { session, setSession } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /* Redirect authenticated users */
  useEffect(() => {
    if (!session.isLoading && session.isAuthenticated) navigate("/");
  }, [session.isLoading, session.isAuthenticated]);

  /* React‑Hook‑Form */
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  /* -----------------------------  Submit  ----------------------------- */
  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", API_ROUTES.auth.register, {
        username: values.username,
        email: values.email,
        password: values.password,
      });
      const data = await res.json();
      if (!data.user) throw new Error("Invalid response from server");

      setSession({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        tier: data.user.subscriptionTier ?? SubscriptionTier.Free,
        usage: {
          current: data.user.monthlyUsage ?? 0,
          limit: data.usageLimit ?? 3,
          resetDate: data.user.usageResetDate ?? null,
        },
        refillPackCredits: data.user.refillPackCredits ?? 0,
      });

      toast({ title: "Account created", description: "Welcome!" });
      navigate("/");
    } catch (err) {
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "Try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------  UI  ----------------------------- */
  return (
    <SiteLayout fullHeight={false}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create an Account</CardTitle>
              <CardDescription>Join to unlock more LaTeX generations</CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Username */}
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" autoComplete="username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Confirm */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit */}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating account…" : "Create Account"}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <span className="text-sm text-gray-600">Already have an account?</span>
              <Link href="/login" className="ml-1 text-sm font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}