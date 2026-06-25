import { Router, type IRouter } from "express";
import { db, chatsTable, quizzesTable, flashcardsTable, summariesTable, notesTable, imagesTable } from "@workspace/db";
import { desc, eq, lt, sql, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId;
  const [
    noteCount,
    chatCount,
    quizCount,
    flashcardCount,
    imageCount,
    quizAvg,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(notesTable).where(eq(notesTable.userId, uid)),
    db.select({ count: sql<number>`count(*)::int` }).from(chatsTable).where(eq(chatsTable.userId, uid)),
    db.select({ count: sql<number>`count(*)::int` }).from(quizzesTable).where(eq(quizzesTable.userId, uid)),
    db.select({ count: sql<number>`count(*)::int` }).from(flashcardsTable).where(eq(flashcardsTable.userId, uid)),
    db.select({ count: sql<number>`count(*)::int` }).from(imagesTable).where(eq(imagesTable.userId, uid)),
    db
      .select({ avg: sql<number>`avg(score::float / NULLIF(total, 0) * 100)` })
      .from(quizzesTable)
      .where(eq(quizzesTable.userId, uid)),
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

router.get("/dashboard/activity", requireAuth, async (req, res): Promise<void> => {
  const uid = req.userId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  await Promise.all([
    db.delete(chatsTable).where(and(eq(chatsTable.userId, uid), lt(chatsTable.createdAt, thirtyDaysAgo))),
    db.delete(summariesTable).where(and(eq(summariesTable.userId, uid), lt(summariesTable.createdAt, thirtyDaysAgo))),
    db.delete(quizzesTable).where(and(eq(quizzesTable.userId, uid), lt(quizzesTable.createdAt, thirtyDaysAgo))),
    db.delete(flashcardsTable).where(and(eq(flashcardsTable.userId, uid), lt(flashcardsTable.createdAt, thirtyDaysAgo))),
  ]);

  const [chats, quizzes, flashcards, summaries] = await Promise.all([
    db.select().from(chatsTable).where(eq(chatsTable.userId, uid)).orderBy(desc(chatsTable.createdAt)).limit(50),
    db.select().from(quizzesTable).where(eq(quizzesTable.userId, uid)).orderBy(desc(quizzesTable.createdAt)).limit(50),
    db.select().from(flashcardsTable).where(eq(flashcardsTable.userId, uid)).orderBy(desc(flashcardsTable.createdAt)).limit(50),
    db.select().from(summariesTable).where(eq(summariesTable.userId, uid)).orderBy(desc(summariesTable.createdAt)).limit(50),
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
