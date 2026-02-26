import { IQuery, IQueryHandler, CommandResult } from "@/api/src/shared/application";
import { LocationManagementService } from "../../services/location-management.service";
import { LocationResult } from "./get-location.query";

export interface ListLocationsQuery extends IQuery {
  limit?: number;
  offset?: number;
  type?: string;
}

export interface ListLocationsResult {
  locations: LocationResult[];
  total: number;
}

export class ListLocationsQueryHandler implements IQueryHandler<
  ListLocationsQuery,
  CommandResult<ListLocationsResult>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(
    query: ListLocationsQuery,
  ): Promise<CommandResult<ListLocationsResult>> {
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

      return CommandResult.success({
        locations,
        total: result.total,
      });
    } catch (error) {
      return CommandResult.failure<ListLocationsResult>(
        error instanceof Error ? error.message : "Unknown error occurred",
        [error instanceof Error ? error.message : "Unknown error"],
      );
    }
  }
}

export { ListLocationsQueryHandler as ListLocationsHandler };
