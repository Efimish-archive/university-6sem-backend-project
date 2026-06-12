import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import argon2 from "argon2";
import type { JWTPayloadInput } from "@elysiajs/jwt";
import type { HttpTokenResponse } from "./auth.model";

interface JWTSigner {
  sign(signValue: JWTPayloadInput): Promise<string>;
}

const WrongCredentialsError = new HttpError(400, "Неверные данные");

class AuthService {
  async login(
    email: string,
    password: string,
    jwt: JWTSigner,
  ): Promise<HttpTokenResponse> {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
    if (!user) throw WrongCredentialsError;

    const isPasswordCorrect = await argon2.verify(user.passwordHash, password);
    if (!isPasswordCorrect) throw WrongCredentialsError;

    const token = await jwt.sign({
      sub: user.id.toString(),
    });

    return { token };
  }
}

export const AuthServiceSingleton = new AuthService();
