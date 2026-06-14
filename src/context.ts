import { Elysia, StatusMap } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { jwt } from "@elysiajs/jwt";
import { z } from "zod";
import { env } from "./env";
import { HttpError } from "@/error";
import { UserRoleSchema, type UserRole } from "@/api/auth/auth.model";

const UnauthorizedError = new HttpError(401, "Вы не авторизованы");
const ForbiddenError = new HttpError(403, "У вас недостаточно прав");

export const context = new Elysia({ name: "context" })
  .use(bearer())
  .use(
    jwt({
      name: "jwt",
      secret: env.JWT_SECRET,
      exp: "7d",
      schema: z.object({
        sub: z.string(),
        role: UserRoleSchema,
      }),
    }),
  )
  .model({
    error: z.object({
      error: z.string(),
      code: z.enum(StatusMap),
    }),
  })
  .macro({
    auth: (roles: UserRole | UserRole[]) => ({
      detail: {
        security: [{ bearerAuth: [] }],
      },
      response: {
        401: "error",
        403: "error",
      },
      resolve: async ({ bearer, jwt }) => {
        if (!bearer) throw UnauthorizedError;

        const auth = await jwt.verify(bearer);
        if (!auth) throw UnauthorizedError;

        if (!Array.isArray(roles)) roles = [roles];
        if (!roles.includes(auth.role)) throw ForbiddenError;

        return { auth };
      },
    }),
  });
