export type { GetProductQuery, ProductResult } from "./get-product/get-product.query";
export { GetProductHandler } from "./get-product/get-product.handler";

export type {
  ListProductsQuery,
  ListProductsResult,
} from "./list-products/list-products.query";
export { ListProductsHandler } from "./list-products/list-products.handler";

export type {
  SearchProductsQuery,
  SearchProductsResult,
} from "./search-products/search-products.query";
export { SearchProductsHandler } from "./search-products/search-products.handler";

export type { GetCategoryQuery } from "./get-category/get-category.query";
export { GetCategoryHandler } from "./get-category/get-category.handler";

export type { ListCategoriesQuery } from "./list-categories/list-categories.query";
export type { ListCategoriesResult } from "./list-categories/list-categories.handler";
export { ListCategoriesHandler } from "./list-categories/list-categories.handler";

export type { GetCategoryHierarchyQuery } from "./get-category-hierarchy/get-category-hierarchy.query";
export { GetCategoryHierarchyHandler } from "./get-category-hierarchy/get-category-hierarchy.handler";

export type {
  GetSearchSuggestionsQuery,
  GetSearchSuggestionsResult,
} from "./get-search-suggestions/get-search-suggestions.query";
export { GetSearchSuggestionsHandler } from "./get-search-suggestions/get-search-suggestions.handler";

export type {
  GetPopularSearchesQuery,
  PopularSearchResult,
} from "./get-popular-searches/get-popular-searches.query";
export { GetPopularSearchesHandler } from "./get-popular-searches/get-popular-searches.handler";

export type {
  GetSearchFiltersQuery,
  GetSearchFiltersResult,
} from "./get-search-filters/get-search-filters.query";
export { GetSearchFiltersHandler } from "./get-search-filters/get-search-filters.handler";

export type {
  GetSearchStatsQuery,
  GetSearchStatsResult,
} from "./get-search-stats/get-search-stats.query";
export { GetSearchStatsHandler } from "./get-search-stats/get-search-stats.handler";

export type { ListVariantsQuery } from "./list-variants/list-variants.query";
export type { ListVariantsResult } from "./list-variants/list-variants.handler";
export { ListVariantsHandler } from "./list-variants/list-variants.handler";

export type { GetVariantQuery } from "./get-variant/get-variant.query";
export type { VariantResult } from "./get-variant/get-variant.handler";
export { GetVariantHandler } from "./get-variant/get-variant.handler";
