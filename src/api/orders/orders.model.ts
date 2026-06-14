import { z } from "zod";
import { UserSelectSchema } from "@/api/users/users.model";
import { CustomerCarSelectSchema } from "@/api/customer-cars/customer-cars.model";
import { ServiceSelectSchema } from "@/api/services/services.model";

export const OrderInsertSchema = z.object({
  // external
  customerCarId: z.int().min(1),
  // external
  employeeId: z.int().min(1),
  // external
  serviceIds: z.int().min(1).array().min(1),
});

export const OrderSelectSchema = z.object({
  id: z.int().min(1),
  // external
  administrator: UserSelectSchema,
  // external
  customerCar: CustomerCarSelectSchema,
  // external
  employee: UserSelectSchema,
  status: z.int().min(0).max(1),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  totalPrice: z.int().min(0),
  // external
  services: ServiceSelectSchema.array(),
});

export enum OrderStatus {
  "в работе",
  "завершен",
}

export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z
    .enum(["id", "status", "startDate", "endDate", "totalPrice"])
    .default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  status: z.coerce
    .number()
    .int()
    .min(OrderStatus["в работе"])
    .max(OrderStatus["завершен"])
    .optional(),
  employeeId: z.coerce.number().int().min(1).optional(),
  customerId: z.coerce.number().int().min(1).optional(),
});

export type OrderInsert = z.infer<typeof OrderInsertSchema>;
export type OrderSelect = z.infer<typeof OrderSelectSchema>;
export type OrderQuery = z.infer<typeof OrderQuerySchema>;

// Additional

export const OrderUpdateStatusSchema = z.object({
  status: z.enum(OrderStatus),
});

export const OrderAddServicesSchema = z.object({
  serviceIds: z.int().min(1).array().min(1),
});

export type OrderUpdateStatus = z.infer<typeof OrderUpdateStatusSchema>;
export type OrderAddServices = z.infer<typeof OrderAddServicesSchema>;
