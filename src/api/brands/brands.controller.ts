import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema, paginateSchema } from "@/api/shared/model";
import {
  BrandInsertSchema,
  BrandSelectSchema,
  BrandQuerySchema,
} from "./brands.model";
import { BrandsServiceSingleton } from "./brands.service";

export const brandsController = new Elysia({ prefix: "brands" })
  .use(context)
  .get("", async ({ query }) => BrandsServiceSingleton.findAll(query), {
    query: BrandQuerySchema,
    response: {
      200: paginateSchema(BrandSelectSchema),
    },
  })
  .get(
    "/:id",
    async ({ params: { id } }) => BrandsServiceSingleton.findById(id),
    {
      params: IdParamsSchema,
      response: {
        200: BrandSelectSchema,
        404: "error",
      },
    },
  )
  .post("", async ({ body }) => BrandsServiceSingleton.create(body), {
    body: BrandInsertSchema,
    response: {
      200: BrandSelectSchema,
    },
    auth: "админ",
  })
  .put(
    "/:id",
    async ({ params: { id }, body }) => BrandsServiceSingleton.update(id, body),
    {
      params: IdParamsSchema,
      body: BrandInsertSchema.partial(),
      response: {
        200: BrandSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => BrandsServiceSingleton.delete(id),
    {
      params: IdParamsSchema,
      response: {
        200: BrandSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  );
