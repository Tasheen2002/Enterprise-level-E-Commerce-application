import fp from "fastify-plugin";
import { container } from "./container";
import { registerUserManagementRoutes } from "../../../modules/user-management/infra/http/routes/index";
import { registerProductCatalogRoutes } from "../../../modules/product-catalog/infra/http/routes";
import { registerInventoryManagementRoutes } from "../../../modules/inventory-management/infra/http/routes";
import { registerCartModuleRoutes } from "../../../modules/cart/infra/http/routes";
import { registerOrderManagementRoutes } from "../../../modules/order-management/infra/http/routes";
import { registerPaymentLoyaltyRoutes } from "../../../modules/payment-loyalty/infra/http/routes";

export default fp(
  async (fastify) => {
    fastify.log.info("Registering modules...");

    // ============================================
    // User Management Module
    // ============================================
    const userManagementServices = container.getUserManagementServices();
    await registerUserManagementRoutes(
      fastify,
      userManagementServices,
      userManagementServices.prisma
    );
    fastify.log.info("✓ User Management module registered");

    // ============================================
    // Product Catalog Module
    // ============================================
    const productCatalogServices = container.getProductCatalogServices();
    await registerProductCatalogRoutes(fastify, productCatalogServices);
    fastify.log.info("✓ Product Catalog module registered");

    // ============================================
    // Inventory Management Module
    // ============================================
    const inventoryManagementServices =
      container.getInventoryManagementServices();
    await registerInventoryManagementRoutes(
      fastify,
      inventoryManagementServices,
    );
    fastify.log.info("✓ Inventory Management module registered");

    // ============================================
    // Cart Module
    // ============================================
    const cartServices = container.getCartServices();
    await registerCartModuleRoutes(fastify, cartServices);
    fastify.log.info("✓ Cart module registered");

    // ============================================
    // Order Management Module
    // ============================================
    const orderManagementServices = container.getOrderManagementServices();
    await registerOrderManagementRoutes(fastify, orderManagementServices);
    fastify.log.info("✓ Order Management module registered");

    // ============================================
    // Payment & Loyalty Module
    // ============================================
    const paymentLoyaltyServices = container.getPaymentLoyaltyServices();
    await registerPaymentLoyaltyRoutes(fastify, paymentLoyaltyServices);
    fastify.log.info("✓ Payment & Loyalty module registered");

    fastify.log.info("All modules registered successfully");
  },
  { name: "module-loader" },
);
