import { IQuery, IQueryHandler } from "../../../../packages/core/src/application/cqrs";
import { LocationDTO } from "../../domain/entities/location.entity";
import { LocationManagementService } from "../services/location-management.service";

export interface GetLocationQuery extends IQuery {
  readonly locationId: string;
}

export type LocationResult = LocationDTO;

export class GetLocationHandler implements IQueryHandler<
  GetLocationQuery,
  LocationResult
> {
  constructor(private readonly locationService: LocationManagementService) {}

  async handle(query: GetLocationQuery): Promise<LocationResult> {
    return this.locationService.getLocation(query.locationId);
  }
}
