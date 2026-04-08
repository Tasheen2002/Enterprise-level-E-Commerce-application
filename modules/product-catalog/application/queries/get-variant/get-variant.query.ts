import { IQuery } from "@/api/src/shared/application";

export interface GetVariantQuery extends IQuery {
  variantId: string;
}
