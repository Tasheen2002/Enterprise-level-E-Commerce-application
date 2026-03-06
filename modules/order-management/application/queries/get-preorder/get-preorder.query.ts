import { IQuery } from "@/api/src/shared/application";

export interface GetPreorderQuery extends IQuery {
  orderItemId: string;
}

export interface PreorderResult {
  orderItemId: string;
  releaseDate?: Date;
  notifiedAt?: Date;
  hasReleaseDate: boolean;
  isCustomerNotified: boolean;
  isReleased: boolean;
}
