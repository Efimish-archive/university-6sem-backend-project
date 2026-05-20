import { reset } from "drizzle-seed";
import { fakerRU } from "@faker-js/faker";
import { db, schema } from "@/db";
import { execSync } from "child_process";

console.log(execSync("drizzle-kit push", { encoding: "utf-8" }));
await reset(db as any, schema);
console.log("[✓] Reset database");

const roles = await db
  .insert(schema.roles)
  .values([{ name: "админ" }, { name: "работник" }, { name: "клиент" }])
  .returning();
console.log("[✓] Созданы фейковые роли");

const users = await db
  .insert(schema.users)
  .values(
    fakerRU.helpers.uniqueArray(() => {
      const sex = fakerRU.helpers.arrayElement(["male", "female"]);
      const firstName = fakerRU.person.firstName(sex);
      const lastName = fakerRU.person.lastName(sex);
      return {
        firstName,
        lastName,
        email: fakerRU.internet.email({ firstName, lastName }),
        isSendNotify: fakerRU.datatype.boolean({ probability: 0.7 }),
      };
    }, 30),
  )
  .returning();
console.log("[✓] Созданы фейковые пользователи");

const adminUsers = users.splice(0, 1);
const employeeUsers = users.splice(0, 4);

const roleUser = await db
  .insert(schema.roleUser)
  .values([
    ...adminUsers.map(({ id }) => ({ userId: id, roleId: roles[0].id })),
    ...employeeUsers.map(({ id }) => ({ userId: id, roleId: roles[1].id })),
    ...users.map(({ id }) => ({ userId: id, roleId: roles[2].id })),
  ])
  .returning();
console.log("[✓] Созданы фейковые связи роль-пользователь");

const brands = await db
  .insert(schema.brands)
  .values(
    fakerRU.helpers
      .uniqueArray(fakerRU.vehicle.manufacturer, 30)
      .map((name) => ({ name })),
  )
  .returning();
console.log("[✓] Созданы фейковые бренды");

const cars = await db
  .insert(schema.cars)
  .values(
    brands.flatMap(({ id: brandId }) =>
      fakerRU.helpers
        .uniqueArray(fakerRU.vehicle.model, 3)
        .map((model) => ({ brandId, model })),
    ),
  )
  .returning();
console.log("[✓] Созданы фейковые автомобили");

const services = await db
  .insert(schema.services)
  .values(
    fakerRU.helpers.uniqueArray(
      () => ({
        name: fakerRU.word.words(5),
        price: fakerRU.number.int({ min: 100, max: 1500 }),
        time: fakerRU.number.int({ min: 10, max: 90 }),
      }),
      150,
    ),
  )
  .returning();
console.log("[✓] Созданы фейковые услуги");

const customerCars = await db
  .insert(schema.customerCars)
  .values(
    fakerRU.helpers.uniqueArray(
      () => ({
        carId: fakerRU.helpers.arrayElement(cars).id,
        customerId: fakerRU.helpers.arrayElement(
          roleUser.filter(({ roleId }) => roleId === roles[2].id),
        ).id,
        year: fakerRU.number.int({ min: 1980, max: 2026 }),
        number: fakerRU.vehicle.vrm(),
      }),
      50,
    ),
  )
  .returning();
console.log("[✓] Созданы фейковые автомобили клиентов");

const orders = await db
  .insert(schema.orders)
  .values(
    fakerRU.helpers.uniqueArray(
      () => ({
        administratorId: fakerRU.helpers.arrayElement(adminUsers).id,
        customerCarId: fakerRU.helpers.arrayElement(customerCars).id,
        employeeId: fakerRU.helpers.arrayElement(employeeUsers).id,
        status: 0,
        startDate: fakerRU.date.recent(),
        endDate: fakerRU.date.soon(),
      }),
      50,
    ),
  )
  .returning();
console.log("[✓] Созданы фейковые заказы");

const orderService = await db
  .insert(schema.orderService)
  .values(
    fakerRU.helpers.uniqueArray(
      () => ({
        serviceId: fakerRU.helpers.arrayElement(services).id,
        orderId: fakerRU.helpers.arrayElement(orders).id,
      }),
      30,
    ),
  )
  .returning();
console.log("[✓] Созданы фейковые связи заказ-услуга");
