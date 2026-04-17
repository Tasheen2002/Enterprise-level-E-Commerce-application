import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { LocationId } from "../value-objects/location-id.vo";
import { LocationTypeVO } from "../value-objects/location-type.vo";
import { LocationAddress, LocationAddressProps } from "../value-objects/location-address.vo";
import { EmptyFieldError } from "../errors";

// ── Domain Events ──────────────────────────────────────────────────────

export class LocationCreatedEvent extends DomainEvent {
  constructor(
    public readonly locationId: string,
    public readonly name: string,
  ) {
    super(locationId, "Location");
  }
  get eventType(): string { return "location.created"; }
  getPayload(): Record<string, unknown> {
    return { locationId: this.locationId, name: this.name };
  }
}

export class LocationUpdatedEvent extends DomainEvent {
  constructor(public readonly locationId: string) {
    super(locationId, "Location");
  }
  get eventType(): string { return "location.updated"; }
  getPayload(): Record<string, unknown> {
    return { locationId: this.locationId };
  }
}

export class LocationDeletedEvent extends DomainEvent {
  constructor(public readonly locationId: string) {
    super(locationId, "Location");
  }
  get eventType(): string { return "location.deleted"; }
  getPayload(): Record<string, unknown> {
    return { locationId: this.locationId };
  }
}

// ── Props & DTO ────────────────────────────────────────────────────────

export interface LocationProps {
  locationId: LocationId;
  type: LocationTypeVO;
  name: string;
  address?: LocationAddress;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationDTO {
  locationId: string;
  type: string;
  name: string;
  address?: LocationAddressProps;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class Location extends AggregateRoot {
  private constructor(private props: LocationProps) {
    super();
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new EmptyFieldError('name');
    }
  }

  static create(params: {
    type: string;
    name: string;
    address?: LocationAddressProps;
  }): Location {
    Location.validateName(params.name);
    const now = new Date();
    const location = new Location({
      locationId: LocationId.create(),
      type: LocationTypeVO.create(params.type),
      name: params.name,
      address: params.address ? LocationAddress.create(params.address) : undefined,
      createdAt: now,
      updatedAt: now,
    });
    location.addDomainEvent(
      new LocationCreatedEvent(
        location.props.locationId.getValue(),
        params.name,
      ),
    );
    return location;
  }

  static fromPersistence(props: LocationProps): Location {
    return new Location(props);
  }

  // ── Getters ────────────────────────────────────────────────────────

  get locationId(): LocationId { return this.props.locationId; }
  get type(): LocationTypeVO { return this.props.type; }
  get name(): string { return this.props.name; }
  get address(): LocationAddress | undefined { return this.props.address; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateName(name: string): void {
    Location.validateName(name);
    this.props.name = name;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new LocationUpdatedEvent(this.props.locationId.getValue()));
  }

  updateAddress(address: LocationAddress): void {
    this.props.address = address;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new LocationUpdatedEvent(this.props.locationId.getValue()));
  }

  markDeleted(): void {
    this.addDomainEvent(
      new LocationDeletedEvent(this.props.locationId.getValue()),
    );
  }

  equals(other: Location): boolean {
    return this.props.locationId.equals(other.props.locationId);
  }

  // ── Serialisation ──────────────────────────────────────────────────

  static toDTO(entity: Location): LocationDTO {
    return {
      locationId: entity.props.locationId.getValue(),
      type: entity.props.type.getValue(),
      name: entity.props.name,
      address: entity.props.address?.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
