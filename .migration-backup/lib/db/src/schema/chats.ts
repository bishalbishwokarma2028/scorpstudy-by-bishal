import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chatsTable = pgTable("chats", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChatSchema = createInsertSchema(chatsTable).omit({ id: true, createdAt: true, lastAccessedAt: true });
export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chatsTable.$inferSelect;
