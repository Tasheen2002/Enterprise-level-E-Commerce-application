import { Backorder } from "../entities/backorder.entity";
import { OrderItemId } from "../value-objects/order-item-id.vo";

export interface BackorderQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "promisedEta" | "notifiedAt";
  sortOrder?: "asc" | "desc";
}

export interface IBackorderRepository {
  // Basic CRUD
  save(backorder: Backorder): Promise<void>;
  delete(orderItemId: OrderItemId): Promise<void>;

  // Finders
  findByOrderItemId(orderItemId: OrderItemId): Promise<Backorder | null>;
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
  countByPromisedEtaBefore(date: Date): Promise<number>;

  // Existence checks
  exists(orderItemId: OrderItemId): Promise<boolean>;
}
