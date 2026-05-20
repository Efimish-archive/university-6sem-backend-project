import { Elysia } from "elysia";
import { HttpUserPostBodySchema, HttpItemResponseSchema, HttpUsersQuerySchema } from "./users.model";
import { UsersServiceSingleton } from "./users.service";
import { context } from "@/context";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import { AuthHeadersSchema, IdParamsSchema } from "@/api/shared/http.model";

export const usersController = new Elysia({ prefix: "users" })
  .use(context)
  .get(
    "",
    async ({ query }) => UsersServiceSingleton.findAll(query),
    {
      query: HttpUsersQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ params: { id } }) => {
      const user = await UsersServiceSingleton.findById(id);
      return user;
    },
    {
      params: IdParamsSchema,
      response: {
        200: HttpItemResponseSchema,
        404: "error",
      },
    },
  )
  .post(
    "",
    async ({ body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      const user = await UsersServiceSingleton.create(currentUser, body);
      return user;
    },
    {
      headers: AuthHeadersSchema,
      body: HttpUserPostBodySchema,
      response: { 200: HttpItemResponseSchema },
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      const user = await UsersServiceSingleton.update(currentUser, id, body);
      return user;
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpUserPostBodySchema.partial(),
      response: {
        200: HttpItemResponseSchema,
        404: "error",
      },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      const user = await UsersServiceSingleton.delete(currentUser, id);
      return user;
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      response: {
        200: HttpItemResponseSchema,
        404: "error",
      },
    },
  );
