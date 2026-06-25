import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, summariesTable } from "@workspace/db";
import { SaveSummaryBody, DeleteSummaryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/summaries", async (_req, res): Promise<void> => {
  const rows = await db.select().from(summariesTable).orderBy(summariesTable.createdAt);
  res.json(rows.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

router.post("/summaries", async (req, res): Promise<void> => {
  const parsed = SaveSummaryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [summary] = await db
    .insert(summariesTable)
    .values({
      originalText: parsed.data.originalText,
      summary: parsed.data.summary,
      keyPoints: parsed.data.keyPoints,
      examQuestions: parsed.data.examQuestions,
    })
    .returning();
  res.status(201).json({ ...summary, createdAt: summary.createdAt.toISOString() });
});

router.delete("/summaries/:id", async (req, res): Promise<void> => {
  const params = DeleteSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [summary] = await db.delete(summariesTable).where(eq(summariesTable.id, params.data.id)).returning();
  if (!summary) {
    res.status(404).json({ error: "Summary not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
