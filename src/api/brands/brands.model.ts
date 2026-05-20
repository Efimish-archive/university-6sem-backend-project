import { z } from "zod";
import { schema } from "@/db";

export type BrandSelect = typeof schema.brands.$inferSelect;

export const HttpBrandBodySchema = z.object({
  name: z.string().min(1),
});

export const HttpBrandResponseSchema = HttpBrandBodySchema.extend({
  id: z.number().int(),
});

export const HttpBrandsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["id", "name"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  name: z.string().optional(),
});

export type HttpBrandBody = z.infer<typeof HttpBrandBodySchema>;
export type HttpBrandsQuery = z.infer<typeof HttpBrandsQuerySchema>;
