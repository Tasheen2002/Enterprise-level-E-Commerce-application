export { ProductId } from "./product-id.vo";
export { VariantId } from "./variant-id.vo";
export { CategoryId } from "./category-id.vo";
export { Slug } from "./slug.vo";
export { Money, type MoneyDTO } from "./money.vo";
export { SKU } from "./sku.vo";
export { MediaAssetId } from "./media-asset-id.vo";
export { ProductTagId } from "./product-tag-id.vo";
export { SizeGuideId } from "./size-guide-id.vo";
export { EditorialLookId } from "./editorial-look-id.vo";
// Enums folded into VO files alongside namespace-augmented helper methods
// (canonical pattern). The single export carries both the enum values
// (primitive access via `Xxx.MEMBER`) and helpers (`Xxx.fromString`,
// `Xxx.getDisplayName`, `Xxx.getAllValues`).
export { ProductStatus } from "./product-status.vo";
export { Region } from "./region.vo";
