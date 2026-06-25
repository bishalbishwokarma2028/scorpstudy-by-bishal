import { supabase } from "./supabase-client";

const DAILY_LIMIT = 50;
const TABLE = "user_daily_usage";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "2026-06-24"
}

export async function checkAndIncrementLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (!supabase) return { allowed: true, used: 0, limit: DAILY_LIMIT };

  const date = todayKey();

  try {
    // Upsert row for today — insert count=1 or increment
    const { data, error } = await supabase.rpc("increment_daily_usage", {
      p_user_id: userId,
      p_date: date,
      p_limit: DAILY_LIMIT,
    });

    if (error) {
      // If rpc doesn't exist yet, fall back to manual upsert
      return await manualCheckAndIncrement(userId, date);
    }

    return {
      allowed: data.allowed as boolean,
      used: data.used as number,
      limit: DAILY_LIMIT,
    };
  } catch {
    return await manualCheckAndIncrement(userId, date);
  }
}

async function manualCheckAndIncrement(userId: string, date: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (!supabase) return { allowed: true, used: 0, limit: DAILY_LIMIT };

  try {
    // Read current usage
    const { data: existing } = await supabase
      .from(TABLE)
      .select("id, count")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    const currentCount = (existing?.count as number) ?? 0;

    if (currentCount >= DAILY_LIMIT) {
      return { allowed: false, used: currentCount, limit: DAILY_LIMIT };
    }

    // Increment
    if (existing) {
      await supabase
        .from(TABLE)
        .update({ count: currentCount + 1 })
        .eq("id", existing.id);
    } else {
      await supabase
        .from(TABLE)
        .insert({ user_id: userId, date, count: 1 });
    }

    return { allowed: true, used: currentCount + 1, limit: DAILY_LIMIT };
  } catch {
    return { allowed: true, used: 0, limit: DAILY_LIMIT };
  }
}

export async function getRemainingQuota(userId: string): Promise<number> {
  if (!supabase) return DAILY_LIMIT;

  try {
    const { data } = await supabase
      .from(TABLE)
      .select("count")
      .eq("user_id", userId)
      .eq("date", todayKey())
      .maybeSingle();

    const used = (data?.count as number) ?? 0;
    return Math.max(0, DAILY_LIMIT - used);
  } catch {
    return DAILY_LIMIT;
  }
}
