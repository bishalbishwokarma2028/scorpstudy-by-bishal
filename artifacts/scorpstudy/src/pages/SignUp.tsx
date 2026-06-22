import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { supabase } = useAuth();
  const [, navigate] = useLocation();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) { toast.error("Auth not ready, please wait"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
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
          <Link href="/signin">
            <Button className="w-full">Back to Sign In</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl">S</div>
            <span className="text-2xl font-bold text-slate-900">ScorpStudy <span className="text-primary">by Bishal</span></span>
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
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Account
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/signin" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
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
