import { z } from "zod";

export const RoleInsertSchema = z.object({
  name: z.string().min(1),
});

export const RoleSelectSchema = z.object({
  id: z.int().min(1),
  name: z.string().min(1),
});

export const RoleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["id", "name"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  name: z.string().min(1).optional(),
});

export type RoleInsert = z.infer<typeof RoleInsertSchema>;
export type RoleSelect = z.infer<typeof RoleSelectSchema>;
export type RoleQuery = z.infer<typeof RoleQuerySchema>;
