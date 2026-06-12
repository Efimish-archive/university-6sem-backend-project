import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema } from "@/api/shared/http.model";
import {
  HttpRoleBodySchema,
  HttpRolesListResponseSchema,
  HttpRoleResponseSchema,
  HttpRolesQuerySchema,
} from "./roles.model";
import { RolesServiceSingleton } from "./roles.service";

export const rolesController = new Elysia({ prefix: "roles" })
  .use(context)
  .get("", async ({ query }) => RolesServiceSingleton.findAll(query), {
    query: HttpRolesQuerySchema,
    response: {
      200: HttpRolesListResponseSchema,
    },
  })
  .get(
    "/:id",
    async ({ params: { id } }) => RolesServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: {
        200: HttpRoleResponseSchema,
        404: "error",
      },
    },
  )
  .post("", async ({ body }) => RolesServiceSingleton.create(body), {
    body: HttpRoleBodySchema,
    response: {
      200: HttpRoleResponseSchema,
    },
    auth: "админ",
  })
  .put(
    "/:id",
    async ({ params: { id }, body }) => RolesServiceSingleton.update(id, body),
    {
      params: IdParamsSchema,
      body: HttpRoleBodySchema.partial(),
      response: {
        200: HttpRoleResponseSchema,
        404: "error",
      },
      auth: "админ",
    },
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => RolesServiceSingleton.delete(id),
    {
      params: IdParamsSchema,
      response: {
        200: HttpRoleResponseSchema,
        404: "error",
      },
      auth: "админ",
    },
  );
