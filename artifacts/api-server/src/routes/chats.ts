import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chatsTable } from "@workspace/db";
import { CreateChatBody, DeleteChatParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/chats", async (_req, res): Promise<void> => {
  const rows = await db.select().from(chatsTable).orderBy(chatsTable.createdAt);
  res.json(
    rows.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    }))
  );
});

router.post("/chats", async (req, res): Promise<void> => {
  const parsed = CreateChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [chat] = await db
    .insert(chatsTable)
    .values({
      title: parsed.data.title,
      messages: parsed.data.messages,
    })
    .returning();
  res.status(201).json({ ...chat, createdAt: chat.createdAt.toISOString() });
});

router.delete("/chats/:id", async (req, res): Promise<void> => {
  const params = DeleteChatParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [chat] = await db.delete(chatsTable).where(eq(chatsTable.id, params.data.id)).returning();
  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
