import { z } from "zod";
import { BrandSelectSchema } from "@/api/brands/brands.model";

export const CarInsertSchema = z.object({
  // external
  brandId: z.int().min(1),
  model: z.string().min(1),
});

export const CarSelectSchema = z.object({
  id: z.int().min(1),
  // external
  brand: BrandSelectSchema,
  model: z.string().min(1),
});


export const CarQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["id", "model"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  model: z.string().min(1).optional(),
  brandId: z.coerce.number().int().min(1).optional(),
});

export type CarInsert = z.infer<typeof CarInsertSchema>;
export type CarSelect = z.infer<typeof CarSelectSchema>;
export type CarQuery = z.infer<typeof CarQuerySchema>;
