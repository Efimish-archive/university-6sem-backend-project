import { Elysia } from "elysia";
import { context } from "@/context";
import { AuthServiceSingleton } from "./auth.service";
import {
  HttpCredentialsBodySchema,
  HttpTokenResponseSchema,
} from "./auth.model";

export const authController = new Elysia({ prefix: "/auth" }) //
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
      body: HttpCredentialsBodySchema,
      response: {
        200: HttpTokenResponseSchema,
        400: "error",
      },
    },
  );
