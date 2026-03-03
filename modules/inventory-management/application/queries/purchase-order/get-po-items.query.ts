import { IQuery } from "@/api/src/shared/application";

export interface GetPOItemsQuery extends IQuery {
  poId: string;
}

export interface POItemResult {
  poId: string;
  variantId: string;
  orderedQty: number;
  receivedQty: number;
  isFullyReceived: boolean;
  isPartiallyReceived: boolean;
}
