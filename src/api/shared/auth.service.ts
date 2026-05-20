import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { eq } from "drizzle-orm";

export const ROLE = {
  administrator: "administrator",
  employee: "employee",
  customer: "customer",
} as const;

export type RoleName = (typeof ROLE)[keyof typeof ROLE];

export type CurrentUser = {
  id: number;
  roles: RoleName[];
};

export const UnauthorizedError = new HttpError(401, "Вы не авторизованы");
export const ForbiddenError = new HttpError(403, "У вас недостаточно прав");

const normalizeRole = (name: string): RoleName | null => {
  if (name === "admin" || name === "administrator" || name === "администратор") {
    return ROLE.administrator;
  }
  if (name === "employee" || name === "worker" || name === "работник") {
    return ROLE.employee;
  }
  if (name === "customer" || name === "client" || name === "клиент") {
    return ROLE.customer;
  }
  return null;
};

export class AuthService {
  async getCurrentUser(userId?: number): Promise<CurrentUser> {
    if (!userId) throw UnauthorizedError;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, userId),
      with: {
        roleUser: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!user) throw UnauthorizedError;

    return {
      id: user.id,
      roles: user.roleUser
        .map(({ role }) => normalizeRole(role.name))
        .filter((role): role is RoleName => role !== null),
    };
  }

  requireRole(currentUser: CurrentUser, role: RoleName) {
    if (!currentUser.roles.includes(role)) throw ForbiddenError;
  }

  requireAdmin(currentUser: CurrentUser) {
    this.requireRole(currentUser, ROLE.administrator);
  }
}

export const AuthServiceSingleton = new AuthService();
