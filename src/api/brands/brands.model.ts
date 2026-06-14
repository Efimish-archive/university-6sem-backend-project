import { z } from "zod";

export const BrandInsertSchema = z.object({
  name: z.string().min(1),
});

export const BrandSelectSchema = z.object({
  id: z.int().min(1),
  name: z.string().min(1),
});

export const BrandQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["id", "name"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  name: z.string().min(1).optional(),
});

export type BrandInsert = z.infer<typeof BrandInsertSchema>;
export type BrandSelect = z.infer<typeof BrandSelectSchema>;
export type BrandQuery = z.infer<typeof BrandQuerySchema>;
