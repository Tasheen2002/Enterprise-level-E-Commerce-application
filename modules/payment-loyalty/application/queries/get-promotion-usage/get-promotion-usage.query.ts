import { IQuery } from "@/api/src/shared/application";

export interface GetPromotionUsageQuery extends IQuery {
  promoId: string;
}
