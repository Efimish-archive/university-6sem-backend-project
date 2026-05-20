import { Elysia } from "elysia";
import { context } from "@/context";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import { AuthHeadersSchema, IdParamsSchema } from "@/api/shared/http.model";
import {
  HttpBrandBodySchema,
  HttpBrandResponseSchema,
  HttpBrandsQuerySchema,
} from "./brands.model";
import { BrandsServiceSingleton } from "./brands.service";

export const brandsController = new Elysia({ prefix: "brands" })
  .use(context)
  .get("", async ({ query }) => BrandsServiceSingleton.findAll(query), {
    query: HttpBrandsQuerySchema,
  })
  .get("/:id", async ({ params: { id } }) => BrandsServiceSingleton.findById(id), {
    params: IdParamsSchema,
    response: { 200: HttpBrandResponseSchema, 404: "error" },
  })
  .post(
    "",
    async ({ body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return BrandsServiceSingleton.create(currentUser, body);
    },
    {
      headers: AuthHeadersSchema,
      body: HttpBrandBodySchema,
      response: { 200: HttpBrandResponseSchema, 401: "error", 403: "error" },
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return BrandsServiceSingleton.update(currentUser, id, body);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpBrandBodySchema.partial(),
      response: { 200: HttpBrandResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return BrandsServiceSingleton.delete(currentUser, id);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      response: { 200: HttpBrandResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  );
