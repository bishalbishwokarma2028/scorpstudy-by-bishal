import { Router, type IRouter } from "express";
import { eq, ilike } from "drizzle-orm";
import { db, notesTable } from "@workspace/db";
import {
  ListNotesQueryParams,
  CreateNoteBody,
  GetNoteParams,
  UpdateNoteParams,
  UpdateNoteBody,
  DeleteNoteParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notes", async (req, res): Promise<void> => {
  const parsed = ListNotesQueryParams.safeParse(req.query);
  const search = parsed.success ? parsed.data.search : undefined;

  const rows = search
    ? await db
        .select()
        .from(notesTable)
        .where(ilike(notesTable.title, `%${search}%`))
        .orderBy(notesTable.updatedAt)
    : await db.select().from(notesTable).orderBy(notesTable.updatedAt);

  res.json(
    rows.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }))
  );
});

router.post("/notes", async (req, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [note] = await db.insert(notesTable).values(parsed.data).returning();
  res.status(201).json({
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  });
});

router.get("/notes/:id", async (req, res): Promise<void> => {
  const params = GetNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [note] = await db.select().from(notesTable).where(eq(notesTable.id, params.data.id));
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  });
});

router.patch("/notes/:id", async (req, res): Promise<void> => {
  const params = UpdateNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateNoteBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [note] = await db
    .update(notesTable)
    .set(body.data)
    .where(eq(notesTable.id, params.data.id))
    .returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.json({
    ...note,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  });
});

router.delete("/notes/:id", async (req, res): Promise<void> => {
  const params = DeleteNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [note] = await db.delete(notesTable).where(eq(notesTable.id, params.data.id)).returning();
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
