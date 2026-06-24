import { db } from "@workspace/db";
import { questionCacheTable } from "@workspace/db";
import { eq, asc, sql } from "drizzle-orm";

const MAX_CACHE_ENTRIES = 1000;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Study topic keywords — only cache these ─────────────────────────────
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

// ─── Skip caching these ───────────────────────────────────────────────────
const SKIP_PATTERNS = [
  /^(hi|hello|hey|thanks|thank you|ok|okay|yes|no|bye|good|great|cool|nice|awesome|sure|please|sorry|help me)/i,
  /^(who made you|who are you|what are you|your name|tell me about yourself)/i,
  /^\s*$/,
];

// ─── Normalize question to a cache key ───────────────────────────────────
export function normalizeQuestion(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

// ─── Is this question worth caching? ─────────────────────────────────────
function isCacheable(question: string): boolean {
  const q = question.toLowerCase().trim();
  if (q.length < 10 || q.length > 500) return false;
  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(q)) return false;
  }
  return STUDY_KEYWORDS.some((kw) => q.includes(kw));
}

// ─── Look up cache ────────────────────────────────────────────────────────
export async function getCachedAnswer(question: string): Promise<string | null> {
  if (!isCacheable(question)) return null;

  const key = normalizeQuestion(question);
  if (!key) return null;

  try {
    const rows = await db
      .select()
      .from(questionCacheTable)
      .where(eq(questionCacheTable.questionKey, key))
      .limit(1);

    const row = rows[0];
    if (!row) return null;

    // Check TTL
    const age = Date.now() - new Date(row.createdAt).getTime();
    if (age > CACHE_TTL_MS) {
      // Expired — delete and return null
      await db.delete(questionCacheTable).where(eq(questionCacheTable.id, row.id));
      return null;
    }

    // Update hit stats (fire-and-forget)
    db.update(questionCacheTable)
      .set({ hitCount: row.hitCount + 1, lastHitAt: new Date() })
      .where(eq(questionCacheTable.id, row.id))
      .catch(() => {});

    return row.answer;
  } catch {
    return null; // Never let cache errors break the app
  }
}

// ─── Store in cache ───────────────────────────────────────────────────────
export async function setCachedAnswer(question: string, answer: string): Promise<void> {
  if (!isCacheable(question)) return;
  if (!answer || answer.length < 20 || answer.length > 8000) return;

  const key = normalizeQuestion(question);
  if (!key) return;

  try {
    // Upsert
    await db
      .insert(questionCacheTable)
      .values({ questionKey: key, question: question.slice(0, 500), answer })
      .onConflictDoUpdate({
        target: questionCacheTable.questionKey,
        set: { answer, hitCount: 0, createdAt: new Date(), lastHitAt: null },
      });

    // Enforce max size — delete oldest if over limit (FIFO)
    const countRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questionCacheTable);
    const total = countRows[0]?.count ?? 0;

    if (total > MAX_CACHE_ENTRIES) {
      const overflow = total - MAX_CACHE_ENTRIES;
      const oldest = await db
        .select({ id: questionCacheTable.id })
        .from(questionCacheTable)
        .orderBy(asc(questionCacheTable.createdAt))
        .limit(overflow);

      for (const row of oldest) {
        await db.delete(questionCacheTable).where(eq(questionCacheTable.id, row.id));
      }
    }
  } catch {
    // Never let cache errors break the app
  }
}
