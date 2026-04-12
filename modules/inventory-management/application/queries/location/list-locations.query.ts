import { IQuery, IQueryHandler, QueryResult } from "../../../../../packages/core/src/application/cqrs";
import { LocationResult } from "./get-location.query";
import { LocationManagementService } from "../../services/location-management.service";

export interface ListLocationsQuery extends IQuery {
  limit?: number;
  offset?: number;
  type?: string;
}

export interface ListLocationsResult {
  locations: LocationResult[];
  total: number;
}

export class ListLocationsHandler implements IQueryHandler<
  ListLocationsQuery,
  QueryResult<ListLocationsResult>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(query: ListLocationsQuery): Promise<QueryResult<ListLocationsResult>> {
    const result = await this.locationService.listLocations({
      limit: query.limit,
      offset: query.offset,
      type: query.type,
    });
    return QueryResult.success({ locations: result.locations, total: result.total });
  }
}
