import { IQueryHandler, QueryResult } from "@/api/src/shared/application";
import { GetLocationQuery, LocationResult } from "./get-location.query";
import { LocationManagementService } from "../../services/location-management.service";

export class GetLocationHandler implements IQueryHandler<
  GetLocationQuery,
  QueryResult<LocationResult>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(query: GetLocationQuery): Promise<QueryResult<LocationResult>> {
    try {
      const location = await this.locationService.getLocation(query.locationId);

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
