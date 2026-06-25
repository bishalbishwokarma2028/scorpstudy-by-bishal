import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { supabase } = useAuth();
  const [, navigate] = useLocation();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { toast.error("Auth not ready, please wait"); return; }
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      if (authError.message.toLowerCase().includes("invalid") || authError.message.toLowerCase().includes("password") || authError.message.toLowerCase().includes("credentials")) {
        setError("Password is Incorrect. Try Again.");
      } else if (authError.message.toLowerCase().includes("email")) {
        setError("Email not found. Please sign up first.");
      } else {
        setError(authError.message);
      }
    } else {
      toast.success("Welcome back!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <img src="/logo.png" alt="ScorpStudy" className="w-12 h-12 object-contain" />
            <div className="text-left leading-tight">
              <span className="text-xl font-bold text-slate-900 block">ScorpStudy</span>
              <span className="text-sm text-primary font-medium block">by Bishal</span>
            </div>
          </Link>
        </div>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your study account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 font-medium">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign In
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">Sign up free</Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
