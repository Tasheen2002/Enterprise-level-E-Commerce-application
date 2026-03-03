import { IQuery } from "@/api/src/shared/application";

export interface GetLocationQuery extends IQuery {
  locationId: string;
}

export interface LocationResult {
  locationId: string;
  type: string;
  name: string;
  address?: any;
}
