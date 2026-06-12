import { z } from "zod";

export const HttpCredentialsBodySchema = z.object({
  email: z.email(),
  password: z.string(),
});

export const HttpTokenResponseSchema = z.object({
  token: z.string(),
});

export type HttpCredentialsBody = z.infer<typeof HttpCredentialsBodySchema>;
export type HttpTokenResponse = z.infer<typeof HttpTokenResponseSchema>;
