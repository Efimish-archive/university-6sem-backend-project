import { z } from "zod";

export const IdParamsSchema = z.object({
  id: z.coerce.number().int().min(1),
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
  total: number;
};

export type ListResponse<T> = {
  data: T[];
  pagination: ListMeta;
};

export const toLimitOffset = (query: PaginationQuery) => ({
  limit: query.limit,
  offset: (query.page - 1) * query.limit,
});

export const listResponse = <T>(
  data: T[],
  query: PaginationQuery,
  total: number,
): ListResponse<T> => ({
  data,
  pagination: {
    page: query.page,
    limit: query.limit,
    total,
  },
});

export const listResponseSchema = (itemSchema: z.ZodType) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.int().min(1),
      limit: z.int().min(1),
      total: z.int().min(0),
    }),
  });

export const toHttpDate = (date: Date) => date.toISOString();

export const toNullableHttpDate = (date: Date | null) =>
  date ? toHttpDate(date) : null;
