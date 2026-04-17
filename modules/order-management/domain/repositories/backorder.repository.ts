import { Backorder } from "../entities/backorder.entity";

export interface BackorderQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "promisedEta" | "notifiedAt";
  sortOrder?: "asc" | "desc";
}

export interface IBackorderRepository {
  // Basic CRUD
  save(backorder: Backorder): Promise<void>;
  delete(orderItemId: string): Promise<void>;

  // Finders
  findByOrderItemId(orderItemId: string): Promise<Backorder | null>;
  findAll(options?: BackorderQueryOptions): Promise<Backorder[]>;
  findNotified(options?: BackorderQueryOptions): Promise<Backorder[]>;
  findUnnotified(options?: BackorderQueryOptions): Promise<Backorder[]>;
  findByPromisedEtaBefore(
    date: Date,
    options?: BackorderQueryOptions,
  ): Promise<Backorder[]>;

  // Queries
  count(): Promise<number>;
  countNotified(): Promise<number>;
  countUnnotified(): Promise<number>;

  // Existence checks
  exists(orderItemId: string): Promise<boolean>;
}
