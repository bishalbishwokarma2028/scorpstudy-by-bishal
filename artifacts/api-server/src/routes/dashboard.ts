import { Router, type IRouter } from "express";
import { db, chatsTable, quizzesTable, flashcardsTable, summariesTable, notesTable, imagesTable } from "@workspace/db";
import { desc, lt, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [
    noteCount,
    chatCount,
    quizCount,
    flashcardCount,
    imageCount,
    quizAvg,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(chatsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(quizzesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(flashcardsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(imagesTable),
    db
      .select({ avg: sql<number>`avg(score::float / NULLIF(total, 0) * 100)` })
      .from(quizzesTable),
  ]);

  res.json({
    totalNotes: noteCount[0]?.count ?? 0,
    totalChats: chatCount[0]?.count ?? 0,
    totalQuizzes: quizCount[0]?.count ?? 0,
    totalFlashcardSets: flashcardCount[0]?.count ?? 0,
    totalImages: imageCount[0]?.count ?? 0,
    avgQuizScore: quizAvg[0]?.avg ?? null,
  });
});

router.get("/dashboard/activity", async (_req, res): Promise<void> => {
  // Auto-delete records older than 30 days (chats, summaries, quizzes, flashcards)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Promise.all([
    db.delete(chatsTable).where(lt(chatsTable.createdAt, thirtyDaysAgo)),
    db.delete(summariesTable).where(lt(summariesTable.createdAt, thirtyDaysAgo)),
    db.delete(quizzesTable).where(lt(quizzesTable.createdAt, thirtyDaysAgo)),
    db.delete(flashcardsTable).where(lt(flashcardsTable.createdAt, thirtyDaysAgo)),
  ]);

  // Fetch history — only chats, summaries, quizzes, flashcards (no notes, no images)
  const [chats, quizzes, flashcards, summaries] = await Promise.all([
    db.select().from(chatsTable).orderBy(desc(chatsTable.createdAt)).limit(50),
    db.select().from(quizzesTable).orderBy(desc(quizzesTable.createdAt)).limit(50),
    db.select().from(flashcardsTable).orderBy(desc(flashcardsTable.createdAt)).limit(50),
    db.select().from(summariesTable).orderBy(desc(summariesTable.createdAt)).limit(50),
  ]);

  const activity = [
    ...chats.map((c) => ({
      id: `chat-${c.id}`,
      type: "chat",
      title: c.title,
      createdAt: c.createdAt.toISOString(),
    })),
    ...quizzes.map((q) => ({
      id: `quiz-${q.id}`,
      type: "quiz",
      title: `Quiz: ${q.topic} (${q.score}/${q.total})`,
      createdAt: q.createdAt.toISOString(),
    })),
    ...flashcards.map((f) => ({
      id: `flashcard-${f.id}`,
      type: "flashcard_set",
      title: `Flashcards: ${f.topic}`,
      createdAt: f.createdAt.toISOString(),
    })),
    ...summaries.map((s) => ({
      id: `summary-${s.id}`,
      type: "summary",
      title: `Summary: ${s.originalText.slice(0, 60)}${s.originalText.length > 60 ? "..." : ""}`,
      createdAt: s.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 100);

  res.json(activity);
});

export default router;
