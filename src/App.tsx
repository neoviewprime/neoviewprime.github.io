import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";

const Index = lazy(() => import("./pages/Index"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Toaster = lazy(() => import("@/components/ui/toaster").then((module) => ({ default: module.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then((module) => ({ default: module.Toaster })));
const MainLayout = lazy(() => import("@/components/MainLayout"));
const PwaInstallPrompt = lazy(() => import("@/components/PwaInstallPrompt"));
const Superadmin = lazy(() => import("./pages/Superadmin"));
const UserRegistration = lazy(() => import("./pages/UserRegistration"));
const Home = lazy(() => import("./pages/Home"));
const Workspace = lazy(() => import("./pages/Workspace"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Companies = lazy(() => import("./pages/Companies"));
const Reports = lazy(() => import("./pages/Reports"));
const Indicators = lazy(() => import("./pages/Indicators"));
const Settings = lazy(() => import("./pages/Settings"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Help = lazy(() => import("./pages/Help"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Suspense fallback={null}>
          <Toaster />
          <Sonner />
        </Suspense>
        <HashRouter>
          <Suspense
            fallback={
              <div className="app-shell-bg grid min-h-dvh place-items-center px-6 text-center text-sm text-muted-foreground">
                Carregando NeoView...
              </div>
            }
          >
            <Routes>

              {/* ROTAS SEM SIDEBAR */}
              <Route path="/" element={<Index />} />
              <Route path="/landing" element={<Landing />} />
              <Route path="/login" element={<Login />} />

              {/* ROTAS COM SIDEBAR */}
              <Route element={<MainLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/workspace" element={<Workspace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/indicators" element={<Indicators />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route path="/users/new" element={<UserRegistration />} />
                <Route path="/superadmin" element={<Superadmin />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/help" element={<Help />} />
              </Route>

              {/* ROTA FINAL */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </Suspense>
          <Suspense fallback={null}>
            <PwaInstallPrompt />
          </Suspense>
        </HashRouter>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
