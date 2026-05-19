import { Elysia } from "elysia";
import { z } from "zod";
import { HttpUserPostBodySchema, HttpItemResponseSchema } from "./users.model";
import { UsersServiceSingleton } from "./users.service";
import { context } from "@/context";

const ParamsSchema = z.object({
  id: z.coerce.number(),
});

export const usersController = new Elysia({ prefix: "users" })
  .use(context)
  .get(
    "",
    async () => {
      const users = await UsersServiceSingleton.findAll();
      return users;
    },
    {
      response: { 200: HttpItemResponseSchema.array() },
    },
  )
  .get(
    "/:id",
    async ({ params: { id } }) => {
      const user = await UsersServiceSingleton.findById(id);
      return user;
    },
    {
      params: ParamsSchema,
      response: {
        200: HttpItemResponseSchema,
        404: "error",
      },
    },
  )
  .post(
    "",
    async ({ body }) => {
      const user = await UsersServiceSingleton.create(body);
      return user;
    },
    {
      body: HttpUserPostBodySchema,
      response: { 200: HttpItemResponseSchema },
      authAdmin: true,
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      const user = await UsersServiceSingleton.update(id, body);
      return user;
    },
    {
      params: ParamsSchema,
      body: HttpUserPostBodySchema,
      response: {
        200: HttpItemResponseSchema,
        404: "error",
      },
      authAdmin: true,
    },
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      const user = await UsersServiceSingleton.delete(id);
      return user;
    },
    {
      params: ParamsSchema,
      response: {
        200: HttpItemResponseSchema,
        404: "error",
      },
      authAdmin: true,
    },
  );
