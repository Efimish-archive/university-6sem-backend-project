import { z } from "zod";

export const UserRoleSchema = z.enum(["админ", "работник", "клиент"]);

export const CredentialsSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const TokenSchema = z.object({
  token: z.string(),
});

export type UserRole = z.infer<typeof UserRoleSchema>;
export type Credentials = z.infer<typeof CredentialsSchema>;
export type Token = z.infer<typeof TokenSchema>;
