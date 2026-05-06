import fp from "fastify-plugin";
import { container } from "./container";
import { registerUserManagementRoutes } from "../../../modules/user-management/infra/http/routes/index";
import { registerProductCatalogRoutes } from "../../../modules/product-catalog/infra/http/routes";
import { registerInventoryManagementRoutes } from "../../../modules/inventory-management/infra/http/routes";
import { registerCartModuleRoutes } from "../../../modules/cart/infra/http/routes";
import { registerOrderManagementRoutes } from "../../../modules/order-management/infra/http/routes";
import { registerPaymentRoutes } from "../../../modules/payment/infra/http/routes";
import { registerLoyaltyRoutes } from "../../../modules/loyalty/infra/http/routes";
import { registerEngagementRoutes } from "../../../modules/engagement/infra/http/routes";

export default fp(
  async (fastify) => {
    fastify.log.info("Registering modules...");

    // ============================================
    // 1. User Management Module
    // ============================================
    const userManagementServices = container.getUserManagementServices();
    await registerUserManagementRoutes(
      fastify,
      userManagementServices,
    );
    fastify.log.info("✓ User Management module registered");

    // ============================================
    // 2. Product Catalog Module
    // ============================================
    const productCatalogServices = container.getProductCatalogServices();
    await registerProductCatalogRoutes(fastify, productCatalogServices);
    fastify.log.info("✓ Product Catalog module registered");

    // ============================================
    // 3. Inventory Management Module
    // ============================================
    const inventoryManagementServices = container.getInventoryManagementServices();
    await registerInventoryManagementRoutes(fastify, inventoryManagementServices);
    fastify.log.info("✓ Inventory Management module registered");

    // ============================================
    // 4. Cart Module
    // ============================================
    const cartServices = container.getCartServices();
    await registerCartModuleRoutes(fastify, cartServices);
    fastify.log.info("✓ Cart module registered");

    // ============================================
    // 5. Order Management Module
    // ============================================
    const orderManagementServices = container.getOrderManagementServices();
    await registerOrderManagementRoutes(fastify, orderManagementServices);
    fastify.log.info("✓ Order Management module registered");

    // ============================================
    // 6. Payment Module
    // ============================================
    const paymentServices = container.getPaymentServices();
    await registerPaymentRoutes(fastify, paymentServices);
    fastify.log.info("✓ Payment module registered");

    // ============================================
    // 7. Loyalty Module
    // ============================================
    const loyaltyServices = container.getLoyaltyServices();
    await registerLoyaltyRoutes(fastify, loyaltyServices);
    fastify.log.info("✓ Loyalty module registered");

    // ============================================
    // 8. Engagement Module
    // ============================================
    const engagementServices = container.getEngagementServices();
    await registerEngagementRoutes(fastify, engagementServices);
    fastify.log.info("✓ Engagement module registered");

    fastify.log.info("All 8 modules registered successfully");
  },
  { name: "module-loader" },
);
