import { v4 as uuidv4 } from "uuid";
import {
  Location,
  LocationAddress,
} from "../../domain/entities/location.entity";
import { LocationId } from "../../domain/value-objects/location-id.vo";
import {
  LocationType,
  LocationTypeVO,
} from "../../domain/value-objects/location-type.vo";
import { ILocationRepository } from "../../domain/repositories/location.repository";

export class LocationManagementService {
  constructor(private readonly locationRepository: ILocationRepository) {}

  async createLocation(
    type: string,
    name: string,
    address?: LocationAddress,
  ): Promise<Location> {
    // Check if location with same name already exists
    const existingLocation = await this.locationRepository.findByName(name);
    if (existingLocation) {
      throw new Error(`Location with name "${name}" already exists`);
    }

    const location = Location.create({
      locationId: LocationId.create(uuidv4()),
      type: LocationTypeVO.create(type),
      name,
      address,
    });

    await this.locationRepository.save(location);
    return location;
  }

  async updateLocation(
    locationId: string,
    data: {
      name?: string;
      address?: LocationAddress;
    },
  ): Promise<Location> {
    const location = await this.locationRepository.findById(
      LocationId.create(locationId),
    );

    if (!location) {
      throw new Error(`Location with ID ${locationId} not found`);
    }

    let updatedLocation = location;

    if (data.name) {
      // Check if new name is already taken by another location
      const existingLocation = await this.locationRepository.findByName(
        data.name,
      );
      if (
        existingLocation &&
        existingLocation.getLocationId().getValue() !== locationId
      ) {
        throw new Error(`Location with name "${data.name}" already exists`);
      }
      updatedLocation = updatedLocation.updateName(data.name);
    }

    if (data.address) {
      updatedLocation = updatedLocation.updateAddress(data.address);
    }

    await this.locationRepository.save(updatedLocation);
    return updatedLocation;
  }

  async deleteLocation(locationId: string): Promise<void> {
    const location = await this.locationRepository.findById(
      LocationId.create(locationId),
    );

    if (!location) {
      throw new Error(`Location with ID ${locationId} not found`);
    }

    await this.locationRepository.delete(LocationId.create(locationId));
  }

  async getLocation(locationId: string): Promise<Location | null> {
    return this.locationRepository.findById(LocationId.create(locationId));
  }

  async getLocationByName(name: string): Promise<Location | null> {
    return this.locationRepository.findByName(name);
  }

  async listLocations(options?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<{ locations: Location[]; total: number }> {
    if (options?.type) {
      const locationType = options.type.toLowerCase() as LocationType;
      const locations = await this.locationRepository.findByType(locationType);
      return {
        locations,
        total: locations.length,
      };
    }

    return this.locationRepository.findAll({
      limit: options?.limit,
      offset: options?.offset,
    });
  }
}
