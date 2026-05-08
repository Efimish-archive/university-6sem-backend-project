import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { env } from "@/env";

new Elysia()
  .use(
    openapi({
      path: "",
    }),
  )
  .get("/hello", () => "Hello Elysia")
  .listen(env.PORT);

console.log(`🦊 Elysia is running at http://127.0.0.1:${env.PORT}`);
