import { IQuery } from "@/api/src/shared/application";

export interface GetPopularSearchesQuery extends IQuery {}

export interface PopularSearchResult {
  term: string;
  count: number;
}
