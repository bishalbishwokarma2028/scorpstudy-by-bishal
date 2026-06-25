import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getApiBase } from "./apiBase";

let supabase: SupabaseClient | null = null;

export async function initSupabase(): Promise<SupabaseClient> {
  if (supabase) return supabase;

  let supabaseUrl: string;
  let supabaseAnonKey: string;

  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (envUrl && envKey) {
    supabaseUrl = envUrl;
    supabaseAnonKey = envKey;
  } else {
    const base = getApiBase();
    const res = await fetch(`${base}/api/config`);
    if (!res.ok) throw new Error("Failed to load app config");
    const data = await res.json();
    supabaseUrl = data.supabaseUrl;
    supabaseAnonKey = data.supabaseAnonKey;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase config missing");
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return supabase;
}

export function getSupabase(): SupabaseClient {
  if (!supabase) throw new Error("Supabase not initialized — call initSupabase() first");
  return supabase;
}
