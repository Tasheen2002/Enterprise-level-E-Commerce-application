import { Supplier, SupplierDTO } from "../../domain/entities/supplier.entity";
import { SupplierId } from "../../domain/value-objects/supplier-id.vo";
import { SupplierName } from "../../domain/value-objects/supplier-name.vo";
import { SupplierContact, SupplierContactProps } from "../../domain/value-objects/supplier-contact.vo";
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
    contacts?: SupplierContactProps[],
  ): Promise<SupplierDTO> {
    const existingSupplier = await this.supplierRepository.findByName(name);
    if (existingSupplier) {
      throw new SupplierAlreadyExistsError(name);
    }

    const supplier = Supplier.create({ name, leadTimeDays, contacts });

    await this.supplierRepository.save(supplier);
    return Supplier.toDTO(supplier);
  }

  async updateSupplier(
    supplierId: string,
    data: {
      name?: string;
      leadTimeDays?: number;
      contacts?: SupplierContactProps[];
    },
  ): Promise<SupplierDTO> {
    const supplier = await this.supplierRepository.findById(
      SupplierId.fromString(supplierId),
    );

    if (!supplier) {
      throw new SupplierNotFoundError(supplierId);
    }

    if (data.name) {
      const existingSupplier = await this.supplierRepository.findByName(data.name);
      if (existingSupplier && existingSupplier.supplierId.getValue() !== supplierId) {
        throw new SupplierAlreadyExistsError(data.name);
      }
      supplier.updateName(SupplierName.create(data.name));
    }

    if (data.leadTimeDays !== undefined) {
      supplier.updateLeadTimeDays(data.leadTimeDays);
    }

    if (data.contacts) {
      supplier.updateContacts(data.contacts.map((c) => SupplierContact.create(c)));
    }

    await this.supplierRepository.save(supplier);
    return Supplier.toDTO(supplier);
  }

  async deleteSupplier(supplierId: string): Promise<void> {
    const id = SupplierId.fromString(supplierId);
    const supplier = await this.supplierRepository.findById(id);

    if (!supplier) {
      throw new SupplierNotFoundError(supplierId);
    }

    await this.supplierRepository.delete(id);
  }

  async getSupplier(supplierId: string): Promise<SupplierDTO> {
    const supplier = await this.supplierRepository.findById(
      SupplierId.fromString(supplierId),
    );
    if (!supplier) {
      throw new SupplierNotFoundError(supplierId);
    }
    return Supplier.toDTO(supplier);
  }

  async getSupplierByName(name: string): Promise<SupplierDTO> {
    const supplier = await this.supplierRepository.findByName(name);
    if (!supplier) {
      throw new SupplierNotFoundError(name);
    }
    return Supplier.toDTO(supplier);
  }

  async listSuppliers(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ suppliers: SupplierDTO[]; total: number }> {
    const result = await this.supplierRepository.findAll(options);
    return { suppliers: result.items.map(Supplier.toDTO), total: result.total };
  }
}
