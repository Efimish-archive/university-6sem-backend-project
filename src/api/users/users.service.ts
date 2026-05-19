import type { UserInsert, UserSelect } from "./users.model";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { HttpError } from "@/error";

const NotFoundError = new HttpError(404, "Пользователь не найден");

class UsersService {
  async findAll(): Promise<UserSelect[]> {
    const items = await db.query.users.findMany();
    return items;
  }

  async findById(id: number): Promise<UserSelect> {
    const item = await db.query.users.findFirst({
      where: eq(schema.users.id, id),
    });
    if (!item) throw NotFoundError;
    return item;
  }

  async create(data: UserInsert): Promise<UserSelect> {
    const [user] = await db.insert(schema.users).values(data).returning();
    return user;
  }

  async update(id: number, data: Partial<UserInsert>): Promise<UserSelect> {
    const [user] = await db
      .update(schema.users)
      .set(data)
      .where(eq(schema.users.id, id))
      .returning();
    if (!user) throw NotFoundError;
    return user;
  }

  async delete(id: number): Promise<UserSelect> {
    const [user] = await db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning();
    if (!user) throw NotFoundError;
    return user;
  }
}

export const UsersServiceSingleton = new UsersService();
