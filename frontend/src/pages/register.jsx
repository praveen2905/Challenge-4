import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["fan", "volunteer", "organizer", "staff", "admin"]),
  language: z.string().default("en"),
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [role, setRole] = useState("fan");
  const [language, setLanguage] = useState("en");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "", role: "fan", language: "en" },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      localStorage.setItem("venueiq_token", data.token);
      toast({ title: "Registration successful", description: "Welcome to VenueIQ." });
      navigate("/dashboard");
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Registration failed", description: err?.error || "An error occurred during registration." });
    },
  });

  function onSubmit(values) {
    registerMutation.mutate({ ...values, role, language });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-card border border-border rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-accent/20" aria-hidden="true">
            <Activity className="h-8 w-8 text-accent" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Access Badge</h1>
          <p className="text-muted-foreground mt-2">Register for the VenueIQ platform</p>
        </div>

        <div className="bg-card border border-card-border rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate aria-label="Registration form">
            <div className="space-y-2">
              <Label htmlFor="register-name" className="text-foreground">Full Name</Label>
              <Input
                id="register-name"
                placeholder="John Doe"
                className="bg-background border-border h-11"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "register-name-error" : undefined}
                autoComplete="name"
                {...register("name")}
              />
              <div aria-live="assertive">
                {errors.name && (
                  <p id="register-name-error" role="alert" className="text-sm text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-email" className="text-foreground">Email</Label>
              <Input
                id="register-email"
                type="email"
                placeholder="operator@venueiq.com"
                className="bg-background border-border h-11"
                aria-required="true"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "register-email-error" : undefined}
                autoComplete="email"
                {...register("email")}
              />
              <div aria-live="assertive">
                {errors.email && (
                  <p id="register-email-error" role="alert" className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="register-password" className="text-foreground">Password</Label>
              <Input
                id="register-password"
                type="password"
                placeholder="••••••••"
                className="bg-background border-border h-11"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "register-password-error" : undefined}
                autoComplete="new-password"
                {...register("password")}
              />
              <div aria-live="assertive">
                {errors.password && (
                  <p id="register-password-error" role="alert" className="text-sm text-destructive mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="register-role" className="text-foreground">Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => { setRole(v); setValue("role", v); }}
                  name="role"
                >
                  <SelectTrigger id="register-role" className="bg-background border-border h-11" aria-label="Select your role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fan">Fan</SelectItem>
                    <SelectItem value="volunteer">Volunteer</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-language" className="text-foreground">Language</Label>
                <Select
                  value={language}
                  onValueChange={(v) => { setLanguage(v); setValue("language", v); }}
                  name="language"
                >
                  <SelectTrigger id="register-language" className="bg-background border-border h-11" aria-label="Select your preferred language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg font-medium mt-6"
              disabled={registerMutation.isPending}
              data-testid="button-register-submit"
              aria-busy={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  <span>Creating Badge...</span>
                </>
              ) : (
                "Create Access Badge"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link to="/login" className="text-accent hover:text-accent/80 font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
