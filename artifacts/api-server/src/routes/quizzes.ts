import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, quizzesTable } from "@workspace/db";
import { SaveQuizResultBody, DeleteQuizParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/quizzes", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(quizzesTable)
    .where(eq(quizzesTable.userId, req.userId))
    .orderBy(quizzesTable.createdAt);
  res.json(rows.map((q) => ({ ...q, createdAt: q.createdAt.toISOString() })));
});

router.post("/quizzes", requireAuth, async (req, res): Promise<void> => {
  const parsed = SaveQuizResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [quiz] = await db
    .insert(quizzesTable)
    .values({
      userId: req.userId,
      topic: parsed.data.topic,
      score: parsed.data.score,
      total: parsed.data.total,
      questions: parsed.data.questions,
    })
    .returning();
  res.status(201).json({ ...quiz, createdAt: quiz.createdAt.toISOString() });
});

router.delete("/quizzes/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [quiz] = await db
    .delete(quizzesTable)
    .where(and(eq(quizzesTable.id, params.data.id), eq(quizzesTable.userId, req.userId)))
    .returning();
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
