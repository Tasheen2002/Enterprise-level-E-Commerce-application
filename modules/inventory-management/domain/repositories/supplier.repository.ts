import { Supplier } from "../entities/supplier.entity";
import { SupplierId } from "../value-objects/supplier-id.vo";

export interface ISupplierRepository {
  save(supplier: Supplier): Promise<void>;
  findById(supplierId: SupplierId): Promise<Supplier | null>;
  delete(supplierId: SupplierId): Promise<void>;
  findByName(name: string): Promise<Supplier | null>;
  findAll(options?: SupplierQueryOptions): Promise<{ suppliers: Supplier[]; total: number }>;
  exists(supplierId: SupplierId): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}

export interface SupplierQueryOptions {
  limit?: number;
  offset?: number;
}
