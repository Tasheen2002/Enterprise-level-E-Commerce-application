import { Location, LocationDTO } from "../../domain/entities/location.entity";
import { LocationId } from "../../domain/value-objects/location-id.vo";
import { LocationType } from "../../domain/value-objects/location-type.vo";
import { LocationAddress, LocationAddressProps } from "../../domain/value-objects/location-address.vo";
import { ILocationRepository } from "../../domain/repositories/location.repository";
import {
  LocationAlreadyExistsError,
  LocationNotFoundError,
} from "../../domain/errors/inventory-management.errors";

export class LocationManagementService {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async createLocation(
    type: string,
    name: string,
    address?: LocationAddressProps,
  ): Promise<LocationDTO> {
    const existingLocation = await this.locationRepository.findByName(name);
    if (existingLocation) {
      throw new LocationAlreadyExistsError(name);
    }

    const location = Location.create({ type, name, address });

    await this.locationRepository.save(location);
    return Location.toDTO(location);
  }

  async updateLocation(
    locationId: string,
    data: {
      name?: string;
      address?: LocationAddressProps;
    },
  ): Promise<LocationDTO> {
    const location = await this.locationRepository.findById(
      LocationId.fromString(locationId),
    );

    if (!location) {
      throw new LocationNotFoundError(locationId);
    }

    if (data.name) {
      const existingLocation = await this.locationRepository.findByName(data.name);
      if (existingLocation && existingLocation.locationId.getValue() !== locationId) {
        throw new LocationAlreadyExistsError(data.name);
      }
      location.updateName(data.name);
    }

    if (data.address) {
      location.updateAddress(LocationAddress.create(data.address));
    }

    await this.locationRepository.save(location);
    return Location.toDTO(location);
  }

  async deleteLocation(locationId: string): Promise<void> {
    const id = LocationId.fromString(locationId);
    const location = await this.locationRepository.findById(id);

    if (!location) {
      throw new LocationNotFoundError(locationId);
    }

    await this.locationRepository.delete(id);
  }

  async getLocation(locationId: string): Promise<LocationDTO> {
    const location = await this.locationRepository.findById(
      LocationId.fromString(locationId),
    );
    if (!location) {
      throw new LocationNotFoundError(locationId);
    }
    return Location.toDTO(location);
  }

  async getLocationByName(name: string): Promise<LocationDTO> {
    const location = await this.locationRepository.findByName(name);
    if (!location) {
      throw new LocationNotFoundError(name);
    }
    return Location.toDTO(location);
  }

  async listLocations(options?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<{ locations: LocationDTO[]; total: number }> {
    if (options?.type) {
      const locationType = options.type.toLowerCase() as LocationType;
      const locations = await this.locationRepository.findByType(locationType);
      return { locations: locations.map(Location.toDTO), total: locations.length };
    }

    const result = await this.locationRepository.findAll({
      limit: options?.limit,
      offset: options?.offset,
    });
    return { locations: result.items.map(Location.toDTO), total: result.total };
  }
}
