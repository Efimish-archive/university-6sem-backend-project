import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { env } from "@/env";
import { usersController } from "@/api/users/users.controller";

new Elysia()
  .use(
    openapi({
      path: "",
    }),
  )
  .use(usersController)
  .listen(env.PORT);

console.log(`🦊 Elysia is running at http://127.0.0.1:${env.PORT}`);
