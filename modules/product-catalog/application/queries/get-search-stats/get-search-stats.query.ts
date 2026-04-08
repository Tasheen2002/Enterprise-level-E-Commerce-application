import { IQuery } from "@/api/src/shared/application";
import { SearchStatistics } from "../../services/product-search.service";

export interface GetSearchStatsQuery extends IQuery {}

export type GetSearchStatsResult = SearchStatistics;
