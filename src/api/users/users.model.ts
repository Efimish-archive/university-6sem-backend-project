import { z } from "zod";
import { schema } from "@/db";

export type UserInsert = typeof schema.users.$inferInsert;
export type UserSelect = typeof schema.users.$inferSelect;

export const HttpUserPostBodySchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  patronymic: z.string().optional(),
});

export const HttpItemResponseSchema = HttpUserPostBodySchema.extend({
  id: z.int(),
  patronymic: z.string().nullable(),
});

export type HttpUserPostBody = z.infer<typeof HttpUserPostBodySchema>;
export type HttpItemResponse = z.infer<typeof HttpItemResponseSchema>;
