// Base class utilities (runtime export)
export {
  CommandResult,
  ICommand,
  ICommandHandler,
} from "@/api/src/shared/application";

// Export type-only interfaces
export type { CreateProductCommand } from "./create-product.command.js";
export type { UpdateProductCommand } from "./update-product.command.js";
export type { DeleteProductCommand } from "./delete-product.command.js";
export type { CreateProductVariantCommand } from "./create-product-variant.command.js";
export type { UpdateProductVariantCommand } from "./update-product-variant.command.js";
export type { DeleteProductVariantCommand } from "./delete-product-variant.command.js";
export type { CreateCategoryCommand } from "./create-category.command.js";
export type { UpdateCategoryCommand } from "./update-category.command.js";
export type { DeleteCategoryCommand } from "./delete-category.command.js";
export type { CreateProductTagCommand } from "./create-product-tag.command.js";
export type { CreateMediaAssetCommand } from "./create-media-asset.command.js";
export type { AssociateProductMediaCommand } from "./associate-product-media.command.js";

// Export Handler classes (runtime exports)
export { CreateProductHandler } from "./create-product.command.js";
export { UpdateProductHandler } from "./update-product.command.js";
export { DeleteProductHandler } from "./delete-product.command.js";
export { CreateProductVariantHandler } from "./create-product-variant.command.js";
export { UpdateProductVariantHandler } from "./update-product-variant.command.js";
export { DeleteProductVariantHandler } from "./delete-product-variant.command.js";
export { CreateCategoryHandler } from "./create-category.command.js";
export { UpdateCategoryHandler } from "./update-category.command.js";
export { DeleteCategoryHandler } from "./delete-category.command.js";
export { CreateProductTagHandler } from "./create-product-tag.command.js";
export { CreateMediaAssetHandler } from "./create-media-asset.command.js";
export { AssociateProductMediaHandler } from "./associate-product-media.command.js";
