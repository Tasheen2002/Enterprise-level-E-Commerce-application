import { IQuery } from "@/api/src/shared/application";

export interface GetBackorderQuery extends IQuery {
  orderItemId: string;
}

export interface BackorderResult {
  orderItemId: string;
  promisedEta?: Date;
  notifiedAt?: Date;
  hasPromisedEta: boolean;
  isCustomerNotified: boolean;
}
