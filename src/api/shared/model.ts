import { z } from "zod";

export const IdParamsSchema = z.object({
  id: z.coerce.number().int().min(1),
});

export const PaginationMetadataSchema = z.object({
  page: z.int().min(1),
  limit: z.int().min(1),
  total: z.int().min(0),
});

export const paginateSchema = <T extends z.ZodType>(itemSchema: T) =>
  z.object({
    data: itemSchema.array(),
    pagination: PaginationMetadataSchema,
  });

export interface Paginated<T> {
  data: T[];
  pagination: z.infer<typeof PaginationMetadataSchema>;
}
