import { z } from "zod";
import { schema } from "@/db";

export type UserInsert = typeof schema.users.$inferInsert;
export type UserSelect = typeof schema.users.$inferSelect;

export const HttpUserPostBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  patronymic: z.string().optional(),
  isSendNotify: z.boolean(),
  roleIds: z.array(z.number().int().positive()).optional(),
});

export const HttpItemResponseSchema = HttpUserPostBodySchema.omit({
  roleIds: true,
}).extend({
  id: z.int(),
  patronymic: z.string().nullable(),
  roles: z.array(
    z.object({
      id: z.number().int(),
      name: z.string(),
    }),
  ),
});

export const HttpUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["id", "firstName", "lastName", "email"]).default("id"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  email: z.string().optional(),
  name: z.string().optional(),
});

export type HttpUserPostBody = z.infer<typeof HttpUserPostBodySchema>;
export type HttpItemResponse = z.infer<typeof HttpItemResponseSchema>;
export type HttpUsersQuery = z.infer<typeof HttpUsersQuerySchema>;
