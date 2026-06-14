import type {
  ServiceInsert,
  ServiceSelect,
  ServicesListSelect,
  ServicesQuery,
} from "./services.model";
import { count, and, asc, desc, eq, gte, like, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";

import {
  moneyVo,
  minutesToSeconds,
  rublesToKopecks,
  timeVo,
} from "@/api/shared/vo";

type ServiceSelectInternal = typeof schema.services.$inferSelect;
type ServiceInsertInternal = typeof schema.services.$inferInsert;

const toResponse = (service: ServiceSelectInternal): ServiceSelect => ({
  id: service.id,
  name: service.name,
  price: moneyVo(service.price),
  time: timeVo(service.time),
});

const toDbValues = (service: ServiceInsert): ServiceInsertInternal => ({
  name: service.name,
  price: rublesToKopecks(service.priceRubles),
  time: minutesToSeconds(service.timeMinutes),
});

const toDbValuesPartial = (
  service: Partial<ServiceInsert>,
): Partial<ServiceInsertInternal> => ({
  name: service.name,
  price: service.priceRubles && rublesToKopecks(service.priceRubles),
  time: service.timeMinutes && minutesToSeconds(service.timeMinutes),
});

const NotFoundError = new HttpError(404, "Услуга не найдена");

class ServicesService {
  async findAll(query: ServicesQuery): Promise<ServicesListSelect> {
    const orderColumn = schema.services[query.sortBy];
    const orderBy =
      query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);
    const where = and(
      query.name ? like(schema.services.name, `%${query.name}%`) : undefined,
      typeof query.minPriceRubles !== "undefined"
        ? gte(schema.services.price, rublesToKopecks(query.minPriceRubles))
        : undefined,
      typeof query.maxPriceRubles !== "undefined"
        ? lte(schema.services.price, rublesToKopecks(query.maxPriceRubles))
        : undefined,
      typeof query.minTimeMinutes !== "undefined"
        ? gte(schema.services.time, minutesToSeconds(query.minTimeMinutes))
        : undefined,
      typeof query.maxTimeMinutes !== "undefined"
        ? lte(schema.services.time, minutesToSeconds(query.maxTimeMinutes))
        : undefined,
    );

    const services = await db.query.services.findMany({
      where,
      orderBy,
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
    });

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(schema.services)
      .where(where);

    return {
      data: services.map(toResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<ServiceSelect> {
    const item = await db.query.services.findFirst({
      where: eq(schema.services.id, id),
    });
    if (!item) throw NotFoundError;
    return toResponse(item);
  }

  async create(data: ServiceInsert): Promise<ServiceSelect> {
    const [service] = await db
      .insert(schema.services)
      .values(toDbValues(data))
      .returning();
    return toResponse(service);
  }

  async update(
    id: number,
    data: Partial<ServiceInsert>,
  ): Promise<ServiceSelect> {
    const [service] = await db
      .update(schema.services)
      .set(toDbValuesPartial(data))
      .where(eq(schema.services.id, id))
      .returning();
    if (!service) throw NotFoundError;
    return toResponse(service);
  }

  async delete(id: number): Promise<ServiceSelect> {
    const [service] = await db
      .delete(schema.services)
      .where(eq(schema.services.id, id))
      .returning();
    if (!service) throw NotFoundError;
    return toResponse(service);
  }
}

export const ServicesServiceSingleton = new ServicesService();
