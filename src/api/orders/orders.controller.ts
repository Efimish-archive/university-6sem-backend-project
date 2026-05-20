import { Elysia } from "elysia";
import { context } from "@/context";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import { AuthHeadersSchema, IdParamsSchema } from "@/api/shared/http.model";
import {
  HttpOrderCreateBodySchema,
  HttpOrderResponseSchema,
  HttpOrderServicesBodySchema,
  HttpOrderStatusBodySchema,
  HttpOrderUpdateBodySchema,
  HttpOrdersQuerySchema,
} from "./orders.model";
import { OrdersServiceSingleton } from "./orders.service";

export const ordersController = new Elysia({ prefix: "orders" })
  .use(context)
  .get(
    "",
    async ({ query, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return OrdersServiceSingleton.findAll(currentUser, query);
    },
    {
      headers: AuthHeadersSchema,
      query: HttpOrdersQuerySchema,
      response: { 401: "error", 403: "error" },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return OrdersServiceSingleton.findById(currentUser, id);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      response: { 200: HttpOrderResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  )
  .post(
    "",
    async ({ body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return OrdersServiceSingleton.create(currentUser, body);
    },
    {
      headers: AuthHeadersSchema,
      body: HttpOrderCreateBodySchema,
      response: { 200: HttpOrderResponseSchema, 401: "error", 403: "error" },
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return OrdersServiceSingleton.update(currentUser, id, body);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpOrderUpdateBodySchema,
      response: { 200: HttpOrderResponseSchema, 401: "error", 403: "error", 404: "error", 409: "error" },
    },
  )
  .patch(
    "/:id/status",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return OrdersServiceSingleton.updateStatus(currentUser, id, body);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpOrderStatusBodySchema,
      response: { 200: HttpOrderResponseSchema, 401: "error", 403: "error", 404: "error", 409: "error" },
    },
  )
  .post(
    "/:id/services",
    async ({ params: { id }, body, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return OrdersServiceSingleton.addServices(currentUser, id, body);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      body: HttpOrderServicesBodySchema,
      response: { 200: HttpOrderResponseSchema, 401: "error", 403: "error", 404: "error", 409: "error" },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, headers }) => {
      const currentUser = await AuthServiceSingleton.getCurrentUser(headers["x-user-id"]);
      return OrdersServiceSingleton.delete(currentUser, id);
    },
    {
      headers: AuthHeadersSchema,
      params: IdParamsSchema,
      response: { 200: HttpOrderResponseSchema, 401: "error", 403: "error", 404: "error" },
    },
  );
