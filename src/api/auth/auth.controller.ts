import { Elysia } from "elysia";
import { context } from "@/context";
import { CredentialsSchema, TokenSchema } from "./auth.model";
import { AuthServiceSingleton } from "./auth.service";

export const authController = new Elysia({ prefix: "auth" }) //
  .use(context)
  .post(
    "/login",
    async ({ body, jwt }) => {
      const token = await AuthServiceSingleton.login(
        body.email,
        body.password,
        jwt,
      );
      return token;
    },
    {
      body: CredentialsSchema,
      response: {
        200: TokenSchema,
        400: "error",
      },
    },
  );
