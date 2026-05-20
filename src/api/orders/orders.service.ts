import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { listResponse, toLimitOffset } from "@/api/shared/http.model";
import {
  ForbiddenError,
  ROLE,
  AuthServiceSingleton,
  type CurrentUser,
} from "@/api/shared/auth.service";
import {
  kopecksToRubles,
  moneyVo,
  secondsToMinutes,
  timeVo,
} from "@/api/shared/vo";
import {
  ORDER_STATUS,
  type HttpOrderCreateBody,
  type HttpOrderServicesBody,
  type HttpOrderStatusBody,
  type HttpOrderUpdateBody,
  type HttpOrdersQuery,
} from "./orders.model";
import { NotificationsServiceSingleton } from "./notifications.service";

const NotFoundError = new HttpError(404, "Заказ не найден");
const CompletedOrderError = new HttpError(
  409,
  "Завершенный заказ нельзя редактировать",
);

const fullName = (user: {
  firstName: string;
  lastName: string;
  patronymic: string | null;
}) => [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(" ");

type OrderDetails = NonNullable<Awaited<ReturnType<OrdersService["findOrderDetails"]>>>;

const isAdmin = (currentUser: CurrentUser) =>
  currentUser.roles.includes(ROLE.administrator);
const isEmployee = (currentUser: CurrentUser) =>
  currentUser.roles.includes(ROLE.employee);
const isCustomer = (currentUser: CurrentUser) =>
  currentUser.roles.includes(ROLE.customer);

class OrdersService {
  async findAll(currentUser: CurrentUser, query: HttpOrdersQuery) {
    const { limit, offset } = toLimitOffset(query);
    const orderColumn = schema.orders[query.sortBy];
    const employeeFilter =
      isAdmin(currentUser) && query.employeeId
        ? query.employeeId
        : isEmployee(currentUser)
          ? currentUser.id
          : undefined;

    const items = await db.query.orders.findMany({
      where: and(
        query.status ? eq(schema.orders.status, query.status) : undefined,
        employeeFilter ? eq(schema.orders.employeeId, employeeFilter) : undefined,
      ),
      with: this.orderWith,
      orderBy: query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn),
    });

    const visibleItems = items
      .filter((order) => this.canView(currentUser, order))
      .filter((order) =>
        isAdmin(currentUser) && query.customerId
          ? order.customerCar.customerId === query.customerId
          : true,
      )
      .slice(offset, offset + limit)
      .map((order) => this.toResponse(order));

    return listResponse(visibleItems, query);
  }

  async findById(currentUser: CurrentUser, id: number) {
    const order = await this.findOrderDetails(id);
    if (!order) throw NotFoundError;
    this.requireCanView(currentUser, order);
    return this.toResponse(order);
  }

  async create(currentUser: CurrentUser, data: HttpOrderCreateBody) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const services = await this.getServices(data.serviceIds);
    const startDate = new Date();
    const totalSeconds = services.reduce((sum, service) => sum + service.time, 0);
    const endDate = new Date(startDate.getTime() + totalSeconds * 1000);

    const [order] = await db
      .insert(schema.orders)
      .values({
        administratorId: currentUser.id,
        customerCarId: data.customerCarId,
        employeeId: data.employeeId,
        status: ORDER_STATUS.inProgress,
        startDate,
        endDate,
      })
      .returning();

    await db.insert(schema.orderService).values(
      services.map((service) => ({
        orderId: order.id,
        serviceId: service.id,
      })),
    );

    return this.findById(currentUser, order.id);
  }

  async update(
    currentUser: CurrentUser,
    id: number,
    data: HttpOrderUpdateBody,
  ) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const order = await this.findOrderDetails(id);
    if (!order) throw NotFoundError;
    this.requireEditable(order);

    await db.update(schema.orders).set(data).where(eq(schema.orders.id, id));
    await this.recalculateEndDate(id);
    return this.findById(currentUser, id);
  }

  async delete(currentUser: CurrentUser, id: number) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const order = await this.findOrderDetails(id);
    if (!order) throw NotFoundError;

    await db.delete(schema.orderService).where(eq(schema.orderService.orderId, id));
    const [deleted] = await db
      .delete(schema.orders)
      .where(eq(schema.orders.id, id))
      .returning();
    return this.toResponse({ ...order, ...deleted });
  }

  async updateStatus(
    currentUser: CurrentUser,
    id: number,
    data: HttpOrderStatusBody,
  ) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const order = await this.findOrderDetails(id);
    if (!order) throw NotFoundError;

    if (
      order.status === ORDER_STATUS.completed &&
      data.status === ORDER_STATUS.inProgress
    ) {
      throw new HttpError(409, "Нельзя вернуть завершенный заказ в работу");
    }

    await db
      .update(schema.orders)
      .set({ status: data.status })
      .where(eq(schema.orders.id, id));

    const updated = await this.findOrderDetails(id);
    if (!updated) throw NotFoundError;

    if (
      data.status === ORDER_STATUS.completed &&
      updated.customerCar.customer?.isSendNotify
    ) {
      await NotificationsServiceSingleton.sendOrderCompletedEmail(
        updated.customerCar.customer.email,
        updated.id,
      );
    }

    return this.toResponse(updated);
  }

  async addServices(
    currentUser: CurrentUser,
    id: number,
    data: HttpOrderServicesBody,
  ) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const order = await this.findOrderDetails(id);
    if (!order) throw NotFoundError;
    this.requireEditable(order);

    const existingIds = new Set(
      order.orderService.map(({ service }) => service.id),
    );
    const duplicateIds = data.serviceIds.filter((serviceId) =>
      existingIds.has(serviceId),
    );
    if (duplicateIds.length > 0) {
      const duplicateNames = order.orderService
        .filter(({ service }) => duplicateIds.includes(service.id))
        .map(({ service }) => service.name)
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

    await this.recalculateEndDate(id);
    return this.findById(currentUser, id);
  }

  async findOrderDetails(id: number) {
    return db.query.orders.findFirst({
      where: eq(schema.orders.id, id),
      with: this.orderWith,
    });
  }

  private readonly orderWith = {
    administrator: true,
    employee: true,
    customerCar: {
      with: {
        customer: true,
        car: {
          with: {
            brand: true,
          },
        },
      },
    },
    orderService: {
      with: {
        service: true,
      },
    },
  } as const;

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

  private async recalculateEndDate(orderId: number) {
    const order = await this.findOrderDetails(orderId);
    if (!order) throw NotFoundError;

    const totalSeconds = order.orderService.reduce(
      (sum, { service }) => sum + service.time,
      0,
    );
    const endDate = new Date(order.startDate.getTime() + totalSeconds * 1000);

    await db
      .update(schema.orders)
      .set({ endDate })
      .where(eq(schema.orders.id, orderId));
  }

  private canView(currentUser: CurrentUser, order: OrderDetails) {
    if (isAdmin(currentUser)) return true;
    if (isEmployee(currentUser)) return order.employeeId === currentUser.id;
    if (isCustomer(currentUser)) {
      return order.customerCar.customerId === currentUser.id;
    }
    return false;
  }

  private requireCanView(currentUser: CurrentUser, order: OrderDetails) {
    if (!this.canView(currentUser, order)) throw ForbiddenError;
  }

  private requireEditable(order: OrderDetails) {
    if (order.status === ORDER_STATUS.completed) throw CompletedOrderError;
  }

  private toResponse(order: OrderDetails) {
    const services = order.orderService.map(({ service }) => service);
    const totalSeconds = services.reduce((sum, service) => sum + service.time, 0);
    const totalKopecks = services.reduce(
      (sum, service) => sum + service.price,
      0,
    );

    return {
      id: order.id,
      status: order.status,
      startDate: order.startDate,
      endDate: order.endDate,
      totalTime: secondsToMinutes(totalSeconds),
      totalPrice: kopecksToRubles(totalKopecks),
      administrator: {
        id: order.administrator.id,
        fullName: fullName(order.administrator),
      },
      employee: {
        id: order.employee.id,
        fullName: fullName(order.employee),
      },
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        price: moneyVo(service.price),
        time: timeVo(service.time),
      })),
      customerCar: {
        id: order.customerCar.id,
        year: order.customerCar.year,
        number: order.customerCar.number,
        customer: order.customerCar.customer
          ? {
              id: order.customerCar.customer.id,
              fullName: fullName(order.customerCar.customer),
              email: order.customerCar.customer.email,
            }
          : null,
        car: order.customerCar.car
          ? {
              model: order.customerCar.car.model,
              brand: order.customerCar.car.brand.name,
            }
          : null,
      },
    };
  }
}

export const OrdersServiceSingleton = new OrdersService();
