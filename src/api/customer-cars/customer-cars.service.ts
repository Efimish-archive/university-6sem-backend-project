import type {
  CustomerCarInsert,
  CustomerCarSelect,
  CustomerCarQuery,
} from "./customer-cars.model";
import type { Service } from "@/api/shared/service";
import type { Paginated } from "@/api/shared/model";
import { count, and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";

const baseQuery = {
  with: {
    car: {
      with: {
        brand: true,
      },
    },
    customer: {
      with: {
        roleUser: {
          with: {
            role: true,
          },
        },
      },
    },
  },
} satisfies Parameters<typeof db.query.customerCars.findMany>[0];

type CustomerCarSelectInternal = Awaited<
  ReturnType<typeof db.query.customerCars.findMany<typeof baseQuery>>
>[number];

const toResponse = (
  customerCar: CustomerCarSelectInternal,
): CustomerCarSelect => ({
  id: customerCar.id,
  car: {
    id: customerCar.car.id,
    brand: {
      id: customerCar.car.brand.id,
      name: customerCar.car.brand.name,
    },
    model: customerCar.car.model,
  },
  customer: {
    id: customerCar.customer.id,
    firstName: customerCar.customer.firstName,
    lastName: customerCar.customer.lastName,
    patronymic: customerCar.customer.patronymic,
    email: customerCar.customer.email,
    isSendNotify: customerCar.customer.isSendNotify,
    roles: customerCar.customer.roleUser.map((roleUser) => ({
      id: roleUser.role.id,
      name: roleUser.role.name,
    })),
  },
  year: customerCar.year,
  number: customerCar.number,
});

const NotFoundError = new HttpError(404, "Машина клиента не найдена");

class CustomerCarsService implements Service<
  CustomerCarInsert,
  CustomerCarSelect,
  CustomerCarQuery
> {
  async findAll(
    query: CustomerCarQuery,
  ): Promise<Paginated<CustomerCarSelect>> {
    const orderColumn = schema.customerCars[query.sortBy];
    const orderBy =
      query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);
    const where = and(
      query.customerId
        ? eq(schema.customerCars.customerId, query.customerId)
        : undefined,
      query.carId ? eq(schema.customerCars.carId, query.carId) : undefined,
      query.number
        ? like(schema.customerCars.number, `%${query.number}%`)
        : undefined,
    );

    const customerCars = await db.query.customerCars.findMany({
      ...baseQuery,
      where,
      orderBy,
      offset: (query.page - 1) * query.limit,
      limit: query.limit,
    });

    const [{ count: total }] = await db
      .select({ count: count() })
      .from(schema.customerCars)
      .where(where);

    return {
      data: customerCars.map(toResponse),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
      },
    };
  }

  async findById(id: number): Promise<CustomerCarSelect> {
    const customerCar = await db.query.customerCars.findFirst({
      ...baseQuery,
      where: eq(schema.customerCars.id, id),
    });
    if (!customerCar) throw NotFoundError;
    return toResponse(customerCar);
  }

  async create(data: CustomerCarInsert): Promise<CustomerCarSelect> {
    const [customerCar] = await db
      .insert(schema.customerCars)
      .values(data)
      .returning();
    return this.findById(customerCar.id);
  }

  async update(
    id: number,
    data: Partial<CustomerCarInsert>,
  ): Promise<CustomerCarSelect> {
    const [customerCar] = await db
      .update(schema.customerCars)
      .set(data)
      .where(eq(schema.customerCars.id, id))
      .returning();
    if (!customerCar) throw NotFoundError;
    return this.findById(id);
  }

  async delete(id: number): Promise<CustomerCarSelect> {
    const customerCar = await this.findById(id);
    await db.delete(schema.customerCars).where(eq(schema.customerCars.id, id));
    return customerCar;
  }
}

export const CustomerCarsServiceSingleton = new CustomerCarsService();
