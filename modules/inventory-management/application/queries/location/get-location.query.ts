import { IQuery, IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { LocationManagementService } from "../../services/location-management.service";
import { Location } from "../../../domain/entities/location.entity";

export interface GetLocationQuery extends IQuery {
  locationId: string;
}

export interface LocationResult {
  locationId: string;
  type: string;
  name: string;
  address?: any;
}

export class GetLocationHandler implements IQueryHandler<
  GetLocationQuery,
  QueryResult<LocationResult | null>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(
    query: GetLocationQuery,
  ): Promise<QueryResult<LocationResult | null>> {
    try {
      if (!query.locationId || query.locationId.trim().length === 0) {
        return QueryResult.failure("locationId: Location ID is required");
      }

      const location = await this.locationService.getLocation(query.locationId);

      if (!location) {
        return QueryResult.success<LocationResult | null>(null);
      }

      const result: LocationResult = {
        locationId: location.getLocationId().getValue(),
        type: location.getType().getValue(),
        name: location.getName(),
        address: location.getAddress(),
      };

      return QueryResult.success(result);
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
