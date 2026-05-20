import { Elysia } from "elysia";
import { context } from "@/context";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import { AuthHeadersSchema, IdParamsSchema } from "@/api/shared/http.model";
import {
  HttpCarBodySchema,
  HttpCarResponseSchema,
  HttpCarsQuerySchema,
} from "./cars.model";
import { CarsServiceSingleton } from "./cars.service";

export const carsController = new Elysia({ prefix: "cars" })
  .use(context)
  .get("", async ({ query }) => CarsServiceSingleton.findAll(query), {
    query: HttpCarsQuerySchema,
  })
  .get("/:id", async ({ params: { id } }) => CarsServiceSingleton.findById(id), {
    params: IdParamsSchema,
    response: { 200: HttpCarResponseSchema, 404: "error" },
  })
  .post(
    "",
    async ({ body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return CarsServiceSingleton.create(currentUser, body);
    },
    {
      headers: AuthHeadersSchema,
      body: HttpCarBodySchema,
      response: { 200: HttpCarResponseSchema, 401: "error", 403: "error" },
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return CarsServiceSingleton.update(currentUser, id, body);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpCarBodySchema.partial(),
      response: { 200: HttpCarResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return CarsServiceSingleton.delete(currentUser, id);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      response: { 200: HttpCarResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  );
