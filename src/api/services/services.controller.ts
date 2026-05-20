import { Elysia } from "elysia";
import { context } from "@/context";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import { AuthHeadersSchema, IdParamsSchema } from "@/api/shared/http.model";
import {
  HttpServiceBodySchema,
  HttpServiceResponseSchema,
  HttpServicesQuerySchema,
} from "./services.model";
import { ServicesServiceSingleton } from "./services.service";

export const servicesController = new Elysia({ prefix: "services" })
  .use(context)
  .get("", async ({ query }) => ServicesServiceSingleton.findAll(query), {
    query: HttpServicesQuerySchema,
  })
  .get("/:id", async ({ params: { id } }) => ServicesServiceSingleton.findById(id), {
    params: IdParamsSchema,
    response: { 200: HttpServiceResponseSchema, 404: "error" },
  })
  .post(
    "",
    async ({ body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return ServicesServiceSingleton.create(currentUser, body);
    },
    {
      headers: AuthHeadersSchema,
      body: HttpServiceBodySchema,
      response: { 200: HttpServiceResponseSchema, 401: "error", 403: "error" },
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return ServicesServiceSingleton.update(currentUser, id, body);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpServiceBodySchema.partial(),
      response: { 200: HttpServiceResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return ServicesServiceSingleton.delete(currentUser, id);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      response: { 200: HttpServiceResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  );
