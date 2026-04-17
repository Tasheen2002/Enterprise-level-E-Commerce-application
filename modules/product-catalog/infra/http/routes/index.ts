import { FastifyInstance } from "fastify";
import { ProductController } from "../controllers/product.controller";
import { CategoryController } from "../controllers/category.controller";
import { VariantController } from "../controllers/variant.controller";
import { MediaController } from "../controllers/media.controller";
import { ProductMediaController } from "../controllers/product-media.controller";
import { ProductTagController } from "../controllers/product-tag.controller";
import { SearchController } from "../controllers/search.controller";
import { SizeGuideController } from "../controllers/size-guide.controller";
import { EditorialLookController } from "../controllers/editorial-look.controller";
import { VariantMediaController } from "../controllers/variant-media.controller";
import { productRoutes } from "./product.routes";
import { categoryRoutes } from "./category.routes";
import { variantRoutes } from "./variant.routes";
import { mediaRoutes } from "./media.routes";
import { productMediaRoutes } from "./product-media.routes";
import { productTagRoutes } from "./product-tag.routes";
import { searchRoutes } from "./search.routes";
import { sizeGuideRoutes } from "./size-guide.routes";
import { editorialLookRoutes } from "./editorial-look.routes";
import { variantMediaRoutes } from "./variant-media.routes";
import {
  ProductManagementService,
  CategoryManagementService,
  MediaManagementService,
  VariantManagementService,
  ProductSearchService,
  ProductTagManagementService,
  SizeGuideManagementService,
  EditorialLookManagementService,
  ProductMediaManagementService,
  VariantMediaManagementService,
  // Product commands
  CreateProductHandler,
  UpdateProductHandler,
  DeleteProductHandler,
  // Category commands
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler,
  ReorderCategoriesHandler,
  // Variant commands
  CreateProductVariantHandler,
  UpdateProductVariantHandler,
  DeleteProductVariantHandler,
  // Media asset commands
  CreateMediaAssetHandler,
  UpdateMediaAssetHandler,
  DeleteMediaAssetHandler,
  // Product media commands
  AddMediaToProductHandler,
  RemoveMediaFromProductHandler,
  RemoveAllProductMediaHandler,
  SetProductCoverImageHandler,
  RemoveCoverImageHandler,
  ReorderProductMediaHandler,
  MoveMediaPositionHandler,
  SetProductMediaHandler,
  DuplicateProductMediaHandler,
  CompactProductMediaPositionsHandler,
  // Product tag commands
  CreateProductTagHandler,
  UpdateProductTagHandler,
  DeleteProductTagHandler,
  CreateBulkProductTagsHandler,
  DeleteBulkProductTagsHandler,
  AssociateProductTagsHandler,
  RemoveProductTagAssociationHandler,
  // Size guide commands
  CreateSizeGuideHandler,
  UpdateSizeGuideHandler,
  DeleteSizeGuideHandler,
  CreateRegionalSizeGuideHandler,
  CreateCategorySizeGuideHandler,
  UpdateSizeGuideContentHandler,
  ClearSizeGuideContentHandler,
  CreateBulkSizeGuidesHandler,
  DeleteBulkSizeGuidesHandler,
  // Editorial look commands
  CreateEditorialLookHandler,
  UpdateEditorialLookHandler,
  DeleteEditorialLookHandler,
  PublishEditorialLookHandler,
  UnpublishEditorialLookHandler,
  ScheduleEditorialLookPublicationHandler,
  ProcessScheduledEditorialLookPublicationsHandler,
  SetEditorialLookHeroImageHandler,
  RemoveEditorialLookHeroImageHandler,
  AddProductToEditorialLookHandler,
  RemoveProductFromEditorialLookHandler,
  SetEditorialLookProductsHandler,
  UpdateEditorialLookStoryContentHandler,
  ClearEditorialLookStoryContentHandler,
  CreateBulkEditorialLooksHandler,
  DeleteBulkEditorialLooksHandler,
  PublishBulkEditorialLooksHandler,
  DuplicateEditorialLookHandler,
  // Variant media commands
  AddMediaToVariantHandler,
  RemoveMediaFromVariantHandler,
  RemoveAllVariantMediaHandler,
  SetVariantMediaHandler,
  AddMediaToMultipleVariantsHandler,
  AddMultipleMediaToVariantHandler,
  DuplicateVariantMediaHandler,
  CopyProductVariantMediaHandler,
  // Product queries
  GetProductHandler,
  ListProductsHandler,
  SearchProductsHandler,
  // Category queries
  GetCategoryHandler,
  ListCategoriesHandler,
  GetCategoryHierarchyHandler,
  // Variant queries
  GetVariantHandler,
  ListVariantsHandler,
  // Search queries
  GetSearchSuggestionsHandler,
  GetPopularSearchesHandler,
  GetSearchFiltersHandler,
  GetSearchStatsHandler,
  // Media asset queries
  GetMediaAssetHandler,
  SearchMediaAssetsHandler,
  // Product media queries
  GetProductMediaHandler,
  GetProductsUsingAssetHandler,
  GetProductMediaAssetUsageCountHandler,
  ValidateProductMediaHandler,
  GetProductMediaStatisticsHandler,
  // Product tag queries
  ListProductTagsHandler,
  GetProductTagHandler,
  GetProductTagSuggestionsHandler,
  GetProductTagStatsHandler,
  GetMostUsedProductTagsHandler,
  ValidateProductTagHandler,
  GetProductTagsHandler,
  GetTagProductsHandler,
  // Size guide queries
  ListSizeGuidesHandler,
  GetSizeGuideHandler,
  GetRegionalSizeGuidesHandler,
  GetGeneralSizeGuidesHandler,
  GetSizeGuideStatsHandler,
  GetAvailableSizeGuideRegionsHandler,
  GetAvailableSizeGuideCategoriesHandler,
  ValidateSizeGuideUniquenessHandler,
  // Editorial look queries
  ListEditorialLooksHandler,
  GetEditorialLookHandler,
  GetReadyToPublishEditorialLooksHandler,
  GetEditorialLooksByHeroAssetHandler,
  GetEditorialLookProductsHandler,
  GetProductEditorialLooksHandler,
  GetEditorialLooksByProductHandler,
  GetEditorialLookStatsHandler,
  GetPopularEditorialLookProductsHandler,
  ValidateEditorialLookForPublicationHandler,
  // Variant media queries
  GetVariantMediaHandler,
  GetProductVariantMediaHandler,
  GetVariantsUsingAssetHandler,
  GetVariantMediaAssetUsageCountHandler,
  GetColorVariantMediaHandler,
  GetSizeVariantMediaHandler,
  GetUnusedVariantMediaAssetsHandler,
  ValidateVariantMediaHandler,
  GetVariantMediaStatisticsHandler,
} from "../../../application";

export interface ProductCatalogRouteServices {
  productService: ProductManagementService;
  categoryService: CategoryManagementService;
  mediaService: MediaManagementService;
  variantService: VariantManagementService;
  productSearchService: ProductSearchService;
  productTagService: ProductTagManagementService;
  sizeGuideService: SizeGuideManagementService;
  editorialLookService: EditorialLookManagementService;
  productMediaService: ProductMediaManagementService;
  variantMediaService: VariantMediaManagementService;
}

export async function registerProductCatalogRoutes(
  fastify: FastifyInstance,
  services: ProductCatalogRouteServices,
): Promise<void> {
  const searchProductsHandler = new SearchProductsHandler(services.productSearchService);

  const productController = new ProductController(
    new CreateProductHandler(services.productService),
    new UpdateProductHandler(services.productService),
    new DeleteProductHandler(services.productService),
    new GetProductHandler(services.productService),
    new ListProductsHandler(services.productService),
    searchProductsHandler,
  );

  const categoryController = new CategoryController(
    new CreateCategoryHandler(services.categoryService),
    new UpdateCategoryHandler(services.categoryService),
    new DeleteCategoryHandler(services.categoryService),
    new ReorderCategoriesHandler(services.categoryService),
    new GetCategoryHandler(services.categoryService),
    new ListCategoriesHandler(services.categoryService),
    new GetCategoryHierarchyHandler(services.categoryService),
  );

  const variantController = new VariantController(
    new CreateProductVariantHandler(services.variantService),
    new UpdateProductVariantHandler(services.variantService),
    new DeleteProductVariantHandler(services.variantService),
    new ListVariantsHandler(services.variantService),
    new GetVariantHandler(services.variantService),
  );

  const mediaController = new MediaController(
    new CreateMediaAssetHandler(services.mediaService),
    new UpdateMediaAssetHandler(services.mediaService),
    new DeleteMediaAssetHandler(services.mediaService),
    new GetMediaAssetHandler(services.mediaService),
    new SearchMediaAssetsHandler(services.mediaService),
  );

  const productMediaController = new ProductMediaController(
    new AddMediaToProductHandler(services.productMediaService),
    new RemoveMediaFromProductHandler(services.productMediaService),
    new RemoveAllProductMediaHandler(services.productMediaService),
    new SetProductCoverImageHandler(services.productMediaService),
    new RemoveCoverImageHandler(services.productMediaService),
    new ReorderProductMediaHandler(services.productMediaService),
    new MoveMediaPositionHandler(services.productMediaService),
    new SetProductMediaHandler(services.productMediaService),
    new DuplicateProductMediaHandler(services.productMediaService),
    new CompactProductMediaPositionsHandler(services.productMediaService),
    new GetProductMediaHandler(services.productMediaService),
    new GetProductsUsingAssetHandler(services.productMediaService),
    new GetProductMediaAssetUsageCountHandler(services.productMediaService),
    new ValidateProductMediaHandler(services.productMediaService),
    new GetProductMediaStatisticsHandler(services.productMediaService),
  );

  const productTagController = new ProductTagController(
    new CreateProductTagHandler(services.productTagService),
    new UpdateProductTagHandler(services.productTagService),
    new DeleteProductTagHandler(services.productTagService),
    new CreateBulkProductTagsHandler(services.productTagService),
    new DeleteBulkProductTagsHandler(services.productTagService),
    new AssociateProductTagsHandler(services.productTagService),
    new RemoveProductTagAssociationHandler(services.productTagService),
    new ListProductTagsHandler(services.productTagService),
    new GetProductTagHandler(services.productTagService),
    new GetProductTagSuggestionsHandler(services.productTagService),
    new GetProductTagStatsHandler(services.productTagService),
    new GetMostUsedProductTagsHandler(services.productTagService),
    new ValidateProductTagHandler(services.productTagService),
    new GetProductTagsHandler(services.productTagService),
    new GetTagProductsHandler(services.productTagService),
  );

  const searchController = new SearchController(
    searchProductsHandler,
    new GetSearchSuggestionsHandler(services.productSearchService),
    new GetPopularSearchesHandler(services.productSearchService),
    new GetSearchFiltersHandler(services.productSearchService),
    new GetSearchStatsHandler(services.productSearchService),
  );

  const sizeGuideController = new SizeGuideController(
    new CreateSizeGuideHandler(services.sizeGuideService),
    new UpdateSizeGuideHandler(services.sizeGuideService),
    new DeleteSizeGuideHandler(services.sizeGuideService),
    new CreateRegionalSizeGuideHandler(services.sizeGuideService),
    new CreateCategorySizeGuideHandler(services.sizeGuideService),
    new UpdateSizeGuideContentHandler(services.sizeGuideService),
    new ClearSizeGuideContentHandler(services.sizeGuideService),
    new CreateBulkSizeGuidesHandler(services.sizeGuideService),
    new DeleteBulkSizeGuidesHandler(services.sizeGuideService),
    new ListSizeGuidesHandler(services.sizeGuideService),
    new GetSizeGuideHandler(services.sizeGuideService),
    new GetRegionalSizeGuidesHandler(services.sizeGuideService),
    new GetGeneralSizeGuidesHandler(services.sizeGuideService),
    new GetSizeGuideStatsHandler(services.sizeGuideService),
    new GetAvailableSizeGuideRegionsHandler(services.sizeGuideService),
    new GetAvailableSizeGuideCategoriesHandler(services.sizeGuideService),
    new ValidateSizeGuideUniquenessHandler(services.sizeGuideService),
  );

  const editorialLookController = new EditorialLookController(
    new CreateEditorialLookHandler(services.editorialLookService),
    new UpdateEditorialLookHandler(services.editorialLookService),
    new DeleteEditorialLookHandler(services.editorialLookService),
    new PublishEditorialLookHandler(services.editorialLookService),
    new UnpublishEditorialLookHandler(services.editorialLookService),
    new ScheduleEditorialLookPublicationHandler(services.editorialLookService),
    new ProcessScheduledEditorialLookPublicationsHandler(services.editorialLookService),
    new SetEditorialLookHeroImageHandler(services.editorialLookService),
    new RemoveEditorialLookHeroImageHandler(services.editorialLookService),
    new AddProductToEditorialLookHandler(services.editorialLookService),
    new RemoveProductFromEditorialLookHandler(services.editorialLookService),
    new SetEditorialLookProductsHandler(services.editorialLookService),
    new UpdateEditorialLookStoryContentHandler(services.editorialLookService),
    new ClearEditorialLookStoryContentHandler(services.editorialLookService),
    new CreateBulkEditorialLooksHandler(services.editorialLookService),
    new DeleteBulkEditorialLooksHandler(services.editorialLookService),
    new PublishBulkEditorialLooksHandler(services.editorialLookService),
    new DuplicateEditorialLookHandler(services.editorialLookService),
    new ListEditorialLooksHandler(services.editorialLookService),
    new GetEditorialLookHandler(services.editorialLookService),
    new GetReadyToPublishEditorialLooksHandler(services.editorialLookService),
    new GetEditorialLooksByHeroAssetHandler(services.editorialLookService),
    new GetEditorialLookProductsHandler(services.editorialLookService),
    new GetProductEditorialLooksHandler(services.editorialLookService),
    new GetEditorialLooksByProductHandler(services.editorialLookService),
    new GetEditorialLookStatsHandler(services.editorialLookService),
    new GetPopularEditorialLookProductsHandler(services.editorialLookService),
    new ValidateEditorialLookForPublicationHandler(services.editorialLookService),
  );

  const variantMediaController = new VariantMediaController(
    new AddMediaToVariantHandler(services.variantMediaService),
    new RemoveMediaFromVariantHandler(services.variantMediaService),
    new RemoveAllVariantMediaHandler(services.variantMediaService),
    new SetVariantMediaHandler(services.variantMediaService),
    new AddMediaToMultipleVariantsHandler(services.variantMediaService),
    new AddMultipleMediaToVariantHandler(services.variantMediaService),
    new DuplicateVariantMediaHandler(services.variantMediaService),
    new CopyProductVariantMediaHandler(services.variantMediaService),
    new GetVariantMediaHandler(services.variantMediaService),
    new GetProductVariantMediaHandler(services.variantMediaService),
    new GetVariantsUsingAssetHandler(services.variantMediaService),
    new GetVariantMediaAssetUsageCountHandler(services.variantMediaService),
    new GetColorVariantMediaHandler(services.variantMediaService),
    new GetSizeVariantMediaHandler(services.variantMediaService),
    new GetUnusedVariantMediaAssetsHandler(services.variantMediaService),
    new ValidateVariantMediaHandler(services.variantMediaService),
    new GetVariantMediaStatisticsHandler(services.variantMediaService),
  );

  await fastify.register(
    async (instance) => {
      await productRoutes(instance, productController);
      await categoryRoutes(instance, categoryController);
      await variantRoutes(instance, variantController);
      await productMediaRoutes(instance, productMediaController);
      await productTagRoutes(instance, productTagController);
      await searchRoutes(instance, searchController);
      await sizeGuideRoutes(instance, sizeGuideController);
      await editorialLookRoutes(instance, editorialLookController);
      await mediaRoutes(instance, mediaController);
      await variantMediaRoutes(instance, variantMediaController);
    },
    { prefix: "/api/v1" },
  );
}
