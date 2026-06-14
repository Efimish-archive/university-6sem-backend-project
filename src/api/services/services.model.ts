import { z } from "zod";

export const ServiceInsertSchema = z.object({
  name: z.string().min(1),
  priceRubles: z.number().min(0),
  timeMinutes: z.number().min(0),
});

export const ServiceSelectSchema = z.object({
  id: z.int().min(1),
  name: z.string().min(1),
  price: z.object({
    rubles: z.number().min(0),
    kopecks: z.int().min(0),
    format: z.string().min(1),
  }),
  time: z.object({
    second: z.int().min(0),
    minute: z.number().min(0),
  }),
});

export const ServiceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["id", "name", "price", "time"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  name: z.string().min(1).optional(),
  minPriceRubles: z.coerce.number().min(0).optional(),
  maxPriceRubles: z.coerce.number().min(0).optional(),
  minTimeMinutes: z.coerce.number().min(0).optional(),
  maxTimeMinutes: z.coerce.number().min(0).optional(),
});

export type ServiceInsert = z.infer<typeof ServiceInsertSchema>;
export type ServiceSelect = z.infer<typeof ServiceSelectSchema>;
export type ServiceQuery = z.infer<typeof ServiceQuerySchema>;
