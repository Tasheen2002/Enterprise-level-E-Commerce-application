import { Location } from "../entities/location.entity";
import { LocationId } from "../value-objects/location-id.vo";
import { LocationType } from "../value-objects/location-type.vo";

export interface ILocationRepository {
  save(location: Location): Promise<void>;
  findById(locationId: LocationId): Promise<Location | null>;
  delete(locationId: LocationId): Promise<void>;
  findByType(type: LocationType): Promise<Location[]>;
  findByName(name: string): Promise<Location | null>;
  findAll(
    options?: LocationQueryOptions,
  ): Promise<{ locations: Location[]; total: number }>;
  exists(locationId: LocationId): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}

export interface LocationQueryOptions {
  limit?: number;
  offset?: number;
}
