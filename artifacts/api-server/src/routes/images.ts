import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, imagesTable } from "@workspace/db";
import { SaveImageBody, DeleteImageParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/images", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(imagesTable)
    .where(eq(imagesTable.userId, req.userId))
    .orderBy(imagesTable.createdAt);
  res.json(rows.map((img) => ({ ...img, createdAt: img.createdAt.toISOString() })));
});

router.post("/images", requireAuth, async (req, res): Promise<void> => {
  const parsed = SaveImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [image] = await db
    .insert(imagesTable)
    .values({
      userId: req.userId,
      prompt: parsed.data.prompt,
      imageUrl: parsed.data.imageUrl,
      style: parsed.data.style,
    })
    .returning();
  res.status(201).json({ ...image, createdAt: image.createdAt.toISOString() });
});

router.delete("/images/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteImageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [image] = await db
    .delete(imagesTable)
    .where(and(eq(imagesTable.id, params.data.id), eq(imagesTable.userId, req.userId)))
    .returning();
  if (!image) {
    res.status(404).json({ error: "Image not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
