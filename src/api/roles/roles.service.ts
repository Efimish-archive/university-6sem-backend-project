import { and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { listResponse, toLimitOffset } from "@/api/shared/http.model";
import type { CurrentUser } from "@/api/shared/auth.service";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import type { HttpRoleBody, HttpRolesQuery, RoleSelect } from "./roles.model";

const NotFoundError = new HttpError(404, "Роль не найдена");

class RolesService {
  async findAll(query: HttpRolesQuery) {
    const { limit, offset } = toLimitOffset(query);
    const orderColumn = query.sortBy === "name" ? schema.roles.name : schema.roles.id;
    const items = await db
      .select()
      .from(schema.roles)
      .where(and(query.name ? like(schema.roles.name, `%${query.name}%`) : undefined))
      .orderBy(query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn))
      .limit(limit)
      .offset(offset);

    return listResponse(items, query);
  }

  async findById(id: number): Promise<RoleSelect> {
    const item = await db.query.roles.findFirst({
      where: eq(schema.roles.id, id),
    });
    if (!item) throw NotFoundError;
    return item;
  }

  async create(currentUser: CurrentUser, data: HttpRoleBody): Promise<RoleSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [role] = await db.insert(schema.roles).values(data).returning();
    return role;
  }

  async update(
    currentUser: CurrentUser,
    id: number,
    data: Partial<HttpRoleBody>,
  ): Promise<RoleSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [role] = await db
      .update(schema.roles)
      .set(data)
      .where(eq(schema.roles.id, id))
      .returning();
    if (!role) throw NotFoundError;
    return role;
  }

  async delete(currentUser: CurrentUser, id: number): Promise<RoleSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [role] = await db
      .delete(schema.roles)
      .where(eq(schema.roles.id, id))
      .returning();
    if (!role) throw NotFoundError;
    return role;
  }
}

export const RolesServiceSingleton = new RolesService();
