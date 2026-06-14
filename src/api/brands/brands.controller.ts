import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema } from "@/api/shared/http.model";
import {
  BrandInsertSchema,
  BrandSelectSchema,
  BrandsListSelectSchema,
  BrandsQuerySchema,
} from "./brands.model";
import { BrandsServiceSingleton } from "./brands.service";

export const brandsController = new Elysia({ prefix: "brands" })
  .use(context)
  .get("", async ({ query }) => BrandsServiceSingleton.findAll(query), {
    query: BrandsQuerySchema,
    response: {
      200: BrandsListSelectSchema,
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
