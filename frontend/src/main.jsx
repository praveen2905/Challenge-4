import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LandingPage from "./pages/landing";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import { Layout } from "./components/layout";
import { Toaster } from "@/components/ui/toaster";
import "./index.css";

// Lazy-load protected pages for better performance
const DashboardPage   = lazy(() => import("./pages/dashboard"));
const NavigationPage  = lazy(() => import("./pages/navigation"));
const ChatPage        = lazy(() => import("./pages/chat"));
const VolunteerPage   = lazy(() => import("./pages/volunteer"));
const CrowdPage       = lazy(() => import("./pages/crowd"));
const DecisionsPage   = lazy(() => import("./pages/decisions"));
const AdminPage       = lazy(() => import("./pages/admin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]" aria-live="polite" aria-label="Loading page">
      <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Skip to main content link for keyboard/screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:font-medium"
        >
          Skip to main content
        </a>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes wrapped in Layout — lazy-loaded */}
          <Route path="/dashboard"  element={<Layout><Suspense fallback={<PageLoader />}><DashboardPage /></Suspense></Layout>} />
          <Route path="/navigation" element={<Layout><Suspense fallback={<PageLoader />}><NavigationPage /></Suspense></Layout>} />
          <Route path="/chat"       element={<Layout><Suspense fallback={<PageLoader />}><ChatPage /></Suspense></Layout>} />
          <Route path="/volunteer"  element={<Layout><Suspense fallback={<PageLoader />}><VolunteerPage /></Suspense></Layout>} />
          <Route path="/crowd"      element={<Layout><Suspense fallback={<PageLoader />}><CrowdPage /></Suspense></Layout>} />
          <Route path="/decisions"  element={<Layout><Suspense fallback={<PageLoader />}><DecisionsPage /></Suspense></Layout>} />
          <Route path="/admin"      element={<Layout><Suspense fallback={<PageLoader />}><AdminPage /></Suspense></Layout>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
