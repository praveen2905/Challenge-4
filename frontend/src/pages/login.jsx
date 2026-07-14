import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(formSchema), defaultValues: { email: "", password: "" } });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem("venueiq_token", data.token);
      toast({ title: "Login successful", description: "Welcome back to VenueIQ." });
      navigate("/dashboard");
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Login failed", description: err?.error || "Please check your credentials and try again." });
    },
  });

  function onSubmit(values) {
    loginMutation.mutate(values);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-card border border-border rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Activity className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sign in to VenueIQ</h1>
          <p className="text-muted-foreground mt-2">Enter your credentials to access the command center</p>
        </div>

        <div className="bg-card border border-card-border rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input
                placeholder="operator@venueiq.com"
                className="bg-background border-border h-12"
                data-testid="input-email"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="bg-background border-border h-12"
                data-testid="input-password"
                {...register("password")}
              />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium"
              disabled={loginMutation.isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Request access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
