import { ReturnItem } from "../entities/return-item.entity.js";
import { ItemCondition, ItemDisposition } from "../value-objects/index.js";

export interface ReturnItemFilterOptions {
  rmaId?: string;
  orderItemId?: string;
  condition?: ItemCondition;
  disposition?: ItemDisposition;
  hasFees?: boolean;
}

export interface IReturnItemRepository {
  // Basic CRUD (composite key: rmaId + orderItemId)
  save(item: ReturnItem): Promise<void>;
  update(item: ReturnItem): Promise<void>;
  delete(rmaId: string, orderItemId: string): Promise<void>;

  // Finders
  findById(rmaId: string, orderItemId: string): Promise<ReturnItem | null>;
  findByRmaId(rmaId: string): Promise<ReturnItem[]>;
  findByOrderItemId(orderItemId: string): Promise<ReturnItem[]>;
  findAll(): Promise<ReturnItem[]>;

  // Advanced queries
  findWithFilters(filters: ReturnItemFilterOptions): Promise<ReturnItem[]>;
  findByCondition(condition: ItemCondition): Promise<ReturnItem[]>;
  findByDisposition(disposition: ItemDisposition): Promise<ReturnItem[]>;
  findItemsForRestock(rmaId?: string): Promise<ReturnItem[]>;
  findItemsForRepair(rmaId?: string): Promise<ReturnItem[]>;
  findItemsForDiscard(rmaId?: string): Promise<ReturnItem[]>;
  findItemsWithFees(rmaId?: string): Promise<ReturnItem[]>;

  // Counts
  countByRmaId(rmaId: string): Promise<number>;
  countByCondition(condition: ItemCondition): Promise<number>;
  countByDisposition(disposition: ItemDisposition): Promise<number>;
  count(filters?: ReturnItemFilterOptions): Promise<number>;

  // Existence checks
  exists(rmaId: string, orderItemId: string): Promise<boolean>;
  hasItemsForRma(rmaId: string): Promise<boolean>;

  // Batch operations
  saveAll(items: ReturnItem[]): Promise<void>;
  deleteByRmaId(rmaId: string): Promise<void>;
}
