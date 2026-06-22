import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const flashcardsTable = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  cards: jsonb("cards").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFlashcardSchema = createInsertSchema(flashcardsTable).omit({ id: true, createdAt: true });
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type FlashcardSet = typeof flashcardsTable.$inferSelect;
