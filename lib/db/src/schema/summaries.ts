import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const summariesTable = pgTable("summaries", {
  id: serial("id").primaryKey(),
  originalText: text("original_text").notNull(),
  summary: text("summary").notNull(),
  keyPoints: jsonb("key_points").notNull().default([]),
  examQuestions: jsonb("exam_questions").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSummarySchema = createInsertSchema(summariesTable).omit({ id: true, createdAt: true });
export type InsertSummary = z.infer<typeof insertSummarySchema>;
export type Summary = typeof summariesTable.$inferSelect;
