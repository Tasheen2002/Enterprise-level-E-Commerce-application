import { FastifyInstance } from "fastify";
import { registerProductRoutes } from "./product.routes";
import { registerCategoryRoutes } from "./category.routes";
import { registerVariantRoutes } from "./variant.routes";
import { registerMediaRoutes } from "./media.routes";
import { registerProductMediaRoutes } from "./product-media.routes";
import { registerProductTagRoutes } from "./product-tag.routes";
import { registerSearchRoutes } from "./search.routes";
import { registerSizeGuideRoutes } from "./size-guide.routes";
import { registerEditorialLookRoutes } from "./editorial-look.routes";
import { registerVariantMediaRoutes } from "./variant-media.routes";
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
import { PrismaClient } from "@prisma/client";
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
} from "../../../application/services";

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
  prisma: PrismaClient;
}

export async function registerProductCatalogRoutes(
  fastify: FastifyInstance,
  services: ProductCatalogRouteServices,
): Promise<void> {
  // Initialize controllers
  const productController = new ProductController(services.productService, services.productSearchService, services.prisma);
  const categoryController = new CategoryController(services.categoryService);
  const variantController = new VariantController(services.variantService);
  const mediaController = new MediaController(services.mediaService);
  const productMediaController = new ProductMediaController(services.productMediaService);
  const productTagController = new ProductTagController(services.productTagService);
  const searchController = new SearchController(services.productSearchService);
  const sizeGuideController = new SizeGuideController(services.sizeGuideService);
  const editorialLookController = new EditorialLookController(services.editorialLookService);
  const variantMediaController = new VariantMediaController(services.variantMediaService);

  await fastify.register(
    async (instance) => {
      // Public routes — mixed public/admin endpoints; each route's write operations
      // are individually gated via preHandler: [RolePermissions.ADMIN_ONLY]
      await registerProductRoutes(instance, productController);
      await registerCategoryRoutes(instance, categoryController);
      await registerVariantRoutes(instance, variantController);
      await registerProductMediaRoutes(instance, productMediaController);
      await registerProductTagRoutes(instance, productTagController);
      await registerSearchRoutes(instance, searchController);
      await registerSizeGuideRoutes(instance, sizeGuideController);
      await registerEditorialLookRoutes(instance, editorialLookController);

      // Protected routes — all endpoints require a valid JWT; role checks are
      // applied per-route via preHandler (STAFF_LEVEL or ADMIN_ONLY)
      await instance.register(async (protected_) => {
        protected_.addHook("onRequest", async (request) => {
          await fastify.authenticate(request);
        });

        await registerMediaRoutes(protected_, mediaController);
        await registerVariantMediaRoutes(protected_, variantMediaController);
      });
    },
    { prefix: "/api/v1" },
  );
}

