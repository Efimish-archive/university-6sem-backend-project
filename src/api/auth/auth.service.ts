import type { UserRole, Token } from "./auth.model";
import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { context } from "@/context";
import argon2 from "argon2";

type JWT = (typeof context)["decorator"]["jwt"];

const WrongCredentialsError = new HttpError(400, "Неверные данные");

class AuthService {
  async login(email: string, password: string, jwt: JWT): Promise<Token> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
      with: {
        roleUser: {
          orderBy: asc(schema.roleUser.roleId),
          with: {
            role: true,
          },
        },
      },
    });
    if (!user) throw WrongCredentialsError;

    const isPasswordCorrect = await argon2.verify(user.passwordHash, password);
    if (!isPasswordCorrect) throw WrongCredentialsError;

    const token = await jwt.sign({
      sub: user.id.toString(),
      role: user.roleUser[0].role.name as UserRole,
    });

    return { token };
  }
}

export const AuthServiceSingleton = new AuthService();
