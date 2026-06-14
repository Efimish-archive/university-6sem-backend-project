import type { RoleInsert, RoleSelect, RoleQuery } from "./roles.model";
import type { Service } from "@/api/shared/service";
import type { Paginated } from "@/api/shared/model";
import { count, and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";

const NotFoundError = new HttpError(404, "Роль не найдена");

class RolesService implements Service<RoleInsert, RoleSelect, RoleQuery> {
  async findAll(query: RoleQuery): Promise<Paginated<RoleSelect>> {
    const orderColumn = schema.roles[query.sortBy];
    const orderBy =
      query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);
    const where = and(
      query.name ? like(schema.roles.name, `%${query.name}%`) : undefined,
    );

    const roles = await db.query.roles.findMany({
      where,
      orderBy,
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
    });

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(schema.roles)
      .where(where);

    return {
      data: roles,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<RoleSelect> {
    const role = await db.query.roles.findFirst({
      where: eq(schema.roles.id, id),
    });
    if (!role) throw NotFoundError;
    return role;
  }

  async create(data: RoleInsert): Promise<RoleSelect> {
    const [role] = await db.insert(schema.roles).values(data).returning();
    return role;
  }

  async update(id: number, data: Partial<RoleInsert>): Promise<RoleSelect> {
    const [role] = await db
      .update(schema.roles)
      .set(data)
      .where(eq(schema.roles.id, id))
      .returning();
    if (!role) throw NotFoundError;
    return role;
  }

  async delete(id: number): Promise<RoleSelect> {
    const [role] = await db
      .delete(schema.roles)
      .where(eq(schema.roles.id, id))
      .returning();
    if (!role) throw NotFoundError;
    return role;
  }
}

export const RolesServiceSingleton = new RolesService();
