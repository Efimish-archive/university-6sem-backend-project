import { z } from "zod";
import { listResponseSchema } from "@/api/shared/http.model";

export const BrandInsertSchema = z.object({
  name: z.string().min(1),
});

export const BrandSelectSchema = z.object({
  id: z.int().min(1),
  name: z.string().min(1),
});

export const BrandsListSelectSchema = listResponseSchema(BrandSelectSchema);

export const BrandsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["id", "name"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  name: z.string().min(1).optional(),
});

export type BrandInsert = z.infer<typeof BrandInsertSchema>;
export type BrandSelect = z.infer<typeof BrandSelectSchema>;
export type BrandsListSelect = z.infer<typeof BrandsListSelectSchema>;
export type BrandsQuery = z.infer<typeof BrandsQuerySchema>;
