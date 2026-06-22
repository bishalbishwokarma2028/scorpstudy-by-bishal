import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";

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
        {() => <ProtectedRoute><Dashboard /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/chat">
        {() => <ProtectedRoute><Chat /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/summarizer">
        {() => <ProtectedRoute><Summarizer /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/quiz">
        {() => <ProtectedRoute><Quiz /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/flashcards">
        {() => <ProtectedRoute><Flashcards /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/image-gen">
        {() => <ProtectedRoute><ImageGen /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/notes">
        {() => <ProtectedRoute><Notes /></ProtectedRoute>}
      </Route>
      <Route path="/dashboard/history">
        {() => <ProtectedRoute><History /></ProtectedRoute>}
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
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
