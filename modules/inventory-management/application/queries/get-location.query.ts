import { IQuery, IQueryHandler, QueryResult } from "../../../../packages/core/src/application/cqrs";
import { LocationDTO } from "../../domain/entities/location.entity";
import { LocationManagementService } from "../services/location-management.service";

export interface GetLocationQuery extends IQuery {
  locationId: string;
}

export type LocationResult = LocationDTO;

export class GetLocationHandler implements IQueryHandler<
  GetLocationQuery,
  QueryResult<LocationResult>
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(query: GetLocationQuery): Promise<QueryResult<LocationResult>> {
    const location = await this.locationService.getLocation(query.locationId);
    return QueryResult.success(location);
  }
}
