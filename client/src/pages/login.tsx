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
import { Checkbox } from "@/components/ui/checkbox";
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
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional().default(false),
});
type LoginForm = z.infer<typeof loginSchema>;
/* ----------------------------------------------------------------------- */

export default function Login() {
  const { session, setSession } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /* Redirect already‑authenticated users */
  useEffect(() => {
    if (!session.isLoading && session.isAuthenticated) navigate("/");
  }, [session.isLoading, session.isAuthenticated]);

  /* React‑Hook‑Form setup */
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  /* -----------------------------  Submit  ----------------------------- */
  const onSubmit = async (values: LoginForm) => {
    setLoading(true);
    try {
      const res = await apiRequest("POST", API_ROUTES.auth.login, {
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
          limit: data.usageLimit ?? 0,
          resetDate: data.user.usageResetDate ?? null,
        },
        refillPackCredits: data.user.refillPackCredits ?? 0,
      });

      toast({ title: "Welcome back!", description: "Logged in successfully." });
      navigate("/");
    } catch (err) {
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : "Invalid credentials",
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
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
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
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remember‑me + forgot‑password */}
                  <div className="flex items-center justify-between">
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              id="remember"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <label
                            htmlFor="remember"
                            className="text-sm text-gray-700 cursor-pointer"
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

                  {/* Submit */}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
              </Form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <span className="text-sm text-gray-600">
                Don&apos;t have an account?
              </span>
              <Link
                href="/register"
                className="ml-1 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Create one
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}
