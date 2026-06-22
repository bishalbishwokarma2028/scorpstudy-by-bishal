import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export async function initSupabase(): Promise<SupabaseClient> {
  if (supabase) return supabase;

  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const res = await fetch(`${base}/api/config`);
  if (!res.ok) throw new Error("Failed to load app config");
  const { supabaseUrl, supabaseAnonKey } = await res.json();

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase config missing from server");
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
