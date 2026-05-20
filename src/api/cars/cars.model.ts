import { z } from "zod";
import { schema } from "@/db";

export type CarSelect = typeof schema.cars.$inferSelect;

export const HttpCarBodySchema = z.object({
  brandId: z.number().int().positive(),
  model: z.string().min(1),
});

export const HttpCarResponseSchema = z.object({
  id: z.number().int(),
  brandId: z.number().int(),
  model: z.string(),
  brand: z
    .object({
      id: z.number().int(),
      name: z.string(),
    })
    .optional(),
});

export const HttpCarsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["id", "model"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  model: z.string().optional(),
  brandId: z.coerce.number().int().positive().optional(),
});

export type HttpCarBody = z.infer<typeof HttpCarBodySchema>;
export type HttpCarsQuery = z.infer<typeof HttpCarsQuerySchema>;
