import { Router, type IRouter } from "express";
import { db, notesTable, chatsTable, quizzesTable, flashcardsTable, summariesTable, imagesTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { sql } from "drizzle-orm";

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
  const [notes, chats, quizzes, flashcards, summaries, images] = await Promise.all([
    db.select().from(notesTable).orderBy(desc(notesTable.createdAt)).limit(3),
    db.select().from(chatsTable).orderBy(desc(chatsTable.createdAt)).limit(3),
    db.select().from(quizzesTable).orderBy(desc(quizzesTable.createdAt)).limit(3),
    db.select().from(flashcardsTable).orderBy(desc(flashcardsTable.createdAt)).limit(3),
    db.select().from(summariesTable).orderBy(desc(summariesTable.createdAt)).limit(3),
    db.select().from(imagesTable).orderBy(desc(imagesTable.createdAt)).limit(3),
  ]);

  const activity = [
    ...notes.map((n) => ({
      id: `note-${n.id}`,
      type: "note",
      title: n.title,
      createdAt: n.createdAt.toISOString(),
    })),
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
      title: `Summary: ${s.originalText.slice(0, 50)}...`,
      createdAt: s.createdAt.toISOString(),
    })),
    ...images.map((img) => ({
      id: `image-${img.id}`,
      type: "image",
      title: `Image: ${img.prompt.slice(0, 50)}`,
      createdAt: img.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  res.json(activity);
});

export default router;
