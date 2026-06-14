import type { HttpRoleBody, HttpRolesQuery, RoleSelect } from "./roles.model";
import type { ListResponse } from "@/api/shared/http.model";
import { count, and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";

const NotFoundError = new HttpError(404, "Роль не найдена");

class RolesService {
  async findAll(query: HttpRolesQuery): Promise<ListResponse<RoleSelect>> {
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

  async create(data: HttpRoleBody): Promise<RoleSelect> {
    const [role] = await db.insert(schema.roles).values(data).returning();
    return role;
  }

  async update(id: number, data: Partial<HttpRoleBody>): Promise<RoleSelect> {
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
