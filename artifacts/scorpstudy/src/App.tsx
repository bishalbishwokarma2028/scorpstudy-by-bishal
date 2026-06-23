import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserProfileProvider, useUserProfile } from "@/contexts/UserProfileContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";

import Landing from "@/pages/Landing";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import Chat from "@/pages/Chat";
import Summarizer from "@/pages/Summarizer";
import Quiz from "@/pages/Quiz";
import Flashcards from "@/pages/Flashcards";
import ImageGen from "@/pages/ImageGen";
import Notes from "@/pages/Notes";
import History from "@/pages/History";

const queryClient = new QueryClient();

function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, profileLoaded, saveProfile } = useUserProfile();

  if (!profileLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding onComplete={saveProfile} />;
  }

  return <>{children}</>;
}

function Router() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/dashboard">
        {() => <ProtectedRoute><OnboardingGate><Dashboard /></OnboardingGate></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/chat">
        {() => <ProtectedRoute><OnboardingGate><Chat /></OnboardingGate></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/summarizer">
        {() => <ProtectedRoute><OnboardingGate><Summarizer /></OnboardingGate></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/quiz">
        {() => <ProtectedRoute><OnboardingGate><Quiz /></OnboardingGate></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/flashcards">
        {() => <ProtectedRoute><OnboardingGate><Flashcards /></OnboardingGate></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/image-gen">
        {() => <ProtectedRoute><OnboardingGate><ImageGen /></OnboardingGate></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/notes">
        {() => <ProtectedRoute><OnboardingGate><Notes /></OnboardingGate></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/history">
        {() => <ProtectedRoute><OnboardingGate><History /></OnboardingGate></ProtectedRoute>}
      </Route>
      <Route component={NotFound} />
    </Switch>
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
