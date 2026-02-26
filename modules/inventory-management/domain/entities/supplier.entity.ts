import { SupplierId } from "../value-objects/supplier-id.vo";
import { DomainValidationError } from "../errors";

export interface SupplierContact {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface SupplierProps {
  supplierId: SupplierId;
  name: string;
  leadTimeDays?: number;
  contacts: SupplierContact[];
}

export class Supplier {
  private constructor(private readonly props: SupplierProps) {
    this.validate();
  }

  static create(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  static reconstitute(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new DomainValidationError("Supplier name is required");
    }
    if (this.props.leadTimeDays !== undefined && this.props.leadTimeDays < 0) {
      throw new DomainValidationError("Lead time days cannot be negative");
    }
  }

  getSupplierId(): SupplierId {
    return this.props.supplierId;
  }

  getName(): string {
    return this.props.name;
  }

  getLeadTimeDays(): number | undefined {
    return this.props.leadTimeDays;
  }

  getContacts(): SupplierContact[] {
    return this.props.contacts;
  }

  updateName(name: string): Supplier {
    if (!name || name.trim().length === 0) {
      throw new DomainValidationError("Supplier name is required");
    }
    return new Supplier({
      ...this.props,
      name,
    });
  }

  updateLeadTimeDays(leadTimeDays: number): Supplier {
    if (leadTimeDays < 0) {
      throw new DomainValidationError("Lead time days cannot be negative");
    }
    return new Supplier({
      ...this.props,
      leadTimeDays,
    });
  }

  updateContacts(contacts: SupplierContact[]): Supplier {
    return new Supplier({
      ...this.props,
      contacts,
    });
  }

  addContact(contact: SupplierContact): Supplier {
    return new Supplier({
      ...this.props,
      contacts: [...this.props.contacts, contact],
    });
  }

  toJSON() {
    return {
      supplierId: this.props.supplierId.getValue(),
      name: this.props.name,
      leadTimeDays: this.props.leadTimeDays,
      contacts: this.props.contacts,
    };
  }
}
