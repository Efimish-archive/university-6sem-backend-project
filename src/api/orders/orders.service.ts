import type {
  OrderInsert,
  OrderSelect,
  OrderQuery,
  OrderUpdateStatus,
  OrderAddServices,
} from "./orders.model";
import type { Paginated } from "@/api/shared/model";
import { OrderStatus } from "./orders.model";
import type { UserRole } from "../auth/auth.model";
import { count, and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { moneyVo, timeVo } from "@/api/shared/vo";

import { NotificationsServiceSingleton } from "./notifications.service";

const baseQuery = {
  with: {
    administrator: {
      with: {
        roleUser: {
          with: {
            role: true,
          },
        },
      },
    },
    customerCar: {
      with: {
        car: {
          with: {
            brand: true,
          },
        },
        customer: {
          with: {
            roleUser: {
              with: {
                role: true,
              },
            },
          },
        },
      },
    },
    employee: {
      with: {
        roleUser: {
          with: {
            role: true,
          },
        },
      },
    },
    orderService: {
      with: {
        service: true,
      },
    },
  },
} satisfies Parameters<typeof db.query.orders.findMany>[0];

type OrderSelectInternal = Awaited<
  ReturnType<typeof db.query.orders.findMany<typeof baseQuery>>
>[number];

const toResponse = (order: OrderSelectInternal): OrderSelect => ({
  id: order.id,
  administrator: {
    id: order.administrator.id,
    firstName: order.administrator.firstName,
    lastName: order.administrator.lastName,
    patronymic: order.administrator.patronymic,
    email: order.administrator.email,
    isSendNotify: order.administrator.isSendNotify,
    roles: order.administrator.roleUser.map((roleUser) => ({
      id: roleUser.role.id,
      name: roleUser.role.name,
    })),
  },
  customerCar: {
    id: order.customerCar.id,
    car: {
      id: order.customerCar.car.id,
      brand: {
        id: order.customerCar.car.brand.id,
        name: order.customerCar.car.brand.name,
      },
      model: order.customerCar.car.model,
    },
    customer: {
      id: order.customerCar.customer.id,
      firstName: order.customerCar.customer.firstName,
      lastName: order.customerCar.customer.lastName,
      patronymic: order.customerCar.customer.patronymic,
      email: order.customerCar.customer.email,
      isSendNotify: order.customerCar.customer.isSendNotify,
      roles: order.customerCar.customer.roleUser.map((roleUser) => ({
        id: roleUser.role.id,
        name: roleUser.role.name,
      })),
    },
    year: order.customerCar.year,
    number: order.customerCar.number,
  },
  employee: {
    id: order.employee.id,
    firstName: order.employee.firstName,
    lastName: order.employee.lastName,
    patronymic: order.employee.patronymic,
    email: order.employee.email,
    isSendNotify: order.employee.isSendNotify,
    roles: order.employee.roleUser.map((roleUser) => ({
      id: roleUser.role.id,
      name: roleUser.role.name,
    })),
  },
  status: order.status,
  startDate: order.startDate.toISOString(),
  endDate: order.endDate.toISOString(),
  totalPrice: order.totalPrice,
  services: order.orderService.map((orderService) => ({
    id: orderService.service.id,
    name: orderService.service.name,
    price: moneyVo(orderService.service.price),
    time: timeVo(orderService.service.time),
  })),
});

const NotFoundError = new HttpError(404, "Заказ не найден");
const CompletedOrderError = new HttpError(
  409,
  "Завершенный заказ нельзя редактировать",
);

class OrdersService {
  async findAllProtected(
    userId: number,
    userRole: UserRole,
    query: OrderQuery,
  ): Promise<Paginated<OrderSelect>> {
    const orderColumn = schema.orders[query.sortBy];
    const orderBy =
      query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);
    const customerCarSubquery = db
      .select({ id: schema.customerCars.id })
      .from(schema.customerCars)
      .where(eq(schema.customerCars.customerId, userId));
    const where = and(
      typeof query.status !== "undefined"
        ? eq(schema.orders.status, query.status)
        : undefined,
      userRole === "админ"
        ? and(
            query.employeeId
              ? eq(schema.orders.employeeId, query.employeeId)
              : undefined,
            query.customerId
              ? inArray(
                  schema.orders.customerCarId,
                  db
                    .select({ id: schema.customerCars.id })
                    .from(schema.customerCars)
                    .where(
                      eq(schema.customerCars.customerId, query.customerId),
                    ),
                )
              : undefined,
          )
        : userRole === "работник"
          ? eq(schema.orders.employeeId, userId)
          : userRole === "клиент"
            ? inArray(schema.orders.customerCarId, customerCarSubquery)
            : undefined,
    );

    const orders = await db.query.orders.findMany({
      ...baseQuery,
      where,
      orderBy,
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
    });

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(schema.orders)
      .where(where);

    return {
      data: orders.map(toResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async findByIdProtected(
    userId: number,
    userRole: UserRole,
    id: number,
  ): Promise<OrderSelect> {
    const customerCarSubquery = db
      .select({ id: schema.customerCars.id })
      .from(schema.customerCars)
      .where(eq(schema.customerCars.customerId, userId));
    const where =
      userRole === "работник"
        ? eq(schema.orders.employeeId, userId)
        : userRole === "клиент"
          ? inArray(schema.orders.customerCarId, customerCarSubquery)
          : undefined;
    const order = await db.query.orders.findFirst({
      ...baseQuery,
      where: and(where, eq(schema.users.id, id)),
    });
    if (!order) throw NotFoundError;
    return toResponse(order);
  }

  private async findById(id: number): Promise<OrderSelect> {
    const order = await db.query.orders.findFirst({
      ...baseQuery,
      where: eq(schema.orders.id, id),
    });
    if (!order) throw NotFoundError;
    return toResponse(order);
  }

  async create(userId: number, data: OrderInsert) {
    const services = await this.getServices(data.serviceIds);
    const startDate = new Date();
    const totalSeconds = services.reduce(
      (sum, service) => sum + service.time,
      0,
    );
    const totalKopecks = services.reduce(
      (sum, service) => sum + service.price,
      0,
    );
    const endDate = new Date(startDate.getTime() + totalSeconds * 1000);

    const [order] = await db
      .insert(schema.orders)
      .values({
        administratorId: userId,
        customerCarId: data.customerCarId,
        employeeId: data.employeeId,
        status: OrderStatus["в работе"],
        startDate,
        endDate,
        totalPrice: totalKopecks,
      })
      .returning();

    await db.insert(schema.orderService).values(
      services.map((service) => ({
        orderId: order.id,
        serviceId: service.id,
      })),
    );

    return this.findById(order.id);
  }

  async update(id: number, data: Partial<OrderInsert>) {
    const oldOrder = await this.findById(id);
    if (oldOrder.status === OrderStatus["завершен"]) throw CompletedOrderError;
    await db.update(schema.orders).set(data).where(eq(schema.orders.id, id));
    await this.recalculateOrder(id);
    return this.findById(id);
  }

  async delete(id: number) {
    const order = await this.findById(id);

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.orderService)
        .where(eq(schema.orderService.orderId, id));
      await tx
        .delete(schema.orders)
        .where(eq(schema.orders.id, id))
        .returning();
    });

    return order;
  }

  async updateStatus(id: number, data: OrderUpdateStatus) {
    const oldOrder = await this.findById(id);

    if (oldOrder.status === data.status) {
      throw new HttpError(400, "Нельзя установить тот же статус");
    }

    if (
      oldOrder.status === OrderStatus["завершен"] &&
      data.status === OrderStatus["в работе"]
    ) {
      throw new HttpError(409, "Нельзя вернуть завершенный заказ в работу");
    }

    await db
      .update(schema.orders)
      .set({ status: data.status })
      .where(eq(schema.orders.id, id));

    const updatedOrder = await this.findById(id);

    if (
      data.status === OrderStatus["завершен"] &&
      updatedOrder.customerCar.customer.isSendNotify
    ) {
      await NotificationsServiceSingleton.sendOrderCompletedEmail(
        updatedOrder.customerCar.customer.email,
        updatedOrder.id,
      );
    }

    return updatedOrder;
  }

  async addServices(id: number, data: OrderAddServices) {
    const order = await this.findById(id);
    if (order.status === OrderStatus["завершен"]) throw CompletedOrderError;

    const existingIds = new Set(order.services.map((service) => service.id));
    const duplicateIds = data.serviceIds.filter((serviceId) =>
      existingIds.has(serviceId),
    );
    if (duplicateIds.length > 0) {
      const duplicateNames = order.services
        .filter((service) => duplicateIds.includes(service.id))
        .map((service) => service.name)
        .join(", ");
      throw new HttpError(
        409,
        `Данная услуга уже присутствует в заказе: ${duplicateNames}`,
      );
    }

    const services = await this.getServices(data.serviceIds);
    await db.insert(schema.orderService).values(
      services.map((service) => ({
        orderId: id,
        serviceId: service.id,
      })),
    );

    await this.recalculateOrder(id);
    return this.findById(id);
  }

  private async getServices(serviceIds: number[]) {
    const uniqueIds = [...new Set(serviceIds)];
    if (uniqueIds.length !== serviceIds.length) {
      throw new HttpError(409, "В запросе есть повторяющиеся услуги");
    }

    const services = await db.query.services.findMany({
      where: inArray(schema.services.id, uniqueIds),
    });

    if (services.length !== uniqueIds.length) {
      throw new HttpError(404, "Одна или несколько услуг не найдены");
    }

    return services;
  }

  private async recalculateOrder(orderId: number) {
    const order = await this.findById(orderId);

    const totalSeconds = order.services.reduce(
      (sum, service) => sum + service.time.second,
      0,
    );
    const totalKopecks = order.services.reduce(
      (sum, service) => sum + service.price.kopecks,
      0,
    );
    const endDate = new Date(
      new Date(order.startDate).getTime() + totalSeconds * 1000,
    );

    await db
      .update(schema.orders)
      .set({ endDate, totalPrice: totalKopecks })
      .where(eq(schema.orders.id, orderId));
  }
}

export const OrdersServiceSingleton = new OrdersService();
