import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { LocationId } from "../value-objects/location-id.vo";
import { LocationTypeVO } from "../value-objects/location-type.vo";
import { LocationAddress } from "../value-objects/location-address.vo";
import { DomainValidationError } from "../errors";

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
}

export interface LocationDTO {
  locationId: string;
  type: string;
  name: string;
  address?: ReturnType<LocationAddress["toJSON"]>;
}

// ── Entity ─────────────────────────────────────────────────────────────

export class Location extends AggregateRoot {
  private props: LocationProps;

  private constructor(props: LocationProps) {
    super();
    this.props = props;
    this.validate();
  }

  static create(params: {
    type: string;
    name: string;
    address?: ReturnType<LocationAddress["toJSON"]>;
  }): Location {
    const location = new Location({
      locationId: LocationId.create(),
      type: LocationTypeVO.create(params.type),
      name: params.name,
      address: params.address ? LocationAddress.create(params.address) : undefined,
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

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new DomainValidationError("Location name is required");
    }
  }

  // ── Getters ────────────────────────────────────────────────────────

  get locationId(): LocationId { return this.props.locationId; }
  get type(): LocationTypeVO { return this.props.type; }
  get name(): string { return this.props.name; }
  get address(): LocationAddress | undefined { return this.props.address; }

  // ── Business Logic ─────────────────────────────────────────────────

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new DomainValidationError("Location name is required");
    }
    this.props.name = name;
    this.addDomainEvent(new LocationUpdatedEvent(this.props.locationId.getValue()));
  }

  updateAddress(address: LocationAddress): void {
    this.props.address = address;
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
      address: entity.props.address?.toJSON(),
    };
  }
}
