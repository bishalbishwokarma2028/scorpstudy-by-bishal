import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const questionCacheTable = pgTable("question_cache", {
  id: serial("id").primaryKey(),
  questionKey: text("question_key").notNull().unique(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  hitCount: integer("hit_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastHitAt: timestamp("last_hit_at", { withTimezone: true }),
});

export type QuestionCache = typeof questionCacheTable.$inferSelect;
