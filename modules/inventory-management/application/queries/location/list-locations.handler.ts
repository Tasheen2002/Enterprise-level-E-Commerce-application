import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import {
  ListLocationsQuery,
  ListLocationsResult,
} from "./list-locations.query";
import { LocationResult } from "./get-location.query";
import { LocationManagementService } from "../../services/location-management.service";

export class ListLocationsHandler implements IQueryHandler<
  ListLocationsQuery,
  QueryResult<ListLocationsResult>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(
    query: ListLocationsQuery,
  ): Promise<QueryResult<ListLocationsResult>> {
    try {
      const result = await this.locationService.listLocations({
        limit: query.limit,
        offset: query.offset,
        type: query.type,
      });

      const locations: LocationResult[] = result.locations.map((location) => ({
        locationId: location.getLocationId().getValue(),
        type: location.getType().getValue(),
        name: location.getName(),
        address: location.getAddress(),
      }));

      return QueryResult.success({
        locations,
        total: result.total,
      });
    } catch (error) {
      return QueryResult.failure(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  }
}
