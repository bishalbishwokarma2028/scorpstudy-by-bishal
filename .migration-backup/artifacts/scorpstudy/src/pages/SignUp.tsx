import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const { supabase } = useAuth();
  const [, navigate] = useLocation();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { toast.error("Auth not ready, please wait"); return; }
    setError("");
    if (password !== confirm) { setError("Passwords do not match. Please try again."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters long."); return; }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) {
      if (authError.message.toLowerCase().includes("already") || authError.message.toLowerCase().includes("registered") || authError.message.toLowerCase().includes("taken")) {
        setError("This Email already exists. Try a different Email.");
      } else {
        setError(authError.message);
      }
    } else if (data.session) {
      toast.success("Account created! Welcome to ScorpStudy.");
      navigate("/dashboard");
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-sm text-center p-8">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Check your email</h2>
          <p className="text-slate-600 mb-6">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
          <Link href="/signin"><Button className="w-full">Back to Sign In</Button></Link>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Start studying smarter today — it's free</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="pr-10" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative">
                  <Input id="confirm" type={showConfirm ? "text" : "password"} placeholder="Repeat your password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" className="pr-10" required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                Create Account
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary font-medium hover:underline">Sign in</Link>
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
