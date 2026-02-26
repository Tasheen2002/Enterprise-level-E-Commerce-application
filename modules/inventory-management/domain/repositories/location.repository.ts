import { Location } from "../entities/location.entity";
import { LocationId } from "../value-objects/location-id.vo";
import { LocationType } from "../value-objects/location-type.vo";

export interface ILocationRepository {
  // Basic CRUD
  save(location: Location): Promise<void>;
  findById(locationId: LocationId): Promise<Location | null>;
  delete(locationId: LocationId): Promise<void>;

  // Queries
  findByType(type: LocationType): Promise<Location[]>;
  findByName(name: string): Promise<Location | null>;
  findAll(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ locations: Location[]; total: number }>;

  // Existence checks
  exists(locationId: LocationId): Promise<boolean>;
  existsByName(name: string): Promise<boolean>;
}
