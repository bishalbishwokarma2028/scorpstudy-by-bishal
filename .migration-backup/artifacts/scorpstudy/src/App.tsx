import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages for fast initial load
const Landing    = lazy(() => import("@/pages/Landing"));
const SignIn     = lazy(() => import("@/pages/SignIn"));
const SignUp     = lazy(() => import("@/pages/SignUp"));
const Dashboard  = lazy(() => import("@/pages/Dashboard"));
const Chat       = lazy(() => import("@/pages/Chat"));
const Summarizer = lazy(() => import("@/pages/Summarizer"));
const Quiz       = lazy(() => import("@/pages/Quiz"));
const Flashcards = lazy(() => import("@/pages/Flashcards"));
const ImageGen   = lazy(() => import("@/pages/ImageGen"));
const Notes      = lazy(() => import("@/pages/Notes"));
const History    = lazy(() => import("@/pages/History"));
const Onboarding = lazy(() => import("@/pages/Onboarding"));
const NotFound   = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, profileLoaded, saveProfile } = useUserProfile();

  if (!profileLoaded) return <PageLoader />;

  if (needsOnboarding) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Onboarding onComplete={saveProfile} />
      </Suspense>
    );
  }

  return <>{children}</>;
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <OnboardingGate>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </OnboardingGate>
    </ProtectedRoute>
  );
}

function Router() {
  const { loading } = useAuth();
  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/signin" component={SignIn} />
        <Route path="/signup" component={SignUp} />
        <Route path="/dashboard">{() => <P><Dashboard /></P>}</Route>
        <Route path="/dashboard/chat">{() => <P><Chat /></P>}</Route>
        <Route path="/dashboard/summarizer">{() => <P><Summarizer /></P>}</Route>
        <Route path="/dashboard/quiz">{() => <P><Quiz /></P>}</Route>
        <Route path="/dashboard/flashcards">{() => <P><Flashcards /></P>}</Route>
        <Route path="/dashboard/image-gen">{() => <P><ImageGen /></P>}</Route>
        <Route path="/dashboard/notes">{() => <P><Notes /></P>}</Route>
        <Route path="/dashboard/history">{() => <P><History /></P>}</Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <UserProfileProvider>
              <Router />
            </UserProfileProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
