import { z } from "zod";

export const UserRoleSchema = z.enum(["админ", "работник", "клиент"]);

export const HttpCredentialsBodySchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const HttpTokenResponseSchema = z.object({
  token: z.string(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type HttpCredentialsBody = z.infer<typeof HttpCredentialsBodySchema>;
export type HttpTokenResponse = z.infer<typeof HttpTokenResponseSchema>;
