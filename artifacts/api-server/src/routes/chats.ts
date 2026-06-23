import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, chatsTable } from "@workspace/db";
import { CreateChatBody, DeleteChatParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/chats", async (_req, res): Promise<void> => {
  const rows = await db.select().from(chatsTable).orderBy(chatsTable.createdAt);
  res.json(rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })));
});

router.get("/chats/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [chat] = await db.select().from(chatsTable).where(eq(chatsTable.id, id));
  if (!chat) { res.status(404).json({ error: "Chat not found" }); return; }
  res.json({ ...chat, createdAt: chat.createdAt.toISOString() });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
router.patch("/chats/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { messages, title } = req.body as { messages?: unknown; title?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = {};
  if (messages !== undefined) updates.messages = messages;
  if (title !== undefined) updates.title = title;
  if (Object.keys(updates).length === 0) { res.status(400).json({ error: "Nothing to update" }); return; }
  const [chat] = await db.update(chatsTable).set(updates).where(eq(chatsTable.id, id)).returning();
  if (!chat) { res.status(404).json({ error: "Chat not found" }); return; }
  res.json({ ...chat, createdAt: chat.createdAt.toISOString() });
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
