import { sqliteTable, int, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: int().primaryKey(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  patronymic: text(),
  email: text().notNull().unique(),
});

export const usersRelations = relations(users, ({ many }) => ({
  roles: many(roleUser),
}));

export const roles = sqliteTable("roles", {
  id: int().primaryKey(),
  name: text().notNull().unique(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(roleUser),
}));

export const roleUser = sqliteTable("role_user", {
  id: int().primaryKey(),
  userId: int()
    .references(() => users.id)
    .notNull(),
  roleId: int()
    .references(() => roles.id)
    .notNull(),
});

export const roleUserRelations = relations(roleUser, ({ one }) => ({
  user: one(users, {
    fields: [roleUser.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [roleUser.roleId],
    references: [roles.id],
  }),
}));

export const brands = sqliteTable("brands", {
  id: int().primaryKey(),
  name: text().notNull().unique(),
});

export const cars = sqliteTable("cars", {
  id: int().primaryKey(),
  brandId: int()
    .references(() => brands.id)
    .notNull(),
  model: text().notNull(),
});

export const carsRelations = relations(cars, ({ one }) => ({
  brand: one(brands, {
    fields: [cars.brandId],
    references: [brands.id],
  }),
}));

export const services = sqliteTable("services", {
  id: int().primaryKey(),
  name: text().notNull(),
  price: int().notNull(),
  time: int().notNull(),
});

export const customerCars = sqliteTable("customer_cars", {
  id: int().primaryKey(),
  carId: int()
    .references(() => cars.id)
    .notNull(),
  customerId: int(),
  /** Год выпуска */
  year: int(),
  /** Номер машины */
  number: text(),
});

export const orderService = sqliteTable("order_service", {
  id: int().primaryKey(),
  serviceId: int()
    .references(() => services.id)
    .notNull(),
  orderId: int()
    .references(() => orders.id)
    .notNull(),
});

export const orders = sqliteTable("orders", {
  id: int().primaryKey(),
  administratorId: int()
    .references(() => users.id)
    .notNull(),
  customerCarId: int()
    .references(() => customerCars.id)
    .notNull(),
  employeeId: int()
    .references(() => users.id)
    .notNull(),
  status: int().notNull(),
  startDate: int({ mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  endDate: int({ mode: "timestamp" }).notNull(),
});
