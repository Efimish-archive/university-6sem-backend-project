import { z } from "zod";

export const IdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const HttpDateSchema = z.iso.datetime();

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export type ListMeta = {
  page: number;
  limit: number;
};

export type ListResponse<T> = {
  items: T[];
  meta: ListMeta;
};

export const toLimitOffset = (query: PaginationQuery) => ({
  limit: query.limit,
  offset: (query.page - 1) * query.limit,
});

export const listResponse = <T>(
  items: T[],
  query: PaginationQuery,
): ListResponse<T> => ({
  items,
  meta: {
    page: query.page,
    limit: query.limit,
  },
});

export const listResponseSchema = (itemSchema: z.ZodType) =>
  z.object({
    items: z.array(itemSchema),
    meta: z.object({
      page: z.number().int(),
      limit: z.number().int(),
    }),
  });

export const toHttpDate = (date: Date) => date.toISOString();

export const toNullableHttpDate = (date: Date | null) =>
  date ? toHttpDate(date) : null;
