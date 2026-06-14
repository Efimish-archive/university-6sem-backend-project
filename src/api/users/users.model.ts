import { z } from "zod";
import { schema } from "@/db";
import { listResponseSchema } from "@/api/shared/http.model";

export const UserSelectSchema = z.object({
  id: z.int().min(1),
  firstName: z.string(),
  lastName: z.string(),
  patronymic: z.string().nullable(),
  email: z.string(),
  isSendNotify: z.boolean(),
  // external
  roles: z
    .object({
      id: z.int().min(1),
      name: z.string(),
    })
    .array(),
});

export type UserSelect = z.infer<typeof UserSelectSchema>;

export type UserInsert = typeof schema.users.$inferInsert;

export const HttpUserPostBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  patronymic: z.string().optional(),
  email: z.email(),
  isSendNotify: z.boolean(),
  password: z.string().min(1),
  roleIds: z.int().min(1).array().optional(),
});

export const HttpUsersListResponseSchema = listResponseSchema(
  UserSelectSchema,
);

export const HttpUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["id", "firstName", "lastName", "email"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  email: z.string().optional(),
  name: z.string().optional(),
});

export type HttpUserPostBody = z.infer<typeof HttpUserPostBodySchema>;
export type HttpUsersQuery = z.infer<typeof HttpUsersQuerySchema>;
