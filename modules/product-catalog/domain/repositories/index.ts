export {
  IProductRepository,
  ProductQueryOptions,
  ProductSearchOptions,
  ProductCountOptions,
  type EnrichedVariantData,
  type EnrichedImageData,
  type EnrichedMediaData,
  type EnrichedCategoryData,
  type ProductEnrichment,
  type ProductMediaEnrichment,
} from "./product.repository";
export {
  IProductVariantRepository,
  VariantQueryOptions,
  VariantCountOptions,
} from "./product-variant.repository";
export {
  ICategoryRepository,
  CategoryQueryOptions,
  CategoryCountOptions,
} from "./category.repository";
export {
  IMediaAssetRepository,
  MediaAssetQueryOptions,
  MediaAssetCountOptions,
} from "./media-asset.repository";
export {
  IProductTagRepository,
  ProductTagQueryOptions,
  ProductTagCountOptions,
  type TagWithUsageCount,
  type TagKindBreakdown,
  type TagStatistics,
} from "./product-tag.repository";
export {
  ISizeGuideRepository,
  SizeGuideQueryOptions,
  SizeGuideCountOptions,
} from "./size-guide.repository";
export {
  IEditorialLookRepository,
  EditorialLookQueryOptions,
  EditorialLookCountOptions,
} from "./editorial-look.repository";

// Association repository interfaces
export {
  IProductTagAssociationRepository,
  type AssociationPaginationOptions,
} from "./product-tag-association.repository";
export {
  IProductMediaRepository,
  ProductMediaQueryOptions,
  ProductMediaCountOptions,
} from "./product-media.repository";
export {
  IVariantMediaRepository,
  VariantMediaQueryOptions,
  type ProductVariantMediaItem,
} from "./variant-media.repository";
