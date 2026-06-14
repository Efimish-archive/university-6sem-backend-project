import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema, paginateSchema } from "@/api/shared/model";
import {
  CustomerCarInsertSchema,
  CustomerCarSelectSchema,
  CustomerCarQuerySchema,
} from "./customer-cars.model";
import { CustomerCarsServiceSingleton } from "./customer-cars.service";

export const customerCarsController = new Elysia({ prefix: "customer-cars" })
  .use(context)
  .get("", async ({ query }) => CustomerCarsServiceSingleton.findAll(query), {
    query: CustomerCarQuerySchema,
    response: {
      200: paginateSchema(CustomerCarSelectSchema),
    },
  })
  .get(
    "/:id",
    async ({ params: { id } }) => CustomerCarsServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: {
        200: CustomerCarSelectSchema,
        404: "error",
      },
    },
  )
  .post("", async ({ body }) => CustomerCarsServiceSingleton.create(body), {
    body: CustomerCarInsertSchema,
    response: {
      200: CustomerCarSelectSchema,
    },
    auth: "админ",
  })
  .put(
    "/:id",
    async ({ params: { id }, body }) =>
      CustomerCarsServiceSingleton.update(id, body),
    {
      params: IdParamsSchema,
      body: CustomerCarInsertSchema.partial(),
      response: {
        200: CustomerCarSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => CustomerCarsServiceSingleton.delete(id),
    {
      params: IdParamsSchema,
      response: {
        200: CustomerCarSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  );
