import { z } from "zod";
import { schema } from "@/db";
import { HttpDateSchema, listResponseSchema } from "@/api/shared/http.model";

export type OrderSelect = typeof schema.orders.$inferSelect;

export const ORDER_STATUS = {
  inProgress: 1,
  completed: 2,
} as const;

export const HttpOrderCreateBodySchema = z.object({
  customerCarId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  serviceIds: z.array(z.number().int().positive()).min(1),
});

export const HttpOrderUpdateBodySchema = z.object({
  customerCarId: z.number().int().positive().optional(),
  employeeId: z.number().int().positive().optional(),
});

export const HttpOrderStatusBodySchema = z.object({
  status: z.union([
    z.literal(ORDER_STATUS.inProgress),
    z.literal(ORDER_STATUS.completed),
  ]),
});

export const HttpOrderServicesBodySchema = z.object({
  serviceIds: z.array(z.number().int().positive()).min(1),
});

export const HttpOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z
    .enum(["id", "status", "startDate", "endDate", "totalPrice"])
    .default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  status: z.coerce
    .number()
    .int()
    .refine(
      (status) =>
        status === ORDER_STATUS.inProgress || status === ORDER_STATUS.completed,
    )
    .optional(),
  employeeId: z.coerce.number().int().positive().optional(),
  customerId: z.coerce.number().int().positive().optional(),
});

export const HttpOrderResponseSchema = z.object({
  id: z.number().int(),
  status: z.number().int(),
  startDate: HttpDateSchema,
  endDate: HttpDateSchema.nullable(),
  totalTime: z.number().int(),
  totalPrice: z.number(),
  administrator: z.object({
    id: z.number().int(),
    fullName: z.string(),
  }),
  employee: z.object({
    id: z.number().int(),
    fullName: z.string(),
  }),
  services: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
      price: z.object({
        rubles: z.number(),
        kopecks: z.number(),
        format: z.string(),
      }),
      time: z.object({
        second: z.number().int(),
        minute: z.number().int(),
      }),
    }),
  ),
  customerCar: z.object({
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
        model: z.string(),
        brand: z.string(),
      })
      .nullable(),
  }),
});

export const HttpOrdersListResponseSchema = listResponseSchema(
  HttpOrderResponseSchema,
);

export type HttpOrderCreateBody = z.infer<typeof HttpOrderCreateBodySchema>;
export type HttpOrderUpdateBody = z.infer<typeof HttpOrderUpdateBodySchema>;
export type HttpOrderStatusBody = z.infer<typeof HttpOrderStatusBodySchema>;
export type HttpOrderServicesBody = z.infer<typeof HttpOrderServicesBodySchema>;
export type HttpOrdersQuery = z.infer<typeof HttpOrdersQuerySchema>;
