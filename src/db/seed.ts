import { reset } from "drizzle-seed";
import { fakerRU } from "@faker-js/faker";
import argon2 from "argon2";
import { db, schema } from "@/db";
import { execSync } from "child_process";

console.log(execSync("bunx drizzle-kit push", { encoding: "utf-8" }));
await reset(db as any, schema);
console.log("[✓] Reset database");

const roles = await db
  .insert(schema.roles)
  .values([{ name: "админ" }, { name: "работник" }, { name: "клиент" }])
  .returning();
console.log("[✓] Созданы фейковые роли");

const passwordHash = await argon2.hash("1");
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
        patronymic: fakerRU.person.middleName(sex),
        email: fakerRU.internet.email({ firstName, lastName }),
        isSendNotify: fakerRU.datatype.boolean({ probability: 0.7 }),
        passwordHash,
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
  .values([
    { name: "Экспресс-мойка кузова", price: 45000, time: 1200 },
    { name: "Комплексная мойка", price: 90000, time: 2700 },
    { name: "Мойка салона", price: 70000, time: 2400 },
    { name: "Химчистка салона", price: 250000, time: 7200 },
    { name: "Мойка стекол", price: 25000, time: 600 },
    { name: "Чернение шин", price: 20000, time: 600 },
    { name: "Полировка кузова", price: 350000, time: 10800 },
    { name: "Нанесение воска", price: 80000, time: 1800 },
    { name: "Мойка двигателя", price: 120000, time: 2400 },
    { name: "Сушка и продувка", price: 30000, time: 900 },
    { name: "Антидождь", price: 60000, time: 1200 },
    { name: "Удаление битума", price: 100000, time: 2100 },
  ])
  .returning();
console.log("[✓] Созданы фейковые услуги");

const customerCars = await db
  .insert(schema.customerCars)
  .values(
    fakerRU.helpers.uniqueArray(
      () => ({
        carId: fakerRU.helpers.arrayElement(cars).id,
        customerId: fakerRU.helpers.arrayElement(users).id,
        year: fakerRU.number.int({ min: 1980, max: 2026 }),
        number: fakerRU.vehicle.vrm(),
      }),
      50,
    ),
  )
  .returning();
console.log("[✓] Созданы фейковые автомобили клиентов");

for (let i = 0; i < 50; i++) {
  const selectedServices = fakerRU.helpers
    .shuffle(services)
    .slice(0, fakerRU.number.int({ min: 1, max: 4 }));
  const totalSeconds = selectedServices.reduce(
    (sum, service) => sum + service.time,
    0,
  );
  const totalPrice = selectedServices.reduce(
    (sum, service) => sum + service.price,
    0,
  );
  const status = fakerRU.helpers.arrayElement([1, 1, 1, 2]);
  const startedMinutesAgo = fakerRU.number.int({
    min: status === 2 ? 180 : 15,
    max: status === 2 ? 60 * 24 * 14 : 240,
  });
  const startDate = new Date(Date.now() - startedMinutesAgo * 60 * 1000);
  const endDate = new Date(startDate.getTime() + totalSeconds * 1000);

  const [order] = await db
    .insert(schema.orders)
    .values({
      administratorId: fakerRU.helpers.arrayElement(adminUsers).id,
      customerCarId: fakerRU.helpers.arrayElement(customerCars).id,
      employeeId: fakerRU.helpers.arrayElement(employeeUsers).id,
      status,
      startDate,
      endDate,
      totalPrice,
    })
    .returning();

  await db.insert(schema.orderService).values(
    selectedServices.map((service) => ({
      serviceId: service.id,
      orderId: order.id,
    })),
  );
}
console.log("[✓] Созданы фейковые заказы и связи заказ-услуга");
