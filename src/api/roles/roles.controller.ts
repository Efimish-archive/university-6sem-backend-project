import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema } from "@/api/shared/http.model";
import {
  RoleInsertSchema,
  RoleSelectSchema,
  RolesListSelectSchema,
  RolesQuerySchema,
} from "./roles.model";
import { RolesServiceSingleton } from "./roles.service";

export const rolesController = new Elysia({ prefix: "roles" })
  .use(context)
  .get("", async ({ query }) => RolesServiceSingleton.findAll(query), {
    query: RolesQuerySchema,
    response: {
      200: RolesListSelectSchema,
    },
  })
  .get(
    "/:id",
    async ({ params: { id } }) => RolesServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: {
        200: RoleSelectSchema,
        404: "error",
      },
    },
  )
  .post("", async ({ body }) => RolesServiceSingleton.create(body), {
    body: RoleInsertSchema,
    response: {
      200: RoleSelectSchema,
    },
    auth: "админ",
  })
  .put(
    "/:id",
    async ({ params: { id }, body }) => RolesServiceSingleton.update(id, body),
    {
      params: IdParamsSchema,
      body: RoleInsertSchema.partial(),
      response: {
        200: RoleSelectSchema,
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
        200: RoleSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  );
