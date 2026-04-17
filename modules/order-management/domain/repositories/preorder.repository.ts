import { Preorder } from "../entities/preorder.entity";

export interface PreorderQueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: "releaseDate" | "notifiedAt";
  sortOrder?: "asc" | "desc";
}

export interface IPreorderRepository {
  // Basic CRUD
  save(preorder: Preorder): Promise<void>;
  delete(orderItemId: string): Promise<void>;

  // Finders
  findByOrderItemId(orderItemId: string): Promise<Preorder | null>;
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
  exists(orderItemId: string): Promise<boolean>;
}
