import type {
  CarInsert,
  CarSelect,
  CarsListSelect,
  CarsQuery,
} from "./cars.model";
import { count, and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";

const baseQuery = {
  with: {
    brand: true,
  },
} satisfies Parameters<typeof db.query.cars.findMany>[0];

type CarSelectInternal = Awaited<
  ReturnType<typeof db.query.cars.findMany<typeof baseQuery>>
>[number];

const toResponse = (car: CarSelectInternal): CarSelect => ({
  id: car.id,
  brandId: car.brandId,
  brand: car.brand.name,
  model: car.model,
});

const NotFoundError = new HttpError(404, "Машина не найдена");

class CarsService {
  async findAll(query: CarsQuery): Promise<CarsListSelect> {
    const orderColumn = schema.cars[query.sortBy];
    const orderBy =
      query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);
    const where = and(
      query.model ? like(schema.cars.model, `%${query.model}%`) : undefined,
      query.brandId ? eq(schema.cars.brandId, query.brandId) : undefined,
    );

    const cars = await db.query.cars.findMany({
      ...baseQuery,
      where,
      orderBy,
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
    });

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(schema.cars)
      .where(where);

    return {
      data: cars.map(toResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<CarSelect> {
    const car = await db.query.cars.findFirst({
      ...baseQuery,
      where: eq(schema.cars.id, id),
    });
    if (!car) throw NotFoundError;
    return toResponse(car);
  }

  async create(data: CarInsert): Promise<CarSelect> {
    const [car] = await db.insert(schema.cars).values(data).returning();
    return this.findById(car.id);
  }

  async update(id: number, data: Partial<CarInsert>): Promise<CarSelect> {
    const [car] = await db
      .update(schema.cars)
      .set(data)
      .where(eq(schema.cars.id, id))
      .returning();
    if (!car) throw NotFoundError;
    return this.findById(car.id);
  }

  async delete(id: number): Promise<CarSelect> {
    const car = this.findById(id);

    await db.delete(schema.cars).where(eq(schema.cars.id, id)).returning();

    return car;
  }
}

export const CarsServiceSingleton = new CarsService();
