// Base interfaces from shared
export {
  QueryResult,
  IQuery,
  IQueryHandler,
} from "@/api/src/shared/application";

// Query interfaces and result types (type-only exports)
export type { GetProductQuery, ProductResult } from "./get-product.query.js";
export type {
  ListProductsQuery,
  ListProductsResult,
} from "./list-products.query.js";
export type {
  SearchProductsQuery,
  SearchProductsResult,
} from "./search-products.query.js";

// Query Handler classes (runtime exports)
export { GetProductHandler } from "./get-product.query.js";
export { ListProductsHandler } from "./list-products.query.js";
export { SearchProductsHandler } from "./search-products.query.js";
