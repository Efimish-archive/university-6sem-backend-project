import { z } from "zod";
import { listResponseSchema } from "@/api/shared/http.model";

export const CustomerCarInsertSchema = z.object({
  carId: z.int().min(1),
  customerId: z.int().min(1),
  year: z.int().min(1900).max(new Date().getFullYear()),
  number: z.string().min(1),
});

export const CustomerCarSelectSchema = z.object({
  id: z.int().min(1),
  car: z.object({
    id: z.int().min(1),
    brand: z.object({
      id: z.int().min(1),
      name: z.string().min(1),
    }),
    model: z.string().min(1),
  }),
  customer: z.object({
    id: z.int().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    patronymic: z.string().min(1).nullable(),
    email: z.string(),
    isSendNotify: z.boolean(),
    roles: z
      .object({
        id: z.int().min(1),
        name: z.string(),
      })
      .array(),
  }),
  year: z.int().min(1900).max(new Date().getFullYear()),
  number: z.string().min(1),
});

export const CustomerCarsListSelectSchema = listResponseSchema(
  CustomerCarSelectSchema,
);

export const CustomerCarsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["id", "year", "number"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  customerId: z.coerce.number().int().min(1).optional(),
  carId: z.coerce.number().int().min(1).optional(),
  number: z.string().min(1).optional(),
});

export type CustomerCarInsert = z.infer<typeof CustomerCarInsertSchema>;
export type CustomerCarSelect = z.infer<typeof CustomerCarSelectSchema>;
export type CustomerCarsListSelect = z.infer<typeof CustomerCarsListSelectSchema>;
export type CustomerCarsQuery = z.infer<typeof CustomerCarsQuerySchema>;
