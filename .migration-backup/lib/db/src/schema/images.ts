import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const imagesTable = pgTable("images", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  imageUrl: text("image_url").notNull(),
  style: text("style").notNull().default("realistic"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertImageSchema = createInsertSchema(imagesTable).omit({ id: true, createdAt: true });
export type InsertImage = z.infer<typeof insertImageSchema>;
export type GeneratedImage = typeof imagesTable.$inferSelect;
