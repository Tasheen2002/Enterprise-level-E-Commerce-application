import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { LocationResult } from "./get-location.query";
import { LocationManagementService } from "../services/location-management.service";

export interface ListLocationsQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly type?: string;
}

export interface ListLocationsResult {
  readonly locations: LocationResult[];
  readonly total: number;
}

export class ListLocationsHandler implements IQueryHandler<
  ListLocationsQuery,
  ListLocationsResult
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(query: ListLocationsQuery): Promise<ListLocationsResult> {
    const result = await this.locationService.listLocations({
      limit: query.limit,
      offset: query.offset,
      type: query.type,
    });
    return { locations: result.locations, total: result.total };
  }
}
