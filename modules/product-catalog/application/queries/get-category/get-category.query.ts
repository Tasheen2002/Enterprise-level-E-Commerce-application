import { IQuery } from "@/api/src/shared/application";

export interface GetCategoryQuery extends IQuery {
  categoryId?: string;
  slug?: string;
}
