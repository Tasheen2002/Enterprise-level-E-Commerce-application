import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { PaginatedResult } from "../../../../packages/core/src/domain/interfaces/paginated-result.interface";
import { LocationResult } from "./get-location.query";
import { LocationManagementService } from "../services/location-management.service";

export interface ListLocationsQuery extends IQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly type?: string;
}

export class ListLocationsHandler implements IQueryHandler<
  ListLocationsQuery,
  PaginatedResult<LocationResult>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(query: ListLocationsQuery): Promise<PaginatedResult<LocationResult>> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const result = await this.locationService.listLocations({
      limit,
      offset,
      type: query.type,
    });
    return {
      items: result.locations,
      total: result.total,
      limit,
      offset,
      hasMore: offset + result.locations.length < result.total,
    };
  }
}
