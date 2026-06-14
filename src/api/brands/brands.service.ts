import type {
  BrandInsert,
  BrandSelect,
  BrandsListSelect,
  BrandsQuery,
} from "./brands.model";
import { count, and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";

const NotFoundError = new HttpError(404, "Бренд не найден");

class BrandsService {
  async findAll(query: BrandsQuery): Promise<BrandsListSelect> {
    const orderColumn = schema.brands[query.sortBy];
    const orderBy =
      query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);
    const where = and(
      query.name ? like(schema.brands.name, `%${query.name}%`) : undefined,
    );

    const brands = await db.query.brands.findMany({
      where,
      orderBy,
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
    });

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(schema.brands)
      .where(where);

    return {
      data: brands,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<BrandSelect> {
    const brand = await db.query.brands.findFirst({
      where: eq(schema.brands.id, id),
    });
    if (!brand) throw NotFoundError;
    return brand;
  }

  async create(data: BrandInsert): Promise<BrandSelect> {
    const [brand] = await db.insert(schema.brands).values(data).returning();
    return brand;
  }

  async update(
    id: number,
    data: Partial<BrandInsert>,
  ): Promise<BrandSelect> {
    const [brand] = await db
      .update(schema.brands)
      .set(data)
      .where(eq(schema.brands.id, id))
      .returning();
    if (!brand) throw NotFoundError;
    return brand;
  }

  async delete(id: number): Promise<BrandSelect> {
    const [brand] = await db
      .delete(schema.brands)
      .where(eq(schema.brands.id, id))
      .returning();
    if (!brand) throw NotFoundError;
    return brand;
  }
}

export const BrandsServiceSingleton = new BrandsService();
