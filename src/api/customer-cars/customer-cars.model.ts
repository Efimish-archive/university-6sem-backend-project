import { z } from "zod";
import { schema } from "@/db";

export type CustomerCarSelect = typeof schema.customerCars.$inferSelect;

export const HttpCustomerCarBodySchema = z.object({
  carId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  year: z.number().int().min(1900).max(2100),
  number: z.string().min(1),
});

export const HttpCustomerCarResponseSchema = z.object({
  id: z.number().int(),
  year: z.number().int().nullable(),
  number: z.string().nullable(),
  customer: z
    .object({
      id: z.number().int(),
      fullName: z.string(),
      email: z.string(),
    })
    .nullable(),
  car: z
    .object({
      id: z.number().int(),
      model: z.string(),
      brand: z.object({
        id: z.number().int(),
        name: z.string(),
      }),
    })
    .nullable(),
});

export const HttpCustomerCarsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["id", "year", "number"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  customerId: z.coerce.number().int().positive().optional(),
  carId: z.coerce.number().int().positive().optional(),
  number: z.string().optional(),
});

export type HttpCustomerCarBody = z.infer<typeof HttpCustomerCarBodySchema>;
export type HttpCustomerCarsQuery = z.infer<typeof HttpCustomerCarsQuerySchema>;
