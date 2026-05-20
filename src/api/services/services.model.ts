import { z } from "zod";
import { schema } from "@/db";

export type ServiceSelect = typeof schema.services.$inferSelect;

export const HttpServiceBodySchema = z.object({
  name: z.string().min(1),
  priceRubles: z.number().nonnegative(),
  timeMinutes: z.number().int().positive(),
});

export const HttpServiceResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  price: z.object({
    minValue: z.number(),
    maxValue: z.number(),
    format: z.string(),
  }),
  time: z.object({
    second: z.number().int(),
    minute: z.number().int(),
  }),
});

export const HttpServicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["id", "name", "price", "time"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  name: z.string().optional(),
  minPriceRubles: z.coerce.number().nonnegative().optional(),
  maxPriceRubles: z.coerce.number().nonnegative().optional(),
});

export type HttpServiceBody = z.infer<typeof HttpServiceBodySchema>;
export type HttpServicesQuery = z.infer<typeof HttpServicesQuerySchema>;
