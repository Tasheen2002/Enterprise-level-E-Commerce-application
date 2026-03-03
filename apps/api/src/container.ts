import { PrismaClient } from "@prisma/client";

// User Management — Repositories
import { UserRepository } from "../../../modules/user-management/infra/persistence/repositories/user.repository";
import { UserProfileRepository } from "../../../modules/user-management/infra/persistence/repositories/user-profile.repository";
import { AddressRepository } from "../../../modules/user-management/infra/persistence/repositories/address.repository";
import { PaymentMethodRepository } from "../../../modules/user-management/infra/persistence/repositories/payment-method.repository";
import { VerificationTokenRepository } from "../../../modules/user-management/infra/persistence/repositories/verification-token.repository";
import { VerificationRateLimitRepository } from "../../../modules/user-management/infra/persistence/repositories/verification-rate-limit.repository";
import { VerificationAuditLogRepository } from "../../../modules/user-management/infra/persistence/repositories/verification-audit-log.repository";

// User Management — Services
import { AuthenticationService } from "../../../modules/user-management/application/services/authentication.service";
import { UserProfileService } from "../../../modules/user-management/application/services/user-profile.service";
import { AddressManagementService } from "../../../modules/user-management/application/services/address-management.service";
import { PaymentMethodService } from "../../../modules/user-management/application/services/payment-method.service";
import { PasswordHasherService } from "../../../modules/user-management/application/services/password-hasher.service";
import { VerificationService } from "../../../modules/user-management/application/services/verification.service";

// Product Catalog — Repositories
import {
  ProductRepository,
  ProductVariantRepository,
  CategoryRepository,
  MediaAssetRepository,
  ProductTagRepository,
  SizeGuideRepository,
  EditorialLookRepository,
  ProductMediaRepository,
} from "../../../modules/product-catalog/infra/persistence/repositories";

// Product Catalog — Services
import {
  ProductManagementService,
  CategoryManagementService,
  MediaManagementService,
  VariantManagementService,
  ProductSearchService,
  SlugGeneratorService,
  ProductTagManagementService,
  SizeGuideManagementService,
  EditorialLookManagementService,
  ProductMediaManagementService,
  VariantMediaManagementService,
} from "../../../modules/product-catalog/application/services";

// Inventory Management — Repositories
import {
  StockRepositoryImpl,
  LocationRepositoryImpl,
  SupplierRepositoryImpl,
  PurchaseOrderRepositoryImpl,
  PurchaseOrderItemRepositoryImpl,
  InventoryTransactionRepositoryImpl,
  StockAlertRepositoryImpl,
  PickupReservationRepositoryImpl,
} from "../../../modules/inventory-management/infra/persistence/repositories";

// Inventory Management — Services
import {
  StockManagementService,
  LocationManagementService,
  SupplierManagementService,
  PurchaseOrderManagementService,
  StockAlertService,
  PickupReservationService,
} from "../../../modules/inventory-management/application/services";

// Cart — Repositories
import {
  CartRepositoryImpl,
  ReservationRepositoryImpl,
  CheckoutRepositoryImpl,
} from "../../../modules/cart/infra/persistence/repositories";

// Cart — Services
import { CartManagementService } from "../../../modules/cart/application/services/cart-management.service";
import { ReservationService } from "../../../modules/cart/application/services/reservation.service";
import { CheckoutService } from "../../../modules/cart/application/services/checkout.service";
import { CheckoutOrderService } from "../../../modules/cart/application/services/checkout-order.service";

// Admin — Services (required by CartManagementService and CheckoutService)
import { SettingsService } from "../../../modules/admin/application/services/settings.service";

// Order Management — Repositories
import {
  OrderRepositoryImpl,
  OrderItemRepositoryImpl,
  OrderAddressRepositoryImpl,
  OrderShipmentRepositoryImpl,
  OrderStatusHistoryRepositoryImpl,
  OrderEventRepositoryImpl,
  BackorderRepositoryImpl,
  PreorderRepositoryImpl,
} from "../../../modules/order-management/infra/persistence/repositories";

// Order Management — Services
import { OrderManagementService } from "../../../modules/order-management/application/services/order-management.service";
import { OrderEventService } from "../../../modules/order-management/application/services/order-event.service";
import { OrderItemManagementService } from "../../../modules/order-management/application/services/order-item-management.service";
import { ShipmentManagementService } from "../../../modules/order-management/application/services/shipment-management.service";
import { BackorderManagementService } from "../../../modules/order-management/application/services/backorder-management.service";
import { PreorderManagementService } from "../../../modules/order-management/application/services/preorder-management.service";

// Payment & Loyalty — Repositories
import {
  PaymentIntentRepository,
  PaymentTransactionRepository,
  PaymentWebhookEventRepository,
  BnplTransactionRepository,
  GiftCardRepository,
  GiftCardTransactionRepository,
  PromotionRepository,
  PromotionUsageRepository,
  LoyaltyAccountRepository,
  LoyaltyProgramRepository,
  LoyaltyTransactionRepository,
} from "../../../modules/payment-loyalty/infra/persistence/repositories";

// Payment & Loyalty — Services
import {
  PaymentService,
  BnplTransactionService,
  GiftCardService,
  PromotionService,
  PaymentWebhookService,
  LoyaltyService,
  LoyaltyTransactionService,
} from "../../../modules/payment-loyalty/application/services";

/**
 * Dependency Injection Container
 * Centralises all module wiring — repositories → services → ready to hand to routes.
 */
export class Container {
  private static instance: Container;
  private services: Map<string, unknown> = new Map();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  register(
    prisma: PrismaClient,
    config: {
      jwtSecret: string;
      jwtExpiresIn: string;
    },
  ): void {
    // ============================================
    // User Management Module
    // ============================================

    // Repositories
    const userRepository = new UserRepository(prisma);
    const userProfileRepository = new UserProfileRepository(prisma);
    const addressRepository = new AddressRepository(prisma);
    const paymentMethodRepository = new PaymentMethodRepository(prisma);
    const verificationTokenRepository = new VerificationTokenRepository(prisma);
    const verificationRateLimitRepository = new VerificationRateLimitRepository(
      prisma,
    );
    const verificationAuditLogRepository = new VerificationAuditLogRepository(
      prisma,
    );

    // Shared services
    const passwordHasher = new PasswordHasherService();

    // Services
    const authService = new AuthenticationService(
      userRepository,
      passwordHasher,
      {
        accessTokenSecret: config.jwtSecret,
        refreshTokenSecret: config.jwtSecret,
        accessTokenExpiresIn: "15m",
        refreshTokenExpiresIn: config.jwtExpiresIn,
      },
    );

    const profileService = new UserProfileService(
      userRepository,
      userProfileRepository,
      addressRepository,
      paymentMethodRepository,
    );

    const addressService = new AddressManagementService(addressRepository);

    const paymentMethodService = new PaymentMethodService(
      paymentMethodRepository,
      userRepository,
      addressRepository,
    );

    const verificationService = new VerificationService(
      userRepository,
      verificationTokenRepository,
      verificationRateLimitRepository,
      verificationAuditLogRepository,
    );

    // Store User Management services
    this.services.set("authService", authService);
    this.services.set("profileService", profileService);
    this.services.set("addressService", addressService);
    this.services.set("paymentMethodService", paymentMethodService);
    this.services.set("verificationService", verificationService);
    this.services.set("prisma", prisma);

    // ============================================
    // Product Catalog Module
    // ============================================

    // Repositories
    const productRepository = new ProductRepository(prisma);
    const productVariantRepository = new ProductVariantRepository(prisma);
    const categoryRepository = new CategoryRepository(prisma);
    const mediaAssetRepository = new MediaAssetRepository(prisma);
    const productTagRepository = new ProductTagRepository(prisma);
    const sizeGuideRepository = new SizeGuideRepository(prisma);
    const editorialLookRepository = new EditorialLookRepository(prisma);
    const productMediaRepository = new ProductMediaRepository(prisma);

    // Services
    const slugGeneratorService = new SlugGeneratorService();

    const productManagementService = new ProductManagementService(
      productRepository,
    );

    const categoryManagementService = new CategoryManagementService(
      categoryRepository,
      slugGeneratorService,
    );

    const mediaManagementService = new MediaManagementService(
      mediaAssetRepository,
    );

    const variantManagementService = new VariantManagementService(
      productVariantRepository,
      productRepository,
    );

    const productSearchService = new ProductSearchService(
      productRepository,
      categoryRepository,
    );

    const productTagManagementService = new ProductTagManagementService(
      productTagRepository,
    );

    const sizeGuideManagementService = new SizeGuideManagementService(
      sizeGuideRepository,
    );

    const editorialLookManagementService = new EditorialLookManagementService(
      editorialLookRepository,
      mediaAssetRepository,
      productRepository,
    );

    const productMediaManagementService = new ProductMediaManagementService(
      productMediaRepository,
      mediaAssetRepository,
      productRepository,
    );

    // NOTE: VariantMediaManagementService requires a VariantMediaRepository
    // implementation (infra/persistence/repositories/variant-media.repository.impl.ts)
    // which is not yet created. Placeholder — wire once the impl exists.
    const variantMediaManagementService = new VariantMediaManagementService(
      productMediaRepository as any, // TODO: replace with VariantMediaRepositoryImpl once created
      mediaAssetRepository,
      productVariantRepository,
      productRepository,
    );

    // Store Product Catalog services
    this.services.set("productManagementService", productManagementService);
    this.services.set("categoryManagementService", categoryManagementService);
    this.services.set("mediaManagementService", mediaManagementService);
    this.services.set("variantManagementService", variantManagementService);
    this.services.set("productSearchService", productSearchService);
    this.services.set(
      "productTagManagementService",
      productTagManagementService,
    );
    this.services.set("sizeGuideManagementService", sizeGuideManagementService);
    this.services.set(
      "editorialLookManagementService",
      editorialLookManagementService,
    );
    this.services.set(
      "productMediaManagementService",
      productMediaManagementService,
    );
    this.services.set(
      "variantMediaManagementService",
      variantMediaManagementService,
    );

    // ============================================
    // Inventory Management Module
    // ============================================

    // Repositories
    const stockRepository = new StockRepositoryImpl(prisma);
    const locationRepository = new LocationRepositoryImpl(prisma);
    const supplierRepository = new SupplierRepositoryImpl(prisma);
    const purchaseOrderRepository = new PurchaseOrderRepositoryImpl(prisma);
    const purchaseOrderItemRepository = new PurchaseOrderItemRepositoryImpl(
      prisma,
    );
    const inventoryTransactionRepository =
      new InventoryTransactionRepositoryImpl(prisma);
    const stockAlertRepository = new StockAlertRepositoryImpl(prisma);
    const pickupReservationRepository = new PickupReservationRepositoryImpl(
      prisma,
    );

    // Services
    const stockManagementService = new StockManagementService(
      stockRepository,
      inventoryTransactionRepository,
    );
    const locationManagementService = new LocationManagementService(
      locationRepository,
    );
    const supplierManagementService = new SupplierManagementService(
      supplierRepository,
    );
    const purchaseOrderManagementService = new PurchaseOrderManagementService(
      purchaseOrderRepository,
      purchaseOrderItemRepository,
      stockManagementService,
    );
    const stockAlertService = new StockAlertService(
      stockAlertRepository,
      stockRepository,
    );
    const pickupReservationService = new PickupReservationService(
      pickupReservationRepository,
      stockManagementService,
    );

    // Store Inventory Management services
    this.services.set("stockManagementService", stockManagementService);
    this.services.set("locationManagementService", locationManagementService);
    this.services.set("supplierManagementService", supplierManagementService);
    this.services.set(
      "purchaseOrderManagementService",
      purchaseOrderManagementService,
    );
    this.services.set("stockAlertService", stockAlertService);
    this.services.set("pickupReservationService", pickupReservationService);

    // ============================================
    // Cart Module
    // ============================================

    // Repositories (ReservationRepositoryImpl optionally takes stockManagementService)
    const cartRepository = new CartRepositoryImpl(prisma);
    const reservationRepository = new ReservationRepositoryImpl(
      prisma,
      stockManagementService,
    );
    const checkoutRepository = new CheckoutRepositoryImpl(prisma);

    // Services
    const settingsService = new SettingsService();

    const cartManagementService = new CartManagementService(
      cartRepository,
      reservationRepository,
      checkoutRepository,
      productVariantRepository,
      productRepository,
      productMediaRepository,
      mediaAssetRepository,
      settingsService,
    );

    const reservationService = new ReservationService(
      reservationRepository,
      cartRepository,
    );

    const checkoutService = new CheckoutService(
      checkoutRepository,
      cartRepository,
      settingsService,
    );

    const checkoutOrderService = new CheckoutOrderService(
      prisma,
      checkoutRepository,
      cartRepository,
      reservationRepository,
      stockManagementService,
      productRepository,
      productVariantRepository,
    );

    // Store Cart services
    this.services.set("cartManagementService", cartManagementService);
    this.services.set("reservationService", reservationService);
    this.services.set("checkoutService", checkoutService);
    this.services.set("checkoutOrderService", checkoutOrderService);

    // ============================================
    // Order Management Module
    // ============================================

    // Repositories
    const orderRepository = new OrderRepositoryImpl(prisma);
    const orderItemRepository = new OrderItemRepositoryImpl(prisma);
    const orderAddressRepository = new OrderAddressRepositoryImpl(prisma);
    const orderShipmentRepository = new OrderShipmentRepositoryImpl(prisma);
    const orderStatusHistoryRepository = new OrderStatusHistoryRepositoryImpl(prisma);
    const orderEventRepository = new OrderEventRepositoryImpl(prisma);
    const backorderRepository = new BackorderRepositoryImpl(prisma);
    const preorderRepository = new PreorderRepositoryImpl(prisma);

    // Services
    const orderEventService = new OrderEventService(orderEventRepository);

    const orderManagementService = new OrderManagementService(
      orderRepository,
      orderAddressRepository,
      orderItemRepository,
      orderShipmentRepository,
      orderStatusHistoryRepository,
      variantManagementService,
      productManagementService,
      productMediaManagementService,
      stockManagementService,
      orderEventService,
    );

    const orderItemManagementService = new OrderItemManagementService(orderItemRepository);
    const shipmentManagementService = new ShipmentManagementService(orderShipmentRepository);
    const backorderManagementService = new BackorderManagementService(backorderRepository);
    const preorderManagementService = new PreorderManagementService(preorderRepository);

    // Store Order Management services
    this.services.set("orderManagementService", orderManagementService);
    this.services.set("orderEventService", orderEventService);
    this.services.set("orderItemManagementService", orderItemManagementService);
    this.services.set("shipmentManagementService", shipmentManagementService);
    this.services.set("backorderManagementService", backorderManagementService);
    this.services.set("preorderManagementService", preorderManagementService);

    // ============================================
    // Payment & Loyalty Module
    // ============================================

    // Repositories
    const paymentIntentRepository = new PaymentIntentRepository(prisma);
    const paymentTransactionRepository = new PaymentTransactionRepository(prisma);
    const paymentWebhookEventRepository = new PaymentWebhookEventRepository(prisma);
    const bnplTransactionRepository = new BnplTransactionRepository(prisma);
    const giftCardRepository = new GiftCardRepository(prisma);
    const giftCardTransactionRepository = new GiftCardTransactionRepository(prisma);
    const promotionRepository = new PromotionRepository(prisma);
    const promotionUsageRepository = new PromotionUsageRepository(prisma);
    const loyaltyAccountRepository = new LoyaltyAccountRepository(prisma);
    const loyaltyProgramRepository = new LoyaltyProgramRepository(prisma);
    const loyaltyTransactionRepository = new LoyaltyTransactionRepository(prisma);

    // Services
    const paymentService = new PaymentService(
      prisma,
      paymentIntentRepository,
      paymentTransactionRepository,
    );
    const bnplTransactionService = new BnplTransactionService(
      prisma,
      bnplTransactionRepository,
    );
    const giftCardService = new GiftCardService(
      prisma,
      giftCardRepository,
      giftCardTransactionRepository,
    );
    const promotionService = new PromotionService(
      prisma,
      promotionRepository,
      promotionUsageRepository,
    );
    const paymentWebhookService = new PaymentWebhookService(
      paymentWebhookEventRepository,
    );
    const loyaltyService = new LoyaltyService(
      prisma,
      loyaltyAccountRepository,
      loyaltyProgramRepository,
      loyaltyTransactionRepository,
    );
    const loyaltyTransactionService = new LoyaltyTransactionService(
      loyaltyTransactionRepository,
    );

    // Store Payment & Loyalty services
    this.services.set("paymentService", paymentService);
    this.services.set("bnplTransactionService", bnplTransactionService);
    this.services.set("giftCardService", giftCardService);
    this.services.set("promotionService", promotionService);
    this.services.set("paymentWebhookService", paymentWebhookService);
    this.services.set("loyaltyService", loyaltyService);
    this.services.set("loyaltyTransactionService", loyaltyTransactionService);
  }

  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service "${name}" not found in container`);
    }
    return service as T;
  }

  getUserManagementServices() {
    return {
      authService: this.get<AuthenticationService>("authService"),
      profileService: this.get<UserProfileService>("profileService"),
      addressService: this.get<AddressManagementService>("addressService"),
      paymentMethodService: this.get<PaymentMethodService>(
        "paymentMethodService",
      ),
      prisma: this.get<PrismaClient>("prisma"),
    };
  }

  getInventoryManagementServices() {
    return {
      stockService: this.get<StockManagementService>("stockManagementService"),
      locationService: this.get<LocationManagementService>(
        "locationManagementService",
      ),
      supplierService: this.get<SupplierManagementService>(
        "supplierManagementService",
      ),
      poService: this.get<PurchaseOrderManagementService>(
        "purchaseOrderManagementService",
      ),
      alertService: this.get<StockAlertService>("stockAlertService"),
      reservationService: this.get<PickupReservationService>(
        "pickupReservationService",
      ),
    };
  }

  getProductCatalogServices() {
    return {
      productService: this.get<ProductManagementService>(
        "productManagementService",
      ),
      productSearchService: this.get<ProductSearchService>(
        "productSearchService",
      ),
      categoryService: this.get<CategoryManagementService>(
        "categoryManagementService",
      ),
      variantService: this.get<VariantManagementService>(
        "variantManagementService",
      ),
      mediaService: this.get<MediaManagementService>("mediaManagementService"),
      productTagService: this.get<ProductTagManagementService>(
        "productTagManagementService",
      ),
      sizeGuideService: this.get<SizeGuideManagementService>(
        "sizeGuideManagementService",
      ),
      editorialLookService: this.get<EditorialLookManagementService>(
        "editorialLookManagementService",
      ),
      productMediaService: this.get<ProductMediaManagementService>(
        "productMediaManagementService",
      ),
      variantMediaService: this.get<VariantMediaManagementService>(
        "variantMediaManagementService",
      ),
      prisma: this.get<PrismaClient>("prisma"),
    };
  }

  getCartServices() {
    return {
      cartManagementService: this.get<CartManagementService>(
        "cartManagementService",
      ),
      reservationService: this.get<ReservationService>("reservationService"),
      checkoutService: this.get<CheckoutService>("checkoutService"),
      checkoutOrderService: this.get<CheckoutOrderService>(
        "checkoutOrderService",
      ),
    };
  }

  getOrderManagementServices() {
    return {
      orderService: this.get<OrderManagementService>("orderManagementService"),
      orderEventService: this.get<OrderEventService>("orderEventService"),
      preorderService: this.get<PreorderManagementService>("preorderManagementService"),
      backorderService: this.get<BackorderManagementService>("backorderManagementService"),
    };
  }

  getPaymentLoyaltyServices() {
    return {
      paymentService: this.get<PaymentService>("paymentService"),
      bnplService: this.get<BnplTransactionService>("bnplTransactionService"),
      giftCardService: this.get<GiftCardService>("giftCardService"),
      promotionService: this.get<PromotionService>("promotionService"),
      webhookService: this.get<PaymentWebhookService>("paymentWebhookService"),
      loyaltyService: this.get<LoyaltyService>("loyaltyService"),
      loyaltyTxnService: this.get<LoyaltyTransactionService>("loyaltyTransactionService"),
    };
  }
}

export const container = Container.getInstance();
