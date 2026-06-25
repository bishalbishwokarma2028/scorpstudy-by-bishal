import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import { initSupabase } from "@/lib/supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  supabase: SupabaseClient | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  supabase: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    initSupabase().then((sb) => {
      if (!mounted) return;
      setSupabaseClient(sb);
      sb.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setLoading(false);
      });
      sb.auth.onAuthStateChange((_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
      });
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      supabase: supabaseClient,
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
