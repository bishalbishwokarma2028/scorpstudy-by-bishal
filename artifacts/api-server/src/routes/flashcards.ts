import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, flashcardsTable } from "@workspace/db";
import { SaveFlashcardSetBody, DeleteFlashcardSetParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/flashcards", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(flashcardsTable)
    .where(eq(flashcardsTable.userId, req.userId))
    .orderBy(flashcardsTable.createdAt);
  res.json(rows.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })));
});

router.post("/flashcards", requireAuth, async (req, res): Promise<void> => {
  const parsed = SaveFlashcardSetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [set] = await db
    .insert(flashcardsTable)
    .values({
      userId: req.userId,
      topic: parsed.data.topic,
      cards: parsed.data.cards,
    })
    .returning();
  res.status(201).json({ ...set, createdAt: set.createdAt.toISOString() });
});

router.delete("/flashcards/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteFlashcardSetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [set] = await db
    .delete(flashcardsTable)
    .where(and(eq(flashcardsTable.id, params.data.id), eq(flashcardsTable.userId, req.userId)))
    .returning();
  if (!set) {
    res.status(404).json({ error: "Flashcard set not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
