export type { GetProductQuery, ProductResult } from "./get-product.query";
export { GetProductHandler } from "./get-product.handler";

export type {
  ListProductsQuery,
  ListProductsResult,
} from "./list-products.query";
export { ListProductsHandler } from "./list-products.handler";

export type {
  SearchProductsQuery,
  SearchProductsResult,
} from "./search-products.query";
export { SearchProductsHandler } from "./search-products.handler";

export type { GetCategoryQuery } from "./get-category.query";
export { GetCategoryHandler } from "./get-category.handler";

export type { ListCategoriesQuery } from "./list-categories.query";
export type { ListCategoriesResult } from "./list-categories.handler";
export { ListCategoriesHandler } from "./list-categories.handler";

export type { GetCategoryHierarchyQuery } from "./get-category-hierarchy.query";
export { GetCategoryHierarchyHandler } from "./get-category-hierarchy.handler";

export type {
  GetSearchSuggestionsQuery,
  GetSearchSuggestionsResult,
} from "./get-search-suggestions.query";
export { GetSearchSuggestionsHandler } from "./get-search-suggestions.handler";

export type {
  GetPopularSearchesQuery,
  PopularSearchResult,
} from "./get-popular-searches.query";
export { GetPopularSearchesHandler } from "./get-popular-searches.handler";

export type {
  GetSearchFiltersQuery,
  GetSearchFiltersResult,
} from "./get-search-filters.query";
export { GetSearchFiltersHandler } from "./get-search-filters.handler";

export type {
  GetSearchStatsQuery,
  GetSearchStatsResult,
} from "./get-search-stats.query";
export { GetSearchStatsHandler } from "./get-search-stats.handler";

export type { ListVariantsQuery } from "./list-variants.query";
export type { ListVariantsResult } from "./list-variants.handler";
export { ListVariantsHandler } from "./list-variants.handler";

export type { GetVariantQuery } from "./get-variant.query";
export type { VariantResult } from "./get-variant.handler";
export { GetVariantHandler } from "./get-variant.handler";
