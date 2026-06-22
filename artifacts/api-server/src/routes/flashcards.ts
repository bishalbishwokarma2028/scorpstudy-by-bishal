import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, flashcardsTable } from "@workspace/db";
import { SaveFlashcardSetBody, DeleteFlashcardSetParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/flashcards", async (_req, res): Promise<void> => {
  const rows = await db.select().from(flashcardsTable).orderBy(flashcardsTable.createdAt);
  res.json(rows.map((f) => ({ ...f, createdAt: f.createdAt.toISOString() })));
});

router.post("/flashcards", async (req, res): Promise<void> => {
  const parsed = SaveFlashcardSetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [set] = await db
    .insert(flashcardsTable)
    .values({
      topic: parsed.data.topic,
      cards: parsed.data.cards,
    })
    .returning();
  res.status(201).json({ ...set, createdAt: set.createdAt.toISOString() });
});

router.delete("/flashcards/:id", async (req, res): Promise<void> => {
  const params = DeleteFlashcardSetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [set] = await db.delete(flashcardsTable).where(eq(flashcardsTable.id, params.data.id)).returning();
  if (!set) {
    res.status(404).json({ error: "Flashcard set not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
