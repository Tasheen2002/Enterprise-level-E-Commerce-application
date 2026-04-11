import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { SupplierId } from "../value-objects/supplier-id.vo";
import { SupplierName } from "../value-objects/supplier-name.vo";
import { SupplierContact } from "../value-objects/supplier-contact.vo";
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
}

export interface SupplierDTO {
  supplierId: string;
  name: string;
  leadTimeDays?: number;
  contacts: ReturnType<SupplierContact["toJSON"]>[];
}

// ── Entity ─────────────────────────────────────────────────────────────

export class Supplier extends AggregateRoot {
  private props: SupplierProps;

  private constructor(props: SupplierProps) {
    super();
    this.props = props;
    this.validate();
  }

  static create(params: {
    name: string;
    leadTimeDays?: number;
    contacts?: ReturnType<SupplierContact["toJSON"]>[];
  }): Supplier {
    const supplier = new Supplier({
      supplierId: SupplierId.create(),
      name: SupplierName.create(params.name),
      leadTimeDays: params.leadTimeDays,
      contacts: (params.contacts ?? []).map((c) => SupplierContact.create(c)),
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

  private validate(): void {
    if (this.props.leadTimeDays !== undefined && this.props.leadTimeDays < 0) {
      throw new DomainValidationError("Lead time days cannot be negative");
    }
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

  // ── Business Logic ─────────────────────────────────────────────────

  updateName(name: SupplierName): void {
    this.props.name = name;
    this.addDomainEvent(
      new SupplierUpdatedEvent(this.props.supplierId.getValue()),
    );
  }

  updateLeadTimeDays(leadTimeDays: number): void {
    if (leadTimeDays < 0) {
      throw new DomainValidationError("Lead time days cannot be negative");
    }
    this.props.leadTimeDays = leadTimeDays;
    this.addDomainEvent(
      new SupplierUpdatedEvent(this.props.supplierId.getValue()),
    );
  }

  updateContacts(contacts: SupplierContact[]): void {
    this.props.contacts = contacts;
    this.addDomainEvent(
      new SupplierUpdatedEvent(this.props.supplierId.getValue()),
    );
  }

  addContact(contact: SupplierContact): void {
    this.props.contacts = [...this.props.contacts, contact];
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
      contacts: entity.props.contacts.map((c) => c.toJSON()),
    };
  }
}
