// client/src/components/dialogs/LoginModal.tsx

import { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UserContext } from "@/App";
import { API_ROUTES } from "@/lib/constants";
import { SubscriptionTier } from "@shared/schema";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Zod schemas
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().default(false),
});
const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Combined form values type
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { setSession } = useContext(UserContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  // Choose schema & types
  const schema = isRegistering ? registerSchema : loginSchema;
  type FormValues = LoginValues & Partial<RegisterValues>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isRegistering
      ? { username: "", email: "", password: "" }
      : { email: "", password: "", rememberMe: false },
  });

  // Reset form when toggling
  useEffect(() => {
    form.reset();
  }, [isRegistering]);

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const endpoint = isRegistering
        ? API_ROUTES.auth.register
        : API_ROUTES.auth.login;
      const payload: any = isRegistering
        ? {
            username: values.username,
            email: values.email,
            password: values.password,
          }
        : { email: values.email, password: values.password };

      const res = await apiRequest("POST", endpoint, payload);
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
          resetDate: data.user.usageResetDate ?? new Date().toISOString(),
        },
        refillPackCredits: data.user.refillPackCredits ?? 0,
      });

      toast({
        title: isRegistering ? "Account created!" : "Signed in!",
        description: isRegistering
          ? "Your account has been created."
          : "Welcome back!",
      });

      onClose();
      navigate("/");
    } catch (err: any) {
      toast({
        title: isRegistering ? "Registration failed" : "Login failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRegistering ? "Create Account" : "Sign In"}
          </DialogTitle>
          <DialogDescription>
            {isRegistering
              ? "Join to get more LaTeX generations."
              : "Enter your credentials to continue."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isRegistering && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
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
                    <Input placeholder="you@example.com" {...field} />
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
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isRegistering && (
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox {...field} />
                    </FormControl>
                    <label className="text-sm text-gray-700">Remember me</label>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Processing…"
                  : isRegistering
                    ? "Create Account"
                    : "Sign In"}
              </Button>
            </DialogFooter>
          </form>
        </Form>

        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">
            {isRegistering
              ? "Already have an account?"
              : "Don't have an account?"}
          </span>
          <Button
            variant="link"
            className="ml-1 text-sm font-medium text-blue-600"
            onClick={() => setIsRegistering((prev) => !prev)}
          >
            {isRegistering ? "Sign In" : "Create one"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
