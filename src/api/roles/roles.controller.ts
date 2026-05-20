import { Elysia } from "elysia";
import { context } from "@/context";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import { AuthHeadersSchema, IdParamsSchema } from "@/api/shared/http.model";
import {
  HttpRoleBodySchema,
  HttpRoleResponseSchema,
  HttpRolesQuerySchema,
} from "./roles.model";
import { RolesServiceSingleton } from "./roles.service";

export const rolesController = new Elysia({ prefix: "roles" })
  .use(context)
  .get(
    "",
    async ({ query }) => RolesServiceSingleton.findAll(query),
    {
      query: HttpRolesQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ params: { id } }) => RolesServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: { 200: HttpRoleResponseSchema, 404: "error" },
    },
  )
  .post(
    "",
    async ({ body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return RolesServiceSingleton.create(currentUser, body);
    },
    {
      headers: AuthHeadersSchema,
      body: HttpRoleBodySchema,
      response: { 200: HttpRoleResponseSchema, 401: "error", 403: "error" },
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return RolesServiceSingleton.update(currentUser, id, body);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpRoleBodySchema.partial(),
      response: { 200: HttpRoleResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return RolesServiceSingleton.delete(currentUser, id);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      response: { 200: HttpRoleResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  );
