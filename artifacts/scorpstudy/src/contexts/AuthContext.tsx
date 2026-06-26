import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";
import { initSupabase } from "@/lib/supabase";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  supabase: SupabaseClient | null;
  loading: boolean;
  configError: string | null;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  supabase: null,
  loading: true,
  configError: null,
  signOut: async () => {},
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    initSupabase().then((sb) => {
      if (!mounted) return;
      setSupabaseClient(sb);
      setConfigError(null);
      setAuthTokenGetter(async () => {
        const { data } = await sb.auth.getSession();
        return data.session?.access_token ?? null;
      });
      sb.auth.getSession().then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setLoading(false);
      });
      sb.auth.onAuthStateChange((_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setLoading(false);
      });
    }).catch((err: unknown) => {
      if (!mounted) return;
      const msg = err instanceof Error ? err.message : String(err);
      setConfigError(msg || "Failed to connect to the server. Please try again later.");
      setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const signOut = async () => {
    if (supabaseClient) await supabaseClient.auth.signOut();
  };

  const refreshSession = async () => {
    if (!supabaseClient) return;
    const { data } = await supabaseClient.auth.getSession();
    setSession(data.session);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      supabase: supabaseClient,
      loading,
      configError,
      signOut,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
