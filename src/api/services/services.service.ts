import { and, asc, desc, eq, gte, like, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { listResponse, toLimitOffset } from "@/api/shared/http.model";
import type { CurrentUser } from "@/api/shared/auth.service";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import {
  moneyVo,
  minutesToSeconds,
  rublesToKopecks,
  timeVo,
} from "@/api/shared/vo";
import type {
  HttpServiceBody,
  HttpServicesQuery,
  ServiceSelect,
} from "./services.model";

const NotFoundError = new HttpError(404, "Услуга не найдена");

const toResponse = (service: ServiceSelect) => ({
  id: service.id,
  name: service.name,
  price: moneyVo(service.price),
  time: timeVo(service.time),
});

const toDbValues = (data: HttpServiceBody) => ({
  name: data.name,
  price: rublesToKopecks(data.priceRubles),
  time: minutesToSeconds(data.timeMinutes),
});

class ServicesService {
  async findAll(query: HttpServicesQuery) {
    const { limit, offset } = toLimitOffset(query);
    const orderColumn = schema.services[query.sortBy];
    const items = await db.query.services.findMany({
      where: and(
        query.name ? like(schema.services.name, `%${query.name}%`) : undefined,
        query.minPriceRubles !== undefined
          ? gte(schema.services.price, rublesToKopecks(query.minPriceRubles))
          : undefined,
        query.maxPriceRubles !== undefined
          ? lte(schema.services.price, rublesToKopecks(query.maxPriceRubles))
          : undefined,
      ),
      orderBy: query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn),
      limit,
      offset,
    });

    return listResponse(items.map(toResponse), query);
  }

  async findById(id: number) {
    const item = await db.query.services.findFirst({
      where: eq(schema.services.id, id),
    });
    if (!item) throw NotFoundError;
    return toResponse(item);
  }

  async create(currentUser: CurrentUser, data: HttpServiceBody) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [service] = await db
      .insert(schema.services)
      .values(toDbValues(data))
      .returning();
    return toResponse(service);
  }

  async update(currentUser: CurrentUser, id: number, data: Partial<HttpServiceBody>) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const values = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.priceRubles !== undefined
        ? { price: rublesToKopecks(data.priceRubles) }
        : {}),
      ...(data.timeMinutes !== undefined
        ? { time: minutesToSeconds(data.timeMinutes) }
        : {}),
    };
    const [service] = await db
      .update(schema.services)
      .set(values)
      .where(eq(schema.services.id, id))
      .returning();
    if (!service) throw NotFoundError;
    return toResponse(service);
  }

  async delete(currentUser: CurrentUser, id: number) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [service] = await db
      .delete(schema.services)
      .where(eq(schema.services.id, id))
      .returning();
    if (!service) throw NotFoundError;
    return toResponse(service);
  }
}

export const ServicesServiceSingleton = new ServicesService();
