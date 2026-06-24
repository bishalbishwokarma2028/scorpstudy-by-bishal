import { supabase } from "./supabase-client";

const MAX_CACHE_ENTRIES = 500;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const TABLE = "ai_cache";

const STUDY_KEYWORDS = [
  "what is", "what are", "explain", "define", "how does", "how do",
  "why is", "why are", "difference between", "compare", "example",
  "formula", "theorem", "law", "principle", "concept", "theory",
  "history", "invented", "discovered", "calculate", "solve",
  "photosynthesis", "mitosis", "algorithm", "function", "derivative",
  "integral", "gravity", "evolution", "atom", "molecule", "cell",
  "equation", "proof", "summarize", "meaning of", "definition",
  "types of", "advantages", "disadvantages", "causes", "effects",
  "process of", "steps of", "how to", "when was", "who is", "who are",
];

const SKIP_PATTERNS = [
  /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|bye|good|great|cool|nice|awesome|sure|please|sorry|help me)/i,
  /^(who made you|who are you|what are you|your name|tell me about yourself)/i,
  /^\s*$/,
];

export function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function isCacheable(question: string): boolean {
  const q = question.toLowerCase().trim();
  if (q.length < 10 || q.length > 500) return false;
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(q)) return false;
  }
  return STUDY_KEYWORDS.some((kw) => q.includes(kw));
}

export async function getCachedAnswer(question: string): Promise<string | null> {
  if (!supabase || !isCacheable(question)) return null;
  const key = normalizeQuestion(question);
  if (!key) return null;

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, answer, created_at, hit_count")
      .eq("question_key", key)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const age = Date.now() - new Date(data.created_at).getTime();
    if (age > CACHE_TTL_MS) {
      supabase.from(TABLE).delete().eq("id", data.id).then(() => {});
      return null;
    }

    supabase
      .from(TABLE)
      .update({ hit_count: (data.hit_count ?? 0) + 1, last_hit_at: new Date().toISOString() })
      .eq("id", data.id)
      .then(() => {});

    return data.answer as string;
  } catch {
    return null;
  }
}

export async function setCachedAnswer(question: string, answer: string): Promise<void> {
  if (!supabase || !isCacheable(question)) return;
  if (!answer || answer.length < 20 || answer.length > 5000) return;

  const key = normalizeQuestion(question);
  if (!key) return;

  try {
    await supabase.from(TABLE).upsert(
      {
        question_key: key,
        question: question.slice(0, 300),
        answer: answer.slice(0, 5000),
        hit_count: 0,
        created_at: new Date().toISOString(),
        last_hit_at: null,
      },
      { onConflict: "question_key" },
    );

    // FIFO cleanup — delete oldest entries if over limit
    const { count } = await supabase
      .from(TABLE)
      .select("id", { count: "exact", head: true });

    if (count && count > MAX_CACHE_ENTRIES) {
      const overflow = count - MAX_CACHE_ENTRIES;
      const { data: oldest } = await supabase
        .from(TABLE)
        .select("id")
        .order("created_at", { ascending: true })
        .limit(overflow);

      if (oldest && oldest.length > 0) {
        const ids = oldest.map((r: { id: number }) => r.id);
        await supabase.from(TABLE).delete().in("id", ids);
      }
    }
  } catch {
    // Never let cache errors break the app
  }
}
