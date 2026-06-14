import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema, paginateSchema } from "@/api/shared/model";
import {
  ServiceInsertSchema,
  ServiceSelectSchema,
  ServiceQuerySchema,
} from "./services.model";
import { ServicesServiceSingleton } from "./services.service";

export const servicesController = new Elysia({ prefix: "services" })
  .use(context)
  .get("", async ({ query }) => ServicesServiceSingleton.findAll(query), {
    query: ServiceQuerySchema,
    response: {
      200: paginateSchema(ServiceSelectSchema),
    },
  })
  .get(
    "/:id",
    async ({ params: { id } }) => ServicesServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: {
        200: ServiceSelectSchema,
        404: "error",
      },
    },
  )
  .post("", async ({ body }) => ServicesServiceSingleton.create(body), {
    body: ServiceInsertSchema,
    response: {
      200: ServiceSelectSchema,
    },
    auth: "админ",
  })
  .put(
    "/:id",
    async ({ params: { id }, body }) =>
      ServicesServiceSingleton.update(id, body),
    {
      params: IdParamsSchema,
      body: ServiceInsertSchema.partial(),
      response: {
        200: ServiceSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => ServicesServiceSingleton.delete(id),
    {
      params: IdParamsSchema,
      response: {
        200: ServiceSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  );
