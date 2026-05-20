import { sqliteTable, int, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: int().primaryKey(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  patronymic: text(),
  email: text().notNull().unique(),
  isSendNotify: int({ mode: "boolean" }).notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  roleUser: many(roleUser),
  customerCars: many(customerCars),
  administratorOrders: many(orders, { relationName: "administrator" }),
  employeeOrders: many(orders, { relationName: "employee" }),
}));

export const roles = sqliteTable("roles", {
  id: int().primaryKey(),
  name: text().notNull().unique(),
});

export const rolesRelations = relations(roles, ({ many }) => ({
  roleUser: many(roleUser),
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

export const brandsRelations = relations(brands, ({ many }) => ({
  cars: many(cars),
}));

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

export const servicesRelations = relations(services, ({ many }) => ({
  orderService: many(orderService),
}));

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

export const customerCarsRelations = relations(customerCars, ({ one }) => ({
  car: one(cars, {
    fields: [customerCars.carId],
    references: [cars.id],
  }),
  customer: one(users, {
    fields: [customerCars.customerId],
    references: [users.id],
  }),
}));

export const orderService = sqliteTable("order_service", {
  id: int().primaryKey(),
  serviceId: int()
    .references(() => services.id)
    .notNull(),
  orderId: int()
    .references(() => orders.id)
    .notNull(),
});

export const orderServiceRelations = relations(orderService, ({ one }) => ({
  service: one(services, {
    fields: [orderService.serviceId],
    references: [services.id],
  }),
  order: one(orders, {
    fields: [orderService.orderId],
    references: [orders.id],
  }),
}));

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

export const ordersRelations = relations(orders, ({ one, many }) => ({
  orderService: many(orderService),
  administrator: one(users, {
    fields: [orders.administratorId],
    references: [users.id],
    relationName: "administrator",
  }),
  customerCar: one(customerCars, {
    fields: [orders.customerCarId],
    references: [customerCars.id],
  }),
  employee: one(users, {
    fields: [orders.employeeId],
    references: [users.id],
    relationName: "employee",
  }),
}));
