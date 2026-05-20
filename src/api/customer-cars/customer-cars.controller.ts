import { Elysia } from "elysia";
import { context } from "@/context";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import { AuthHeadersSchema, IdParamsSchema } from "@/api/shared/http.model";
import {
  HttpCustomerCarBodySchema,
  HttpCustomerCarResponseSchema,
  HttpCustomerCarsQuerySchema,
} from "./customer-cars.model";
import { CustomerCarsServiceSingleton } from "./customer-cars.service";

export const customerCarsController = new Elysia({ prefix: "customer-cars" })
  .use(context)
  .get("", async ({ query }) => CustomerCarsServiceSingleton.findAll(query), {
    query: HttpCustomerCarsQuerySchema,
  })
  .get(
    "/:id",
    async ({ params: { id } }) => CustomerCarsServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: { 200: HttpCustomerCarResponseSchema, 404: "error" },
    },
  )
  .post(
    "",
    async ({ body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return CustomerCarsServiceSingleton.create(currentUser, body);
    },
    {
      headers: AuthHeadersSchema,
      body: HttpCustomerCarBodySchema,
      response: { 401: "error", 403: "error" },
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return CustomerCarsServiceSingleton.update(currentUser, id, body);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpCustomerCarBodySchema.partial(),
      response: { 401: "error", 403: "error", 404: "error" },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return CustomerCarsServiceSingleton.delete(currentUser, id);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      response: { 401: "error", 403: "error", 404: "error" },
    },
  );
