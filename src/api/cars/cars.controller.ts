import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema, paginateSchema } from "@/api/shared/model";
import { CarInsertSchema, CarSelectSchema, CarQuerySchema } from "./cars.model";
import { CarsServiceSingleton } from "./cars.service";

export const carsController = new Elysia({ prefix: "cars" })
  .use(context)
  .get("", async ({ query }) => CarsServiceSingleton.findAll(query), {
    query: CarQuerySchema,
    response: {
      200: paginateSchema(CarSelectSchema),
    },
  })
  .get(
    "/:id",
    async ({ params: { id } }) => CarsServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: {
        200: CarSelectSchema,
        404: "error",
      },
    },
  )
  .post("", async ({ body }) => CarsServiceSingleton.create(body), {
    body: CarInsertSchema,
    response: {
      200: CarSelectSchema,
    },
    auth: "админ",
  })
  .put(
    "/:id",
    async ({ params: { id }, body }) => CarsServiceSingleton.update(id, body),
    {
      params: IdParamsSchema,
      body: CarInsertSchema.partial(),
      response: {
        200: CarSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => CarsServiceSingleton.delete(id),
    {
      params: IdParamsSchema,
      response: {
        200: CarSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  );
