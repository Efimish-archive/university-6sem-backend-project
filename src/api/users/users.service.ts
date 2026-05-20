import type { HttpUserPostBody, HttpUsersQuery, UserSelect } from "./users.model";
import { db, schema } from "@/db";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { HttpError } from "@/error";
import { listResponse, toLimitOffset } from "@/api/shared/http.model";
import type { CurrentUser } from "@/api/shared/auth.service";
import { AuthServiceSingleton } from "@/api/shared/auth.service";

const NotFoundError = new HttpError(404, "Пользователь не найден");

const toResponse = (
  user: UserSelect & {
    roleUser: {
      role: typeof schema.roles.$inferSelect;
    }[];
  },
) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  patronymic: user.patronymic,
  email: user.email,
  isSendNotify: user.isSendNotify,
  roles: user.roleUser.map(({ role }) => role),
});

class UsersService {
  async findAll(query: HttpUsersQuery) {
    const { limit, offset } = toLimitOffset(query);
    const orderColumn = schema.users[query.sortBy];
    const items = await db.query.users.findMany({
      where: and(
        query.email ? like(schema.users.email, `%${query.email}%`) : undefined,
        query.name
          ? or(
              like(schema.users.firstName, `%${query.name}%`),
              like(schema.users.lastName, `%${query.name}%`),
            )
          : undefined,
      ),
      with: {
        roleUser: {
          with: {
            role: true,
          },
        },
      },
      orderBy: query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn),
      limit,
      offset,
    });
    return listResponse(items.map(toResponse), query);
  }

  async findById(id: number) {
    const item = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
      with: {
        roleUser: {
          with: {
            role: true,
          },
        },
      },
    });
    if (!item) throw NotFoundError;
    return toResponse(item);
  }

  async create(currentUser: CurrentUser, data: HttpUserPostBody) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const { roleIds = [], ...userData } = data;
    const [user] = await db.insert(schema.users).values(userData).returning();
    if (roleIds.length > 0) {
      await db.insert(schema.roleUser).values(
        roleIds.map((roleId) => ({
          userId: user.id,
          roleId,
        })),
      );
    }
    return this.findById(user.id);
  }

  async update(currentUser: CurrentUser, id: number, data: Partial<HttpUserPostBody>) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const { roleIds, ...userData } = data;
    await this.findById(id);
    if (Object.keys(userData).length > 0) {
      await db.update(schema.users).set(userData).where(eq(schema.users.id, id));
    }
    if (roleIds) {
      await db.delete(schema.roleUser).where(eq(schema.roleUser.userId, id));
      if (roleIds.length > 0) {
        await db.insert(schema.roleUser).values(
          roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        );
      }
    }
    return this.findById(id);
  }

  async delete(currentUser: CurrentUser, id: number) {
    AuthServiceSingleton.requireAdmin(currentUser);
    const user = await this.findById(id);
    await db.delete(schema.roleUser).where(eq(schema.roleUser.userId, id));
    await db.delete(schema.users).where(eq(schema.users.id, id));
    return user;
  }
}

export const UsersServiceSingleton = new UsersService();
