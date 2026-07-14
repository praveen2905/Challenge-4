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
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 bg-card border border-border rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-accent/20">
            <Activity className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Access Badge</h1>
          <p className="text-muted-foreground mt-2">Register for the VenueIQ platform</p>
        </div>

        <div className="bg-card border border-card-border rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-foreground">Full Name</Label>
              <Input placeholder="John Doe" className="bg-background border-border h-11" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Email</Label>
              <Input placeholder="operator@venueiq.com" className="bg-background border-border h-11" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Password</Label>
              <Input type="password" placeholder="••••••••" className="bg-background border-border h-11" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Role</Label>
                <Select value={role} onValueChange={(v) => { setRole(v); setValue("role", v); }}>
                  <SelectTrigger className="bg-background border-border h-11">
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
                <Label className="text-foreground">Language</Label>
                <Select value={language} onValueChange={(v) => { setLanguage(v); setValue("language", v); }}>
                  <SelectTrigger className="bg-background border-border h-11">
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
            >
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Badge...
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
