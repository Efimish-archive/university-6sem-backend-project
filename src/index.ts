import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { openapi } from "@elysiajs/openapi";
import { env } from "@/env";

import { authController } from "@/api/auth/auth.controller";
import { rolesController } from "@/api/roles/roles.controller";
import { usersController } from "@/api/users/users.controller";
import { brandsController } from "@/api/brands/brands.controller";
import { carsController } from "@/api/cars/cars.controller";
import { servicesController } from "@/api/services/services.controller";
import { customerCarsController } from "@/api/customer-cars/customer-cars.controller";
import { ordersController } from "@/api/orders/orders.controller";

new Elysia()
  .use(cors())
  .use(
    openapi({
      path: "",
      documentation: {
        info: {
          title: "Бэкенд разработка - Проект, семестр 6",
          version: "0.0.0",
        },
        components: {
          securitySchemes: {
            bearer: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    }),
  )
  .use(authController)
  .use(rolesController)
  .use(usersController)
  .use(brandsController)
  .use(carsController)
  .use(servicesController)
  .use(customerCarsController)
  .use(ordersController)
  .listen(env.PORT);

console.log(`🦊 Elysia is running at http://127.0.0.1:${env.PORT}`);
