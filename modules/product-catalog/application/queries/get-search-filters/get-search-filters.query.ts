import { IQuery } from "@/api/src/shared/application";
import { SearchFilter } from "../../services/product-search.service";

export interface GetSearchFiltersQuery extends IQuery {
  query?: string;
  category?: string;
}

export type GetSearchFiltersResult = SearchFilter[];
