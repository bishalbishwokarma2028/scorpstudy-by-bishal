import { Router, type IRouter } from "express";
import { eq, lt, and } from "drizzle-orm";
import { db, chatsTable } from "@workspace/db";
import { CreateChatBody, DeleteChatParams } from "@workspace/api-zod";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

const MAX_MESSAGES_PER_CHAT = 100;
const CLEANUP_DAYS = 30;

function trimMessages(messages: unknown): unknown {
  if (!Array.isArray(messages)) return messages;
  if (messages.length <= MAX_MESSAGES_PER_CHAT) return messages;
  return messages.slice(messages.length - MAX_MESSAGES_PER_CHAT);
}

function runCleanup(userId: string) {
  const cutoff = new Date(Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000);
  db.delete(chatsTable)
    .where(and(eq(chatsTable.userId, userId), lt(chatsTable.lastAccessedAt, cutoff)))
    .catch(() => {});
}

router.get("/chats", requireAuth, async (req, res): Promise<void> => {
  runCleanup(req.userId);
  const rows = await db
    .select()
    .from(chatsTable)
    .where(eq(chatsTable.userId, req.userId))
    .orderBy(chatsTable.createdAt);
  res.json(rows.map((c) => ({ ...c, createdAt: c.createdAt.toISOString(), lastAccessedAt: c.lastAccessedAt.toISOString() })));
});

router.get("/chats/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [chat] = await db
    .select()
    .from(chatsTable)
    .where(and(eq(chatsTable.id, id), eq(chatsTable.userId, req.userId)));
  if (!chat) { res.status(404).json({ error: "Chat not found" }); return; }

  db.update(chatsTable)
    .set({ lastAccessedAt: new Date() })
    .where(and(eq(chatsTable.id, id), eq(chatsTable.userId, req.userId)))
    .catch(() => {});

  res.json({ ...chat, createdAt: chat.createdAt.toISOString(), lastAccessedAt: chat.lastAccessedAt.toISOString() });
});

router.patch("/chats/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { messages, title } = req.body as { messages?: unknown; title?: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = { lastAccessedAt: new Date() };
  if (messages !== undefined) updates.messages = trimMessages(messages);
  if (title !== undefined) updates.title = title;

  const [chat] = await db
    .update(chatsTable)
    .set(updates)
    .where(and(eq(chatsTable.id, id), eq(chatsTable.userId, req.userId)))
    .returning();
  if (!chat) { res.status(404).json({ error: "Chat not found" }); return; }
  res.json({ ...chat, createdAt: chat.createdAt.toISOString(), lastAccessedAt: chat.lastAccessedAt.toISOString() });
});

router.post("/chats", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [chat] = await db
    .insert(chatsTable)
    .values({
      userId: req.userId,
      title: parsed.data.title,
      messages: trimMessages(parsed.data.messages),
    })
    .returning();
  res.status(201).json({ ...chat, createdAt: chat.createdAt.toISOString(), lastAccessedAt: chat.lastAccessedAt.toISOString() });
});

router.delete("/chats/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteChatParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [chat] = await db
    .delete(chatsTable)
    .where(and(eq(chatsTable.id, params.data.id), eq(chatsTable.userId, req.userId)))
    .returning();
  if (!chat) {
    res.status(404).json({ error: "Chat not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
