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

export interface ProductCatalogRouteServices {
  productController: ProductController;
  categoryController: CategoryController;
  variantController: VariantController;
  mediaController: MediaController;
  productMediaController: ProductMediaController;
  productTagController: ProductTagController;
  searchController: SearchController;
  sizeGuideController: SizeGuideController;
  editorialLookController: EditorialLookController;
  variantMediaController: VariantMediaController;
}

export async function registerProductCatalogRoutes(
  fastify: FastifyInstance,
  services: ProductCatalogRouteServices,
): Promise<void> {
  await fastify.register(
    async (instance) => {
      await productRoutes(instance, services.productController);
      await categoryRoutes(instance, services.categoryController);
      await variantRoutes(instance, services.variantController);
      await productMediaRoutes(instance, services.productMediaController);
      await productTagRoutes(instance, services.productTagController);
      await searchRoutes(instance, services.searchController);
      await sizeGuideRoutes(instance, services.sizeGuideController);
      await editorialLookRoutes(instance, services.editorialLookController);
      await mediaRoutes(instance, services.mediaController);
      await variantMediaRoutes(instance, services.variantMediaController);
    },
    { prefix: "/api/v1" },
  );
}
