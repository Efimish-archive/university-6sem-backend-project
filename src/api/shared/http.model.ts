import { z } from "zod";

export const IdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const AuthHeadersSchema = z.object({
  "x-user-id": z.coerce.number().int().positive().optional(),
});

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
