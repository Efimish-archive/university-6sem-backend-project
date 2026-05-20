import { and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { listResponse, toLimitOffset } from "@/api/shared/http.model";
import type { CurrentUser } from "@/api/shared/auth.service";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import type { CarSelect, HttpCarBody, HttpCarsQuery } from "./cars.model";

const NotFoundError = new HttpError(404, "Машина не найдена");

class CarsService {
  async findAll(query: HttpCarsQuery) {
    const { limit, offset } = toLimitOffset(query);
    const orderColumn = query.sortBy === "model" ? schema.cars.model : schema.cars.id;
    const items = await db.query.cars.findMany({
      where: and(
        query.model ? like(schema.cars.model, `%${query.model}%`) : undefined,
        query.brandId ? eq(schema.cars.brandId, query.brandId) : undefined,
      ),
      with: { brand: true },
      orderBy: query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn),
      limit,
      offset,
    });

    return listResponse(items, query);
  }

  async findById(id: number) {
    const item = await db.query.cars.findFirst({
      where: eq(schema.cars.id, id),
      with: { brand: true },
    });
    if (!item) throw NotFoundError;
    return item;
  }

  async create(currentUser: CurrentUser, data: HttpCarBody): Promise<CarSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [car] = await db.insert(schema.cars).values(data).returning();
    return car;
  }

  async update(
    currentUser: CurrentUser,
    id: number,
    data: Partial<HttpCarBody>,
  ): Promise<CarSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [car] = await db
      .update(schema.cars)
      .set(data)
      .where(eq(schema.cars.id, id))
      .returning();
    if (!car) throw NotFoundError;
    return car;
  }

  async delete(currentUser: CurrentUser, id: number): Promise<CarSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [car] = await db
      .delete(schema.cars)
      .where(eq(schema.cars.id, id))
      .returning();
    if (!car) throw NotFoundError;
    return car;
  }
}

export const CarsServiceSingleton = new CarsService();
