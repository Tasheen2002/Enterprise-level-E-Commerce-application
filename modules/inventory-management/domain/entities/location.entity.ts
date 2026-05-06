import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { LocationId } from "../value-objects/location-id.vo";
import { LocationName } from "../value-objects/location-name.vo";
import { LocationTypeVO } from "../value-objects/location-type.vo";
import { LocationAddress, LocationAddressData } from "../value-objects/location-address.vo";

// ── Domain Events ──────────────────────────────────────────────────────

export class LocationCreatedEvent extends DomainEvent {
  // Domain events carry primitive fields only — the caller passes the VO's
  // primitive value via `.getValue()`, never the VO instance itself.
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
  name: LocationName;
  address?: LocationAddress;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationDTO {
  locationId: string;
  type: string;
  name: string;
  address?: LocationAddressData;
  createdAt: string;
  updatedAt: string;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class Location extends AggregateRoot {
  // Name validation lives in `LocationName` VO — both `create()` and
  // `fromPersistence()` paths route through `LocationName.create()` /
  // `fromString()` whose private constructor validates. The entity no
  // longer carries its own validateName helper.
  private constructor(private props: LocationProps) {
    super();
  }

  static create(params: {
    type: string;
    name: string;
    address?: LocationAddressData;
  }): Location {
    const name = LocationName.create(params.name);
    const now = new Date();
    const location = new Location({
      locationId: LocationId.create(),
      type: LocationTypeVO.create(params.type),
      name,
      address: params.address ? LocationAddress.create(params.address) : undefined,
      createdAt: now,
      updatedAt: now,
    });
    location.addDomainEvent(
      new LocationCreatedEvent(
        location.props.locationId.getValue(),
        name.getValue(),
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
  get name(): LocationName { return this.props.name; }
  get address(): LocationAddress | undefined { return this.props.address; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateName(name: LocationName): void {
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
    this.props.updatedAt = new Date();
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
      name: entity.props.name.getValue(),
      address: entity.props.address?.getValue(),
      createdAt: entity.props.createdAt.toISOString(),
      updatedAt: entity.props.updatedAt.toISOString(),
    };
  }
}
