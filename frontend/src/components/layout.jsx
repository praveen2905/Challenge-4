import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  MapPin,
  MessageSquare,
  AlertTriangle,
  Brain,
  Settings2,
  LogOut,
  Menu,
  Activity,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { authApi } from "@/lib/api";
import { useState } from "react";

export function Layout({ children }) {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.me,
    retry: false,
  });

  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      localStorage.removeItem("venueiq_token");
      queryClient.clear();
      navigate("/");
    },
  });

  const role = user?.role || "fan";

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard", roles: ["fan", "volunteer", "staff", "organizer", "admin"] },
    { label: "Navigation", icon: MapPin, path: "/navigation", roles: ["fan", "volunteer", "staff", "organizer", "admin"] },
    { label: "Chat", icon: MessageSquare, path: "/chat", roles: ["fan", "volunteer", "staff", "organizer", "admin"] },
    { label: "Volunteer Portal", icon: Users, path: "/volunteer", roles: ["volunteer", "staff", "organizer", "admin"] },
    { label: "Crowd Management", icon: AlertTriangle, path: "/crowd", roles: ["staff", "organizer", "admin"] },
    { label: "Decision Support", icon: Brain, path: "/decisions", roles: ["organizer", "admin", "staff"] },
    { label: "Admin Panel", icon: Settings2, path: "/admin", roles: ["admin", "organizer"] },
  ].filter((item) => item.roles.includes(role));

  function SidebarContent() {
    return (
      <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-4 md:p-6 flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold tracking-tight text-white">
            Venue<span className="text-primary">IQ</span>
          </span>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid gap-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 mt-auto border-t border-sidebar-border">
          {user && (
            <div className="mb-4 flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
              </div>
            </div>
          )}
          <Button
            variant="outline"
            className="w-full justify-start gap-2 bg-sidebar border-sidebar-border hover:bg-sidebar-accent hover:text-white"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col h-screen overflow-hidden">
        <header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-background px-6 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden shrink-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] border-sidebar-border">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">
              Venue<span className="text-primary">IQ</span>
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
