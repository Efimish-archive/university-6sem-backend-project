import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema } from "@/api/shared/http.model";
import {
  UserSelectSchema,
  HttpUsersListResponseSchema,
  HttpUserPostBodySchema,
  HttpUsersQuerySchema,
} from "./users.model";
import { UsersServiceSingleton } from "./users.service";

export const usersController = new Elysia({ prefix: "users" })
  .use(context)
  .get("", async ({ query }) => UsersServiceSingleton.findAll(query), {
    query: HttpUsersQuerySchema,
    response: {
      200: HttpUsersListResponseSchema,
    },
  })
  .get(
    "/:id",
    async ({ params: { id } }) => UsersServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: {
        200: UserSelectSchema,
        404: "error",
      },
    },
  )
  .post("", async ({ body }) => UsersServiceSingleton.create(body), {
    body: HttpUserPostBodySchema,
    response: {
      200: UserSelectSchema,
    },
    auth: "админ",
  })
  .put(
    "/:id",
    async ({ params: { id }, body }) => UsersServiceSingleton.update(id, body),
    {
      params: IdParamsSchema,
      body: HttpUserPostBodySchema.partial(),
      response: {
        200: UserSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => UsersServiceSingleton.delete(id),
    {
      params: IdParamsSchema,
      response: {
        200: UserSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  );
