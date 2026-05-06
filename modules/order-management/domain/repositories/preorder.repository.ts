import { Preorder } from "../entities/preorder.entity";
import { OrderItemId } from "../value-objects/order-item-id.vo";

export interface PreorderQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "releaseDate" | "notifiedAt";
  sortOrder?: "asc" | "desc";
}

export interface IPreorderRepository {
  // Basic CRUD
  save(preorder: Preorder): Promise<void>;
  delete(orderItemId: OrderItemId): Promise<void>;

  // Finders
  findByOrderItemId(orderItemId: OrderItemId): Promise<Preorder | null>;
  findAll(options?: PreorderQueryOptions): Promise<Preorder[]>;
  findNotified(options?: PreorderQueryOptions): Promise<Preorder[]>;
  findUnnotified(options?: PreorderQueryOptions): Promise<Preorder[]>;
  findReleased(options?: PreorderQueryOptions): Promise<Preorder[]>;
  findByReleaseDateBefore(
    date: Date,
    options?: PreorderQueryOptions,
  ): Promise<Preorder[]>;

  // Queries
  count(): Promise<number>;
  countNotified(): Promise<number>;
  countUnnotified(): Promise<number>;
  countReleased(): Promise<number>;

  // Existence checks
  exists(orderItemId: OrderItemId): Promise<boolean>;
}
