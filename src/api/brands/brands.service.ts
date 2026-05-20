import { and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { listResponse, toLimitOffset } from "@/api/shared/http.model";
import type { CurrentUser } from "@/api/shared/auth.service";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import type { BrandSelect, HttpBrandBody, HttpBrandsQuery } from "./brands.model";

const NotFoundError = new HttpError(404, "Бренд не найден");

class BrandsService {
  async findAll(query: HttpBrandsQuery) {
    const { limit, offset } = toLimitOffset(query);
    const orderColumn = query.sortBy === "name" ? schema.brands.name : schema.brands.id;
    const items = await db
      .select()
      .from(schema.brands)
      .where(and(query.name ? like(schema.brands.name, `%${query.name}%`) : undefined))
      .orderBy(query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn))
      .limit(limit)
      .offset(offset);

    return listResponse(items, query);
  }

  async findById(id: number): Promise<BrandSelect> {
    const item = await db.query.brands.findFirst({
      where: eq(schema.brands.id, id),
    });
    if (!item) throw NotFoundError;
    return item;
  }

  async create(currentUser: CurrentUser, data: HttpBrandBody): Promise<BrandSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [brand] = await db.insert(schema.brands).values(data).returning();
    return brand;
  }

  async update(
    currentUser: CurrentUser,
    id: number,
    data: Partial<HttpBrandBody>,
  ): Promise<BrandSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [brand] = await db
      .update(schema.brands)
      .set(data)
      .where(eq(schema.brands.id, id))
      .returning();
    if (!brand) throw NotFoundError;
    return brand;
  }

  async delete(currentUser: CurrentUser, id: number): Promise<BrandSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [brand] = await db
      .delete(schema.brands)
      .where(eq(schema.brands.id, id))
      .returning();
    if (!brand) throw NotFoundError;
    return brand;
  }
}

export const BrandsServiceSingleton = new BrandsService();
