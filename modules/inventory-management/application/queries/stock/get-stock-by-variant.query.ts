import { IQuery } from "@/api/src/shared/application";

export interface GetStockByVariantQuery extends IQuery {
  variantId: string;
}
