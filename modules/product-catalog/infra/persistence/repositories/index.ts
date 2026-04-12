// Repository implementations
export { ProductRepositoryImpl } from "./product.repository.impl";
export { ProductVariantRepositoryImpl } from "./product-variant.repository.impl";
export { CategoryRepositoryImpl } from "./category.repository.impl";
export { MediaAssetRepositoryImpl } from "./media-asset.repository.impl";
export { ProductTagRepositoryImpl } from "./product-tag.repository.impl";
export { SizeGuideRepositoryImpl } from "./size-guide.repository.impl";
export { EditorialLookRepositoryImpl } from "./editorial-look.repository.impl";
export { ProductMediaRepositoryImpl } from "./product-media.repository.impl";
export { VariantMediaRepositoryImpl } from "./variant-media.repository.impl";

// Export repository interfaces from domain layer
export type { IProductRepository } from "../../../domain/repositories/product.repository";
export type { IProductVariantRepository } from "../../../domain/repositories/product-variant.repository";
export type { ICategoryRepository } from "../../../domain/repositories/category.repository";
export type { IMediaAssetRepository } from "../../../domain/repositories/media-asset.repository";
export type { IProductTagRepository } from "../../../domain/repositories/product-tag.repository";
export type { ISizeGuideRepository } from "../../../domain/repositories/size-guide.repository";
export type { IEditorialLookRepository } from "../../../domain/repositories/editorial-look.repository";
export type { IProductMediaRepository } from "../../../domain/repositories/product-media.repository";
export type { IVariantMediaRepository } from "../../../domain/repositories/variant-media.repository";
