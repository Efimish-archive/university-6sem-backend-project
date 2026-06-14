import type {
  HttpUserPostBody,
  HttpUsersQuery,
  UserSelect,
} from "./users.model";
import type { ListResponse } from "@/api/shared/http.model";
import { count, and, asc, desc, eq, like, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import argon2 from "argon2";

const baseQuery = {
  with: {
    roleUser: {
      with: {
        role: true,
      },
    },
  },
} satisfies Parameters<typeof db.query.users.findMany>[0];

type UserSelectInternal = Awaited<
  ReturnType<typeof db.query.users.findMany<typeof baseQuery>>
>[number];

const toResponse = (user: UserSelectInternal): UserSelect => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  patronymic: user.patronymic,
  email: user.email,
  isSendNotify: user.isSendNotify,
  roles: user.roleUser.map((roleUser) => ({
    id: roleUser.role.id,
    name: roleUser.role.name,
  })),
});

const NotFoundError = new HttpError(404, "Пользователь не найден");

class UsersService {
  async findAll(query: HttpUsersQuery): Promise<ListResponse<UserSelect>> {
    const orderColumn = schema.users[query.sortBy];
    const orderBy =
      query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);
    const where = and(
      query.email ? like(schema.users.email, `%${query.email}%`) : undefined,
      query.name
        ? or(
            like(schema.users.firstName, `%${query.name}%`),
            like(schema.users.lastName, `%${query.name}%`),
          )
        : undefined,
    );

    const users = await db.query.users.findMany({
      ...baseQuery,
      where,
      orderBy,
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
    });

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(schema.users)
      .where(where);

    return {
      data: users.map(toResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<UserSelect> {
    const user = await db.query.users.findFirst({
      ...baseQuery,
      where: eq(schema.users.id, id),
    });
    if (!user) throw NotFoundError;
    return toResponse(user);
  }

  async create(data: HttpUserPostBody): Promise<UserSelect> {
    const { roleIds = [], password, ...userData } = data;
    const passwordHash = await argon2.hash(password);

    const user = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(schema.users)
        .values({ ...userData, passwordHash })
        .returning();

      if (roleIds.length > 0) {
        await tx.insert(schema.roleUser).values(
          roleIds.map((roleId) => ({
            userId: user.id,
            roleId,
          })),
        );
      }

      return user;
    });

    return this.findById(user.id);
  }

  async update(
    id: number,
    data: Partial<HttpUserPostBody>,
  ): Promise<UserSelect> {
    const { roleIds, password, ...rest } = data;
    await this.findById(id);

    const passwordHash = password && (await argon2.hash(password));
    const userData = passwordHash ? { ...rest, passwordHash } : rest;

    await db.transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx
          .update(schema.users)
          .set(userData)
          .where(eq(schema.users.id, id));
      }

      if (roleIds) {
        await tx.delete(schema.roleUser).where(eq(schema.roleUser.userId, id));

        if (roleIds.length > 0) {
          await tx.insert(schema.roleUser).values(
            roleIds.map((roleId) => ({
              userId: id,
              roleId,
            })),
          );
        }
      }
    });

    return this.findById(id);
  }

  async delete(id: number): Promise<UserSelect> {
    const user = await this.findById(id);

    await db.transaction(async (tx) => {
      await tx.delete(schema.roleUser).where(eq(schema.roleUser.userId, id));
      await tx.delete(schema.users).where(eq(schema.users.id, id));
    });

    return user;
  }
}

export const UsersServiceSingleton = new UsersService();
