import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, quizzesTable } from "@workspace/db";
import { SaveQuizResultBody, DeleteQuizParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/quizzes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(quizzesTable).orderBy(quizzesTable.createdAt);
  res.json(rows.map((q) => ({ ...q, createdAt: q.createdAt.toISOString() })));
});

router.post("/quizzes", async (req, res): Promise<void> => {
  const parsed = SaveQuizResultBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [quiz] = await db
    .insert(quizzesTable)
    .values({
      topic: parsed.data.topic,
      score: parsed.data.score,
      total: parsed.data.total,
      questions: parsed.data.questions,
    })
    .returning();
  res.status(201).json({ ...quiz, createdAt: quiz.createdAt.toISOString() });
});

router.delete("/quizzes/:id", async (req, res): Promise<void> => {
  const params = DeleteQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [quiz] = await db.delete(quizzesTable).where(eq(quizzesTable.id, params.data.id)).returning();
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
