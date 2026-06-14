import type { Paginated } from "./model";

export interface Service<
  Insert extends Record<string, any>,
  Select extends Record<string, any>,
  Query extends Record<string, any>,
> {
  findAll(query: Query): Promise<Paginated<Select>>;
  findById(id: number): Promise<Select>;
  create(data: Insert): Promise<Select>;
  update(id: number, data: Partial<Insert>): Promise<Select>;
  delete(id: number): Promise<Select>;
}
