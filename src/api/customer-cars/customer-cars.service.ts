import { and, asc, desc, eq, like } from "drizzle-orm";
import { db, schema } from "@/db";
import { HttpError } from "@/error";
import { listResponse, toLimitOffset } from "@/api/shared/http.model";
import type { CurrentUser } from "@/api/shared/auth.service";
import { AuthServiceSingleton } from "@/api/shared/auth.service";
import type {
  CustomerCarSelect,
  HttpCustomerCarBody,
  HttpCustomerCarsQuery,
} from "./customer-cars.model";

const NotFoundError = new HttpError(404, "Машина клиента не найдена");

const fullName = (user: {
  firstName: string;
  lastName: string;
  patronymic: string | null;
}) => [user.lastName, user.firstName, user.patronymic].filter(Boolean).join(" ");

const toResponse = (
  item: CustomerCarSelect & {
    customer: typeof schema.users.$inferSelect | null;
    car:
      | (typeof schema.cars.$inferSelect & {
          brand: typeof schema.brands.$inferSelect;
        })
      | null;
  },
) => ({
  id: item.id,
  year: item.year,
  number: item.number,
  customer: item.customer
    ? {
        id: item.customer.id,
        fullName: fullName(item.customer),
        email: item.customer.email,
      }
    : null,
  car: item.car
    ? {
        id: item.car.id,
        model: item.car.model,
        brand: item.car.brand,
      }
    : null,
});

class CustomerCarsService {
  async findAll(query: HttpCustomerCarsQuery) {
    const { limit, offset } = toLimitOffset(query);
    const orderColumn = schema.customerCars[query.sortBy];
    const items = await db.query.customerCars.findMany({
      where: and(
        query.customerId ? eq(schema.customerCars.customerId, query.customerId) : undefined,
        query.carId ? eq(schema.customerCars.carId, query.carId) : undefined,
        query.number ? like(schema.customerCars.number, `%${query.number}%`) : undefined,
      ),
      with: {
        customer: true,
        car: {
          with: {
            brand: true,
          },
        },
      },
      orderBy: query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn),
      limit,
      offset,
    });

    return listResponse(items.map(toResponse), query);
  }

  async findById(id: number) {
    const item = await db.query.customerCars.findFirst({
      where: eq(schema.customerCars.id, id),
      with: {
        customer: true,
        car: {
          with: {
            brand: true,
          },
        },
      },
    });
    if (!item) throw NotFoundError;
    return toResponse(item);
  }

  async create(
    currentUser: CurrentUser,
    data: HttpCustomerCarBody,
  ): Promise<CustomerCarSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [customerCar] = await db
      .insert(schema.customerCars)
      .values(data)
      .returning();
    return customerCar;
  }

  async update(
    currentUser: CurrentUser,
    id: number,
    data: Partial<HttpCustomerCarBody>,
  ): Promise<CustomerCarSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [customerCar] = await db
      .update(schema.customerCars)
      .set(data)
      .where(eq(schema.customerCars.id, id))
      .returning();
    if (!customerCar) throw NotFoundError;
    return customerCar;
  }

  async delete(currentUser: CurrentUser, id: number): Promise<CustomerCarSelect> {
    AuthServiceSingleton.requireAdmin(currentUser);
    const [customerCar] = await db
      .delete(schema.customerCars)
      .where(eq(schema.customerCars.id, id))
      .returning();
    if (!customerCar) throw NotFoundError;
    return customerCar;
  }
}

export const CustomerCarsServiceSingleton = new CustomerCarsService();
