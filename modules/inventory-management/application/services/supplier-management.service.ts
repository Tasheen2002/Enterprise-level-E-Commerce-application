import { v4 as uuidv4 } from "uuid";
import {
  Supplier,
  SupplierContact,
} from "../../domain/entities/supplier.entity";
import { SupplierId } from "../../domain/value-objects/supplier-id.vo";
import { ISupplierRepository } from "../../domain/repositories/supplier.repository";
import {
  SupplierAlreadyExistsError,
  SupplierNotFoundError,
} from "../../domain/errors/inventory-management.errors";

export class SupplierManagementService {
  constructor(private readonly supplierRepository: ISupplierRepository) {}

  async createSupplier(
    name: string,
    leadTimeDays?: number,
    contacts?: SupplierContact[],
  ): Promise<Supplier> {
    // Check if supplier with same name already exists
    const existingSupplier = await this.supplierRepository.findByName(name);
    if (existingSupplier) {
      throw new SupplierAlreadyExistsError(name);
    }

    const supplier = Supplier.create({
      supplierId: SupplierId.create(uuidv4()),
      name,
      leadTimeDays,
      contacts: contacts || [],
    });

    await this.supplierRepository.save(supplier);
    return supplier;
  }

  async updateSupplier(
    supplierId: string,
    data: {
      name?: string;
      leadTimeDays?: number;
      contacts?: SupplierContact[];
    },
  ): Promise<Supplier> {
    const supplier = await this.supplierRepository.findById(
      SupplierId.create(supplierId),
    );

    if (!supplier) {
      throw new SupplierNotFoundError(supplierId);
    }

    let updatedSupplier = supplier;

    if (data.name) {
      // Check if new name is already taken by another supplier
      const existingSupplier = await this.supplierRepository.findByName(
        data.name,
      );
      if (
        existingSupplier &&
        existingSupplier.getSupplierId().getValue() !== supplierId
      ) {
        throw new SupplierAlreadyExistsError(data.name);
      }
      updatedSupplier = updatedSupplier.updateName(data.name);
    }

    if (data.leadTimeDays !== undefined) {
      updatedSupplier = updatedSupplier.updateLeadTimeDays(data.leadTimeDays);
    }

    if (data.contacts) {
      updatedSupplier = updatedSupplier.updateContacts(data.contacts);
    }

    await this.supplierRepository.save(updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    const supplier = await this.supplierRepository.findById(
      SupplierId.create(supplierId),
    );

    if (!supplier) {
      throw new SupplierNotFoundError(supplierId);
    }

    await this.supplierRepository.delete(SupplierId.create(supplierId));
  }

  async getSupplier(supplierId: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findById(
      SupplierId.create(supplierId),
    );
    if (!supplier) {
      throw new SupplierNotFoundError(supplierId);
    }
    return supplier;
  }

  async getSupplierByName(name: string): Promise<Supplier> {
    const supplier = await this.supplierRepository.findByName(name);
    if (!supplier) {
      throw new SupplierNotFoundError(name);
    }
    return supplier;
  }

  async listSuppliers(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ suppliers: Supplier[]; total: number }> {
    return this.supplierRepository.findAll(options);
  }
}
