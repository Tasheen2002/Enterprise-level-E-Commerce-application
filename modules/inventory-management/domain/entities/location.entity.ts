import { LocationId } from "../value-objects/location-id.vo";
import {
  LocationType,
  LocationTypeVO,
} from "../value-objects/location-type.vo";
import { DomainValidationError } from "../errors";

export interface LocationAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export interface LocationProps {
  locationId: LocationId;
  type: LocationTypeVO;
  name: string;
  address?: LocationAddress;
}

export class Location {
  private constructor(private readonly props: LocationProps) {
    this.validate();
  }

  static create(props: LocationProps): Location {
    return new Location(props);
  }

  static reconstitute(props: LocationProps): Location {
    return new Location(props);
  }

  private validate(): void {
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new DomainValidationError("Location name is required");
    }
  }

  getLocationId(): LocationId {
    return this.props.locationId;
  }

  getType(): LocationTypeVO {
    return this.props.type;
  }

  getName(): string {
    return this.props.name;
  }

  getAddress(): LocationAddress | undefined {
    return this.props.address;
  }

  updateName(name: string): Location {
    if (!name || name.trim().length === 0) {
      throw new DomainValidationError("Location name is required");
    }
    return new Location({
      ...this.props,
      name,
    });
  }

  updateAddress(address: LocationAddress): Location {
    return new Location({
      ...this.props,
      address,
    });
  }

  toJSON() {
    return {
      locationId: this.props.locationId.getValue(),
      type: this.props.type.getValue(),
      name: this.props.name,
      address: this.props.address,
    };
  }
}
