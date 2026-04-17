import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { SupplierId } from "../value-objects/supplier-id.vo";
import { SupplierName } from "../value-objects/supplier-name.vo";
import {
  SupplierContact,
  SupplierContactProps,
} from "../value-objects/supplier-contact.vo";
import { DomainValidationError } from "../errors";

// ── Domain Events ──────────────────────────────────────────────────────

export class SupplierCreatedEvent extends DomainEvent {
  constructor(
    public readonly supplierId: string,
    public readonly name: string,
  ) {
    super(supplierId, "Supplier");
  }
  get eventType(): string {
    return "supplier.created";
  }
  getPayload(): Record<string, unknown> {
    return { supplierId: this.supplierId, name: this.name };
  }
}

export class SupplierUpdatedEvent extends DomainEvent {
  constructor(public readonly supplierId: string) {
    super(supplierId, "Supplier");
  }
  get eventType(): string {
    return "supplier.updated";
  }
  getPayload(): Record<string, unknown> {
    return { supplierId: this.supplierId };
  }
}

export class SupplierDeletedEvent extends DomainEvent {
  constructor(public readonly supplierId: string) {
    super(supplierId, "Supplier");
  }
  get eventType(): string {
    return "supplier.deleted";
  }
  getPayload(): Record<string, unknown> {
    return { supplierId: this.supplierId };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface SupplierProps {
  supplierId: SupplierId;
  name: SupplierName;
  leadTimeDays?: number;
  contacts: SupplierContact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierDTO {
  supplierId: string;
  name: string;
  leadTimeDays?: number;
  contacts: SupplierContactProps[];
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class Supplier extends AggregateRoot {
  private constructor(private props: SupplierProps) {
    super();
  }

  private static validateLeadTimeDays(leadTimeDays: number | undefined): void {
    if (leadTimeDays !== undefined && leadTimeDays < 0) {
      throw new DomainValidationError("Lead time days cannot be negative");
    }
  }

  static create(params: {
    name: string;
    leadTimeDays?: number;
    contacts?: SupplierContactProps[];
  }): Supplier {
    Supplier.validateLeadTimeDays(params.leadTimeDays);
    const now = new Date();
    const supplier = new Supplier({
      supplierId: SupplierId.create(),
      name: SupplierName.create(params.name),
      leadTimeDays: params.leadTimeDays,
      contacts: (params.contacts ?? []).map((c) => SupplierContact.create(c)),
      createdAt: now,
      updatedAt: now,
    });
    supplier.addDomainEvent(
      new SupplierCreatedEvent(
        supplier.props.supplierId.getValue(),
        params.name,
      ),
    );
    return supplier;
  }

  static fromPersistence(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get supplierId(): SupplierId {
    return this.props.supplierId;
  }
  get name(): SupplierName {
    return this.props.name;
  }
  get leadTimeDays(): number | undefined {
    return this.props.leadTimeDays;
  }
  get contacts(): SupplierContact[] {
    return this.props.contacts;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ── Business Logic ─────────────────────────────────────────────────

  updateName(name: SupplierName): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new SupplierUpdatedEvent(this.props.supplierId.getValue()),
    );
  }

  updateLeadTimeDays(leadTimeDays: number): void {
    Supplier.validateLeadTimeDays(leadTimeDays);
    this.props.leadTimeDays = leadTimeDays;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new SupplierUpdatedEvent(this.props.supplierId.getValue()),
    );
  }

  updateContacts(contacts: SupplierContact[]): void {
    this.props.contacts = contacts;
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new SupplierUpdatedEvent(this.props.supplierId.getValue()),
    );
  }

  addContact(contact: SupplierContact): void {
    this.props.contacts = [...this.props.contacts, contact];
    this.props.updatedAt = new Date();
    this.addDomainEvent(
      new SupplierUpdatedEvent(this.props.supplierId.getValue()),
    );
  }

  markDeleted(): void {
    this.addDomainEvent(
      new SupplierDeletedEvent(this.props.supplierId.getValue()),
    );
  }

  equals(other: Supplier): boolean {
    return this.props.supplierId.equals(other.props.supplierId);
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: Supplier): SupplierDTO {
    return {
      supplierId: entity.props.supplierId.getValue(),
      name: entity.props.name.getValue(),
      leadTimeDays: entity.props.leadTimeDays,
      contacts: entity.props.contacts.map((c) => c.getValue()),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
