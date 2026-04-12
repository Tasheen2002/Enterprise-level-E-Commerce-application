export { CreateProductHandler } from "./create-product.command";
export { UpdateProductHandler } from "./update-product.command";
export { DeleteProductHandler } from "./delete-product.command";
export { CreateProductVariantHandler } from "./create-product-variant.command";
export { UpdateProductVariantHandler } from "./update-product-variant.command";
export { DeleteProductVariantHandler } from "./delete-product-variant.command";
export { CreateCategoryHandler } from "./create-category.command";
export { UpdateCategoryHandler } from "./update-category.command";
export { DeleteCategoryHandler } from "./delete-category.command";
export { ReorderCategoriesHandler } from "./reorder-categories.command";

// Media asset commands
export { CreateMediaAssetHandler } from "./create-media-asset.command";
export { UpdateMediaAssetHandler } from "./update-media-asset.command";
export { DeleteMediaAssetHandler } from "./delete-media-asset.command";

// Product media commands
export { AddMediaToProductHandler } from "./add-media-to-product.command";
export { RemoveMediaFromProductHandler } from "./remove-media-from-product.command";
export { RemoveAllProductMediaHandler } from "./remove-all-product-media.command";
export { SetProductCoverImageHandler } from "./set-product-cover-image.command";
export { RemoveCoverImageHandler } from "./remove-cover-image.command";
export { ReorderProductMediaHandler } from "./reorder-product-media.command";
export { MoveMediaPositionHandler } from "./move-media-position.command";
export { SetProductMediaHandler } from "./set-product-media.command";
export { DuplicateProductMediaHandler } from "./duplicate-product-media.command";
export { CompactProductMediaPositionsHandler } from "./compact-product-media-positions.command";

// Product tag commands
export { CreateProductTagHandler } from "./create-product-tag.command";
export { UpdateProductTagHandler } from "./update-product-tag.command";
export { DeleteProductTagHandler } from "./delete-product-tag.command";
export { CreateBulkProductTagsHandler } from "./create-bulk-product-tags.command";
export { DeleteBulkProductTagsHandler } from "./delete-bulk-product-tags.command";
export { AssociateProductTagsHandler } from "./associate-product-tags.command";
export { RemoveProductTagAssociationHandler } from "./remove-product-tag-association.command";

// Size guide commands
export { CreateSizeGuideHandler } from "./create-size-guide.command";
export { UpdateSizeGuideHandler } from "./update-size-guide.command";
export { DeleteSizeGuideHandler } from "./delete-size-guide.command";
export { CreateRegionalSizeGuideHandler } from "./create-regional-size-guide.command";
export { CreateCategorySizeGuideHandler } from "./create-category-size-guide.command";
export { UpdateSizeGuideContentHandler } from "./update-size-guide-content.command";
export { ClearSizeGuideContentHandler } from "./clear-size-guide-content.command";
export { CreateBulkSizeGuidesHandler } from "./create-bulk-size-guides.command";
export { DeleteBulkSizeGuidesHandler } from "./delete-bulk-size-guides.command";

// Editorial look commands
export { CreateEditorialLookHandler } from "./create-editorial-look.command";
export { UpdateEditorialLookHandler } from "./update-editorial-look.command";
export { DeleteEditorialLookHandler } from "./delete-editorial-look.command";
export { PublishEditorialLookHandler } from "./publish-editorial-look.command";
export { UnpublishEditorialLookHandler } from "./unpublish-editorial-look.command";
export { ScheduleEditorialLookPublicationHandler } from "./schedule-editorial-look-publication.command";
export { ProcessScheduledEditorialLookPublicationsHandler } from "./process-scheduled-editorial-look-publications.command";
export { SetEditorialLookHeroImageHandler } from "./set-editorial-look-hero-image.command";
export { RemoveEditorialLookHeroImageHandler } from "./remove-editorial-look-hero-image.command";
export { AddProductToEditorialLookHandler } from "./add-product-to-editorial-look.command";
export { RemoveProductFromEditorialLookHandler } from "./remove-product-from-editorial-look.command";
export { SetEditorialLookProductsHandler } from "./set-editorial-look-products.command";
export { UpdateEditorialLookStoryContentHandler } from "./update-editorial-look-story-content.command";
export { ClearEditorialLookStoryContentHandler } from "./clear-editorial-look-story-content.command";
export { CreateBulkEditorialLooksHandler } from "./create-bulk-editorial-looks.command";
export { DeleteBulkEditorialLooksHandler } from "./delete-bulk-editorial-looks.command";
export { PublishBulkEditorialLooksHandler } from "./publish-bulk-editorial-looks.command";
export { DuplicateEditorialLookHandler } from "./duplicate-editorial-look.command";

// Variant media commands
export { AddMediaToVariantHandler } from "./add-media-to-variant.command";
export { RemoveMediaFromVariantHandler } from "./remove-media-from-variant.command";
export { RemoveAllVariantMediaHandler } from "./remove-all-variant-media.command";
export { SetVariantMediaHandler } from "./set-variant-media.command";
export { AddMediaToMultipleVariantsHandler } from "./add-media-to-multiple-variants.command";
export { AddMultipleMediaToVariantHandler } from "./add-multiple-media-to-variant.command";
export { DuplicateVariantMediaHandler } from "./duplicate-variant-media.command";
export { CopyProductVariantMediaHandler } from "./copy-product-variant-media.command";
