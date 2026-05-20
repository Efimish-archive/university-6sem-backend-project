import { z } from "zod";
import { schema } from "@/db";

export type RoleInsert = typeof schema.roles.$inferInsert;
export type RoleSelect = typeof schema.roles.$inferSelect;

export const HttpRoleBodySchema = z.object({
  name: z.string().min(1),
});

export const HttpRoleResponseSchema = HttpRoleBodySchema.extend({
  id: z.number().int(),
});

export const HttpRolesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["id", "name"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  name: z.string().optional(),
});

export type HttpRoleBody = z.infer<typeof HttpRoleBodySchema>;
export type HttpRolesQuery = z.infer<typeof HttpRolesQuerySchema>;
