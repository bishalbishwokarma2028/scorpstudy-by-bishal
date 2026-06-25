/**
 * Returns the base URL for all API calls.
 * - On Replit (dev): uses BASE_URL from Vite (e.g. "/scorpstudy")
 * - On Vercel (prod): uses VITE_API_BASE_URL env var (your deployed API server URL)
 */
export function getApiBase(): string {
  const external = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (external) return external.replace(/\/$/, "");
  return (import.meta.env.BASE_URL as string)?.replace(/\/$/, "") ?? "";
}
