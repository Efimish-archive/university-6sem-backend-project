import { execSync } from "child_process";
import { rmSync } from "fs";
import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { db, schema } from "@/db";
import { AuthServiceSingleton, ROLE } from "@/api/shared/auth.service";
import { BrandsServiceSingleton } from "@/api/brands/brands.service";
import { CarsServiceSingleton } from "@/api/cars/cars.service";
import { CustomerCarsServiceSingleton } from "@/api/customer-cars/customer-cars.service";
import { NotificationsServiceSingleton } from "@/api/orders/notifications.service";
import { ORDER_STATUS } from "@/api/orders/orders.model";
import { OrdersServiceSingleton } from "@/api/orders/orders.service";
import { RolesServiceSingleton } from "@/api/roles/roles.service";
import { ServicesServiceSingleton } from "@/api/services/services.service";
import { UsersServiceSingleton } from "@/api/users/users.service";
import { sendMail } from "@/mail";
import { eq } from "drizzle-orm";

vi.mock("@/mail", () => ({
  sendMail: vi.fn().mockResolvedValue({}),
}));

const testDatabasePath = "/private/tmp/car-wash-service-tests.db";
const testDatabaseUrl = `file:${testDatabasePath}`;

const admin = { id: 1, roles: [ROLE.administrator] };
const employee = { id: 2, roles: [ROLE.employee] };
const customer = { id: 3, roles: [ROLE.customer] };

const defaultQuery = {
  page: 1,
  limit: 20,
  sortOrder: "asc" as const,
};

const syncTestSchema = () => {
  rmSync(testDatabasePath, { force: true });
  // do not touch or i will jump out the window and die
  execSync("drizzle-kit push", {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
    },
  });
};

const clearTables = async () => {
  for (const table of [
    schema.orderService,
    schema.orders,
    schema.customerCars,
    schema.services,
    schema.cars,
    schema.brands,
    schema.roleUser,
    schema.users,
    schema.roles,
  ]) {
    await db.delete(table);
  }
};

const seedBaseData = async () => {
  await db.insert(schema.roles).values([
    { id: 1, name: "администратор" },
    { id: 2, name: "работник" },
    { id: 3, name: "клиент" },
  ]);
  await db.insert(schema.users).values([
    {
      id: 1,
      firstName: "Анна",
      lastName: "Админова",
      patronymic: null,
      email: "admin@example.com",
      isSendNotify: false,
    },
    {
      id: 2,
      firstName: "Эдуард",
      lastName: "Работников",
      patronymic: null,
      email: "employee@example.com",
      isSendNotify: false,
    },
    {
      id: 3,
      firstName: "Кирилл",
      lastName: "Клиентов",
      patronymic: null,
      email: "customer@example.com",
      isSendNotify: true,
    },
    {
      id: 4,
      firstName: "Олег",
      lastName: "Другой",
      patronymic: null,
      email: "other@example.com",
      isSendNotify: false,
    },
  ]);
  await db.insert(schema.roleUser).values([
    { id: 1, userId: 1, roleId: 1 },
    { id: 2, userId: 2, roleId: 2 },
    { id: 3, userId: 3, roleId: 3 },
    { id: 4, userId: 4, roleId: 3 },
  ]);
  await db.insert(schema.brands).values({ id: 1, name: "Audi" });
  await db.insert(schema.cars).values({ id: 1, brandId: 1, model: "A3" });
  await db.insert(schema.customerCars).values({
    id: 1,
    carId: 1,
    customerId: 3,
    year: 2020,
    number: "A001AA",
  });
  await db.insert(schema.services).values([
    { id: 1, name: "Мойка кузова", price: 50000, time: 1800 },
    { id: 2, name: "Мойка окон", price: 20000, time: 600 },
  ]);
};

beforeAll(async () => {
  syncTestSchema();
});

beforeEach(async () => {
  vi.clearAllMocks();
  await clearTables();
  await seedBaseData();
});

describe("AuthService", () => {
  test("loads current user with normalized roles", async () => {
    await expect(AuthServiceSingleton.getCurrentUser()).rejects.toMatchObject({
      status: 401,
    });

    await expect(AuthServiceSingleton.getCurrentUser(1)).resolves.toEqual(
      admin,
    );
  });
});

describe("RolesService", () => {
  test("creates, filters, updates and deletes roles for admin only", async () => {
    await expect(
      RolesServiceSingleton.create(customer, { name: "manager" }),
    ).rejects.toMatchObject({ status: 403 });

    const created = await RolesServiceSingleton.create(admin, {
      name: "manager",
    });
    const createdId = created.id;
    expect(created).toMatchObject({ id: expect.any(Number), name: "manager" });

    await expect(
      RolesServiceSingleton.findAll({
        ...defaultQuery,
        sortBy: "name",
        name: "manage",
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ name: "manager" })],
      meta: { page: 1, limit: 20 },
    });

    await expect(
      RolesServiceSingleton.update(admin, createdId, { name: "director" }),
    ).resolves.toMatchObject({ name: "director" });
    await expect(
      RolesServiceSingleton.delete(admin, createdId),
    ).resolves.toMatchObject({
      name: "director",
    });
  });
});

describe("BrandsService", () => {
  test("supports CRUD, filtering and sorting", async () => {
    const created = await BrandsServiceSingleton.create(admin, { name: "BMW" });

    await expect(
      BrandsServiceSingleton.findAll({
        ...defaultQuery,
        sortBy: "name",
        name: "bm",
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ name: "BMW" })],
    });
    await expect(
      BrandsServiceSingleton.update(admin, created.id, { name: "Mercedes" }),
    ).resolves.toMatchObject({ name: "Mercedes" });
    await expect(
      BrandsServiceSingleton.delete(admin, created.id),
    ).resolves.toMatchObject({
      name: "Mercedes",
    });
  });
});

describe("CarsService", () => {
  test("returns cars with brand and restricts writes to admin", async () => {
    await expect(
      CarsServiceSingleton.create(customer, { brandId: 1, model: "Q5" }),
    ).rejects.toMatchObject({ status: 403 });

    const created = await CarsServiceSingleton.create(admin, {
      brandId: 1,
      model: "Q5",
    });

    await expect(
      CarsServiceSingleton.findById(created.id),
    ).resolves.toMatchObject({
      model: "Q5",
      brand: { name: "Audi" },
    });
    await expect(
      CarsServiceSingleton.findAll({
        ...defaultQuery,
        sortBy: "model",
        brandId: 1,
        model: "Q",
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ model: "Q5" })],
    });
  });
});

describe("ServicesService", () => {
  test("converts rubles/minutes to stored kopecks/seconds and response VO", async () => {
    const created = await ServicesServiceSingleton.create(admin, {
      name: "Полировка",
      priceRubles: 100.5,
      timeMinutes: 15,
    });

    expect(created).toMatchObject({
      name: "Полировка",
      price: { minValue: 10050, maxValue: 100.5, format: "100.5 руб." },
      time: { second: 900, minute: 15 },
    });

    await expect(
      ServicesServiceSingleton.findAll({
        ...defaultQuery,
        sortBy: "price",
        minPriceRubles: 100,
        maxPriceRubles: 101,
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ name: "Полировка" })],
    });
  });
});

describe("UsersService", () => {
  test("returns roles and replaces role links on update", async () => {
    const created = await UsersServiceSingleton.create(admin, {
      firstName: "Петр",
      lastName: "Новый",
      email: "new@example.com",
      isSendNotify: false,
      roleIds: [3],
    });

    expect(created).toMatchObject({
      email: "new@example.com",
      roles: [expect.objectContaining({ name: "клиент" })],
    });

    await expect(
      UsersServiceSingleton.update(admin, created.id, { roleIds: [2] }),
    ).resolves.toMatchObject({
      roles: [expect.objectContaining({ name: "работник" })],
    });
    await expect(
      UsersServiceSingleton.findAll({
        ...defaultQuery,
        sortBy: "email",
        email: "new",
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ email: "new@example.com" })],
    });
  });
});

describe("CustomerCarsService", () => {
  test("returns nested customer and car data for read and write operations", async () => {
    const created = await CustomerCarsServiceSingleton.create(admin, {
      carId: 1,
      customerId: 3,
      year: 2022,
      number: "B002BB",
    });

    expect(created).toMatchObject({
      year: 2022,
      customer: { email: "customer@example.com" },
      car: { model: "A3", brand: { name: "Audi" } },
    });

    await expect(
      CustomerCarsServiceSingleton.findAll({
        ...defaultQuery,
        sortBy: "number",
        number: "B002",
      }),
    ).resolves.toMatchObject({
      items: [expect.objectContaining({ number: "B002BB" })],
    });
    await expect(
      CustomerCarsServiceSingleton.delete(admin, created.id),
    ).resolves.toMatchObject({ number: "B002BB" });
  });
});

describe("OrdersService", () => {
  test("creates order with totals, dates and visibility restrictions", async () => {
    const created = await OrdersServiceSingleton.create(admin, {
      customerCarId: 1,
      employeeId: 2,
      serviceIds: [1, 2],
    });

    expect(created).toMatchObject({
      status: ORDER_STATUS.inProgress,
      totalTime: 40,
      totalPrice: 700,
      administrator: { id: 1 },
      employee: { id: 2 },
      customerCar: {
        customer: { id: 3, email: "customer@example.com" },
        car: { model: "A3", brand: "Audi" },
      },
    });
    expect(new Date(created.endDate!).getTime()).toBeGreaterThan(
      new Date(created.startDate).getTime(),
    );
    await expect(
      db.query.orders.findFirst({
        where: eq(schema.orders.id, created.id),
      }),
    ).resolves.toMatchObject({
      totalPrice: 70000,
    });

    await expect(
      OrdersServiceSingleton.findById(employee, created.id),
    ).resolves.toMatchObject({
      id: created.id,
    });
    await expect(
      OrdersServiceSingleton.findById(customer, created.id),
    ).resolves.toMatchObject({
      id: created.id,
    });
    await expect(
      OrdersServiceSingleton.findById(
        { id: 4, roles: [ROLE.customer] },
        created.id,
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  test("prevents duplicate services and completed order edits", async () => {
    const order = await OrdersServiceSingleton.create(admin, {
      customerCarId: 1,
      employeeId: 2,
      serviceIds: [1],
    });

    await expect(
      OrdersServiceSingleton.addServices(admin, order.id, { serviceIds: [1] }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      OrdersServiceSingleton.addServices(admin, order.id, { serviceIds: [2] }),
    ).resolves.toMatchObject({
      totalPrice: 700,
      totalTime: 40,
    });

    const completed = await OrdersServiceSingleton.updateStatus(
      admin,
      order.id,
      {
        status: ORDER_STATUS.completed,
      },
    );

    expect(completed.status).toBe(ORDER_STATUS.completed);
    expect(sendMail).toHaveBeenCalledWith({
      to: "customer@example.com",
      subject: `Заказ #${order.id} завершен`,
      text: `Здравствуйте! Ваш заказ #${order.id} в автомойке завершен.`,
    });
    await expect(
      OrdersServiceSingleton.update(admin, order.id, { employeeId: 2 }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe("NotificationsService", () => {
  test("sends order completion email through mail module", async () => {
    await NotificationsServiceSingleton.sendOrderCompletedEmail(
      "client@example.com",
      10,
    );

    expect(sendMail).toHaveBeenCalledWith({
      to: "client@example.com",
      subject: "Заказ #10 завершен",
      text: "Здравствуйте! Ваш заказ #10 в автомойке завершен.",
    });
  });
});
