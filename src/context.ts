import { Elysia } from "elysia";
// import { bearer } from "@elysiajs/bearer";
// import { jwt } from "@elysiajs/jwt";
import { z } from "zod";
// import { env } from "./env";
// import { HttpError } from "@/error";
// import { UserRoleSchema } from "@/modules/auth/auth.model";

// const AuthSchema = z.object({
//   sub: z.string(),
//   role: UserRoleSchema,
// });

export const context = new Elysia({ name: "context" })
  // .use(bearer())
  // .use(
  //   jwt({
  //     name: "jwt",
  //     secret: env.JWT_SECRET,
  //     exp: "7d",
  //   })
  // )
  .model({
    error: z.object({
      error: z.string(),
    }),
    message: z.object({
      message: z.string(),
    }),
  })
  // .macro("auth", {
  //   detail: {
  //     security: [{ bearerAuth: [] }]
  //   },
  //   headers: z.object({
  //     authorization: z.string().startsWith("Bearer "),
  //   }),
  //   response: {
  //     401: "error",
  //   },
  //   resolve: async ({ bearer, jwt, status }) => {
  //     const error = status(401, { error: "Вы не авторизованы" });
  //     if (!bearer) return error;

  //     const auth = await jwt.verify(bearer);
  //     if (!auth) return error;

  //     const { data } = AuthSchema.safeParse(auth);
  //     if (!data) return error;

  //     return { auth: data };
  //   },
  // })
  // .macro("authAdmin", {
  //   auth: true,
  //   response: {
  //     403: "error",
  //   },
  //   resolve: ({ auth, status }) => {
  //     if (auth.role !== "admin") return status(403, {
  //       error: "У вас недостаточно прав",
  //     });
  //   },
  // })
