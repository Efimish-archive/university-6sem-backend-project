import { z } from "zod";
import { listResponseSchema } from "@/api/shared/http.model";

export const UserInsertSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  patronymic: z.string().min(1).optional(),
  email: z.email(),
  isSendNotify: z.boolean(),
  password: z.string().min(1),
  // external
  roleIds: z.int().min(1).array().optional(),
});

export const UserSelectSchema = z.object({
  id: z.int().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  patronymic: z.string().min(1).nullable(),
  email: z.string(),
  isSendNotify: z.boolean(),
  // external
  roles: z
    .object({
      id: z.int().min(1),
      name: z.string().min(1),
    })
    .array(),
});

export const UsersListSelectSchema = listResponseSchema(UserSelectSchema);

export const UsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["id", "firstName", "lastName", "email"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  email: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
});

export type UserInsert = z.infer<typeof UserInsertSchema>;
export type UserSelect = z.infer<typeof UserSelectSchema>;
export type UsersListSelect = z.infer<typeof UsersListSelectSchema>;
export type UsersQuery = z.infer<typeof UsersQuerySchema>;
