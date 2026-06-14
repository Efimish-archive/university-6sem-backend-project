import { Elysia } from "elysia";
import { context } from "@/context";
import { IdParamsSchema, paginateSchema } from "@/api/shared/model";
import {
  OrderInsertSchema,
  OrderSelectSchema,
  OrderQuerySchema,
  OrderUpdateStatusSchema,
  OrderAddServicesSchema,
} from "./orders.model";
import { OrdersServiceSingleton } from "./orders.service";

export const ordersController = new Elysia({ prefix: "orders" })
  .use(context)
  .get(
    "",
    async ({ query, auth }) =>
      OrdersServiceSingleton.findAllProtected(
        Number(auth.sub),
        auth.role,
        query,
      ),
    {
      query: OrderQuerySchema,
      response: {
        200: paginateSchema(OrderSelectSchema),
      },
      auth: ["клиент", "работник", "админ"],
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, auth }) => {
      return OrdersServiceSingleton.findByIdProtected(
        Number(auth.sub),
        auth.role,
        id,
      );
    },
    {
      params: IdParamsSchema,
      response: {
        200: OrderSelectSchema,
        404: "error",
      },
      auth: ["клиент", "работник", "админ"],
    },
  )
  .post(
    "",
    async ({ body, auth }) =>
      OrdersServiceSingleton.create(Number(auth.sub), body),
    {
      body: OrderInsertSchema,
      response: {
        200: OrderSelectSchema,
      },
      auth: "админ",
    },
  )
  .put(
    "/:id",
    async ({ params: { id }, body }) => OrdersServiceSingleton.update(id, body),
    {
      params: IdParamsSchema,
      body: OrderInsertSchema.partial(),
      response: {
        200: OrderSelectSchema,
        404: "error",
        409: "error",
      },
      auth: "админ",
    },
  )
  .delete(
    "/:id",
    async ({ params: { id } }) => OrdersServiceSingleton.delete(id),
    {
      params: IdParamsSchema,
      response: {
        200: OrderSelectSchema,
        404: "error",
      },
      auth: "админ",
    },
  )
  .patch(
    "/:id/status",
    async ({ params: { id }, body }) =>
      OrdersServiceSingleton.updateStatus(id, body),
    {
      params: IdParamsSchema,
      body: OrderUpdateStatusSchema,
      response: {
        200: OrderSelectSchema,
        404: "error",
        409: "error",
      },
      auth: "админ",
    },
  )
  .post(
    "/:id/services",
    async ({ params: { id }, body }) =>
      OrdersServiceSingleton.addServices(id, body),
    {
      params: IdParamsSchema,
      body: OrderAddServicesSchema,
      response: {
        200: OrderSelectSchema,
        404: "error",
        409: "error",
      },
      auth: "админ",
    },
  );
