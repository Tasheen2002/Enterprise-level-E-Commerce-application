export {
  Product,
  ProductStatus,
  type ProductProps,
  type ProductDTO,
  ProductCreatedEvent,
  ProductUpdatedEvent,
  ProductPublishedEvent,
  ProductArchivedEvent,
  ProductDeletedEvent,
} from "./product.entity";
export {
  ProductVariant,
  type ProductVariantProps,
  type ProductVariantDTO,
  VariantCreatedEvent,
  VariantUpdatedEvent,
  VariantDeletedEvent,
} from "./product-variant.entity";
export {
  Category,
  type CategoryProps,
  type CategoryDTO,
} from "./category.entity";
export {
  MediaAsset,
  MediaAssetId,
  type MediaAssetProps,
  type MediaAssetDTO,
  MediaAssetCreatedEvent,
  MediaAssetUpdatedEvent,
  MediaAssetDeletedEvent,
} from "./media-asset.entity";
export {
  ProductTag,
  ProductTagId,
  type ProductTagProps,
  type ProductTagDTO,
} from "./product-tag.entity";
export {
  SizeGuide,
  SizeGuideId,
  Region,
  type SizeGuideProps,
  type SizeGuideDTO,
} from "./size-guide.entity";
export {
  EditorialLook,
  EditorialLookId,
  type EditorialLookProps,
  type EditorialLookDTO,
} from "./editorial-look.entity";

// Association entities
export {
  ProductCategory,
  type ProductCategoryProps,
  type ProductCategoryDTO,
} from "./product-category.entity";
export {
  ProductMedia,
  type ProductMediaProps,
  type ProductMediaDTO,
} from "./product-media.entity";
export {
  VariantMedia,
  type VariantMediaProps,
  type VariantMediaDTO,
} from "./variant-media.entity";
export {
  ProductTagAssociation,
  type ProductTagAssociationProps,
  type ProductTagAssociationDTO,
} from "./product-tag-association.entity";
export {
  EditorialLookProduct,
  type EditorialLookProductProps,
  type EditorialLookProductDTO,
} from "./editorial-look-product.entity";
