import { Location, LocationDTO } from "../../domain/entities/location.entity";
import { LocationId } from "../../domain/value-objects/location-id.vo";
import { LocationName } from "../../domain/value-objects/location-name.vo";
import { LocationTypeVO } from "../../domain/value-objects/location-type.vo";
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
    // Wrap raw string in VO at the service boundary; the repo no longer
    // accepts raw `string` for name. VO factory validates length/emptiness.
    const nameVo = LocationName.create(name);
    const existingLocation = await this.locationRepository.findByName(nameVo);
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
      const newNameVo = LocationName.create(data.name);
      const existingLocation = await this.locationRepository.findByName(newNameVo);
      if (existingLocation && existingLocation.locationId.getValue() !== locationId) {
        throw new LocationAlreadyExistsError(data.name);
      }
      location.updateName(newNameVo);
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
    const location = await this.locationRepository.findByName(LocationName.create(name));
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
      // Wrap raw string in VO at the service boundary; VO factory validates
      // and the repo no longer accepts the underlying enum primitive.
      const locationTypeVo = LocationTypeVO.create(options.type);
      const locations = await this.locationRepository.findByType(locationTypeVo);
      return { locations: locations.map(Location.toDTO), total: locations.length };
    }

    const result = await this.locationRepository.findAll({
      limit: options?.limit,
      offset: options?.offset,
    });
    return { locations: result.items.map(Location.toDTO), total: result.total };
  }
}
