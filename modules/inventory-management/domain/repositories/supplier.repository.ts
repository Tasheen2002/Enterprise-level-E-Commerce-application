import { Supplier } from "../entities/supplier.entity";
import { SupplierId } from "../value-objects/supplier-id.vo";

export interface ISupplierRepository {
  // Basic CRUD
  save(supplier: Supplier): Promise<void>;
  findById(supplierId: SupplierId): Promise<Supplier | null>;
  delete(supplierId: SupplierId): Promise<void>;

  // Queries
  findByName(name: string): Promise<Supplier | null>;
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ suppliers: Supplier[]; total: number }>;

  // Existence checks
  exists(supplierId: SupplierId): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}
