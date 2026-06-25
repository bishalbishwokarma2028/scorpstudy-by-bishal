import { Router, type IRouter } from "express";
import { eq, lt, and } from "drizzle-orm";
import { db, chatsTable } from "@workspace/db";
import { CreateChatBody, DeleteChatParams } from "@workspace/api-zod";

const router: IRouter = Router();

const MAX_MESSAGES_PER_CHAT = 100;
const CLEANUP_DAYS = 30;

// Trim messages array to the last N entries
function trimMessages(messages: unknown): unknown {
  if (!Array.isArray(messages)) return messages;
  if (messages.length <= MAX_MESSAGES_PER_CHAT) return messages;
  return messages.slice(messages.length - MAX_MESSAGES_PER_CHAT);
}

// Delete chats not accessed in 30 days (fire-and-forget)
function runCleanup() {
  const cutoff = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000);
  db.delete(chatsTable)
    .where(lt(chatsTable.lastAccessedAt, cutoff))
    .catch(() => {});
}

router.get("/chats", async (_req, res): Promise<void> => {
  runCleanup();
  const rows = await db.select().from(chatsTable).orderBy(chatsTable.createdAt);
  res.json(rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), lastAccessedAt: c.lastAccessedAt.toISOString() })));
});

router.get("/chats/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [chat] = await db.select().from(chatsTable).where(eq(chatsTable.id, id));
  if (!chat) { res.status(404).json({ error: "Chat not found" }); return; }

  // Update last_accessed_at (fire-and-forget)
  db.update(chatsTable)
    .set({ lastAccessedAt: new Date() })
    .where(eq(chatsTable.id, id))
    .catch(() => {});

  res.json({ ...chat, createdAt: chat.createdAt.toISOString(), lastAccessedAt: chat.lastAccessedAt.toISOString() });
});

router.patch("/chats/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { messages, title } = req.body as { messages?: unknown; title?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = { lastAccessedAt: new Date() };
  if (messages !== undefined) updates.messages = trimMessages(messages);
  if (title !== undefined) updates.title = title;

  const [chat] = await db.update(chatsTable).set(updates).where(eq(chatsTable.id, id)).returning();
  if (!chat) { res.status(404).json({ error: "Chat not found" }); return; }
  res.json({ ...chat, createdAt: chat.createdAt.toISOString(), lastAccessedAt: chat.lastAccessedAt.toISOString() });
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
      messages: trimMessages(parsed.data.messages),
    })
    .returning();
  res.status(201).json({ ...chat, createdAt: chat.createdAt.toISOString(), lastAccessedAt: chat.lastAccessedAt.toISOString() });
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
