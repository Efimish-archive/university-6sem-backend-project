import { describe, expect, test } from "vitest";
import { HttpOrderResponseSchema } from "@/api/orders/orders.model";
import { toHttpDate, toNullableHttpDate } from "@/api/shared/http.model";

const orderResponse = {
  id: 1,
  status: 1,
  startDate: "2026-06-01T05:00:00.000Z",
  endDate: "2026-06-01T05:40:00.000Z",
  totalTime: 40,
  totalPrice: 700,
  administrator: {
    id: 1,
    fullName: "Иванов Иван Иванович",
  },
  employee: {
    id: 2,
    fullName: "Петров Петр Петрович",
  },
  services: [
    {
      id: 1,
      name: "Мойка кузова",
      price: {
        minValue: 50000,
        maxValue: 500,
        format: "500 руб.",
      },
      time: {
        second: 1800,
        minute: 30,
      },
    },
  ],
  customerCar: {
    id: 1,
    year: 2020,
    number: "A001AA",
    customer: {
      id: 3,
      fullName: "Сидоров Сидор Сидорович",
      email: "customer@example.com",
    },
    car: {
      model: "A3",
      brand: "Audi",
    },
  },
};

describe("HTTP date conversion", () => {
  test("serializes Date to an ISO string for JSON responses", () => {
    const date = new Date("2026-06-01T05:00:00.000Z");

    expect(toHttpDate(date)).toBe("2026-06-01T05:00:00.000Z");
    expect(toNullableHttpDate(null)).toBeNull();
  });

  test("order response schema accepts JSON dates and rejects Date objects", () => {
    expect(HttpOrderResponseSchema.safeParse(orderResponse).success).toBe(true);
    expect(
      HttpOrderResponseSchema.safeParse({
        ...orderResponse,
        startDate: new Date(orderResponse.startDate),
      }).success,
    ).toBe(false);
  });
});
