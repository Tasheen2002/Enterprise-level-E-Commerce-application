import { v4 as uuidv4 } from "uuid";
import {
  Supplier,
  SupplierContact,
} from "../../domain/entities/supplier.entity";
import { SupplierId } from "../../domain/value-objects/supplier-id.vo";
import { ISupplierRepository } from "../../domain/repositories/supplier.repository";

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
      throw new Error(`Supplier with name "${name}" already exists`);
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
      throw new Error(`Supplier with ID ${supplierId} not found`);
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
        throw new Error(`Supplier with name "${data.name}" already exists`);
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
      throw new Error(`Supplier with ID ${supplierId} not found`);
    }

    await this.supplierRepository.delete(SupplierId.create(supplierId));
  }

  async getSupplier(supplierId: string): Promise<Supplier | null> {
    return this.supplierRepository.findById(SupplierId.create(supplierId));
  }

  async getSupplierByName(name: string): Promise<Supplier | null> {
    return this.supplierRepository.findByName(name);
  }

  async listSuppliers(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ suppliers: Supplier[]; total: number }> {
    return this.supplierRepository.findAll(options);
  }
}
