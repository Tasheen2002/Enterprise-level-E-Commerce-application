import { IQuery } from "@/api/src/shared/application";
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
