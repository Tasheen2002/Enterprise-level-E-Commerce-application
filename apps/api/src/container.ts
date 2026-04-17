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
import { UserService } from "../../../modules/user-management/application/services/user.service";

// User Management — Handlers
import { RegisterUserHandler } from "../../../modules/user-management/application/commands/register-user.command";
import { LoginUserHandler } from "../../../modules/user-management/application/commands/login-user.command";
import { LogoutHandler } from "../../../modules/user-management/application/commands/logout.command";
import { RefreshTokenHandler } from "../../../modules/user-management/application/commands/refresh-token.command";
import { ChangePasswordHandler } from "../../../modules/user-management/application/commands/change-password.command";
import { ChangeEmailHandler } from "../../../modules/user-management/application/commands/change-email.command";
import { InitiatePasswordResetHandler } from "../../../modules/user-management/application/commands/initiate-password-reset.command";
import { ResetPasswordHandler } from "../../../modules/user-management/application/commands/reset-password.command";
import { VerifyEmailHandler } from "../../../modules/user-management/application/commands/verify-email.command";
import { DeleteAccountHandler } from "../../../modules/user-management/application/commands/delete-account.command";
import { UpdateProfileHandler } from "../../../modules/user-management/application/commands/update-profile.command";
import { AddAddressHandler } from "../../../modules/user-management/application/commands/add-address.command";
import { UpdateAddressHandler } from "../../../modules/user-management/application/commands/update-address.command";
import { DeleteAddressHandler } from "../../../modules/user-management/application/commands/delete-address.command";
import { AddPaymentMethodHandler } from "../../../modules/user-management/application/commands/add-payment-method.command";
import { UpdatePaymentMethodHandler } from "../../../modules/user-management/application/commands/update-payment-method.command";
import { DeletePaymentMethodHandler } from "../../../modules/user-management/application/commands/delete-payment-method.command";
import { SetDefaultPaymentMethodHandler } from "../../../modules/user-management/application/commands/set-default-payment-method.command";
import { UpdateUserStatusHandler } from "../../../modules/user-management/application/commands/update-user-status.command";
import { UpdateUserRoleHandler } from "../../../modules/user-management/application/commands/update-user-role.command";
import { DeleteUserHandler } from "../../../modules/user-management/application/commands/delete-user.command";
import { ToggleUserEmailVerifiedHandler } from "../../../modules/user-management/application/commands/toggle-user-email-verified.command";
import { GetUserProfileHandler } from "../../../modules/user-management/application/queries/get-user-profile.query";
import { GetUserByEmailHandler } from "../../../modules/user-management/application/queries/get-user-by-email.query";
import { GetUserDetailsHandler } from "../../../modules/user-management/application/queries/get-user-details.query";
import { ListAddressesHandler } from "../../../modules/user-management/application/queries/list-addresses.query";
import { ListPaymentMethodsHandler } from "../../../modules/user-management/application/queries/list-payment-methods.query";
import { ListUsersHandler } from "../../../modules/user-management/application/queries/list-user.query";

// User Management — Controllers
import { AuthController } from "../../../modules/user-management/infra/http/controllers/auth.controller";
import { ProfileController } from "../../../modules/user-management/infra/http/controllers/profile.controller";
import { AddressesController } from "../../../modules/user-management/infra/http/controllers/addresses.controller";
import { PaymentMethodsController } from "../../../modules/user-management/infra/http/controllers/payment-methods.controller";
import { UsersController } from "../../../modules/user-management/infra/http/controllers/users.controller";

// User Management — Token Blacklist
import { TokenBlacklistService } from "../../../modules/user-management/infra/http/security/token-blacklist";

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
  VariantMediaRepository,
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

// Product Catalog — Handlers
import {
  CreateProductHandler,
  UpdateProductHandler,
  DeleteProductHandler,
  GetProductHandler,
  ListProductsHandler,
  SearchProductsHandler,
  CreateCategoryHandler,
  UpdateCategoryHandler,
  DeleteCategoryHandler,
  ReorderCategoriesHandler,
  GetCategoryHandler,
  ListCategoriesHandler,
  GetCategoryHierarchyHandler,
  CreateProductVariantHandler,
  UpdateProductVariantHandler,
  DeleteProductVariantHandler,
  GetVariantHandler,
  ListVariantsHandler,
} from "../../../modules/product-catalog/application";

// Product Catalog — Controllers
import { ProductController } from "../../../modules/product-catalog/infra/http/controllers/product.controller";
import { CategoryController } from "../../../modules/product-catalog/infra/http/controllers/category.controller";
import { VariantController } from "../../../modules/product-catalog/infra/http/controllers/variant.controller";

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
import { CheckoutCompletionPortImpl } from "../../../modules/cart/infra/persistence/repositories/checkout-completion.port.impl";
import type {
  IProductSnapshotFactory,
  IExternalStockService,
  IExternalProductVariantRepository,
  IExternalProductRepository,
  IExternalProductMediaRepository,
  IExternalMediaAssetRepository,
} from "../../../modules/cart/domain/ports/external-services";

// Cart — Handlers
import {
  AddToCartHandler,
  UpdateCartItemHandler,
  RemoveFromCartHandler,
  ClearCartHandler,
  ClearUserCartHandler,
  ClearGuestCartHandler,
  CreateUserCartHandler,
  CreateGuestCartHandler,
  TransferCartHandler,
  UpdateCartEmailHandler,
  UpdateCartShippingInfoHandler,
  UpdateCartAddressesHandler,
  CleanupExpiredCartsHandler,
  CreateReservationHandler,
  ExtendReservationHandler,
  RenewReservationHandler,
  ReleaseReservationHandler,
  AdjustReservationHandler,
  CreateBulkReservationsHandler,
  ResolveReservationConflictsHandler,
  InitializeCheckoutHandler,
  CompleteCheckoutHandler,
  CancelCheckoutHandler,
  CompleteCheckoutWithOrderHandler,
  GetCartHandler,
  GetActiveCartByUserHandler,
  GetActiveCartByGuestTokenHandler,
  GetCartSummaryHandler,
  GetCartStatisticsHandler,
  GetReservationsHandler,
  GetReservationHandler,
  GetReservationByVariantHandler,
  GetVariantReservationsHandler,
  CheckAvailabilityHandler,
  GetReservedQuantityHandler,
  GetReservationStatisticsHandler,
  GetReservationsByStatusHandler,
  GetCheckoutHandler,
  GetOrderByCheckoutHandler,
} from "../../../modules/cart/application";

// Cart — Controllers
import { CartController } from "../../../modules/cart/infra/http/controllers/cart.controller";
import { ReservationController } from "../../../modules/cart/infra/http/controllers/reservation.controller";
import { CheckoutController } from "../../../modules/cart/infra/http/controllers/checkout.controller";

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

// Order Management — Value Objects (used by cart adapter)
import { ProductSnapshot } from "../../../modules/order-management/domain/value-objects/product-snapshot.vo";
import { OrderId } from "../../../modules/order-management/domain/value-objects/order-id.vo";

// Inventory Management — Value Objects (used by stock service adapter)
import { LocationType } from "../../../modules/inventory-management/domain/value-objects/location-type.vo";

// Order Management — External Ports
import {
  IExternalVariantService,
  IExternalProductService,
  IExternalProductMediaService,
  IExternalStockService as IOrderExternalStockService,
} from "../../../modules/order-management/domain/external-services";

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
} from "../../../modules/payment/infra/persistence/repositories";

// Payment & Loyalty — Services
import {
  PaymentService,
  BnplTransactionService,
  GiftCardService,
  PromotionService,
  PaymentWebhookService,
  LoyaltyService,
  LoyaltyTransactionService,
} from "../../../modules/payment/application/services";
import type { IExternalOrderQueryPort } from "../../../modules/payment/domain/external-services";

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

    const userService = new UserService(userRepository);

    // Store User Management services
    this.services.set("authService", authService);
    this.services.set("profileService", profileService);
    this.services.set("addressService", addressService);
    this.services.set("paymentMethodService", paymentMethodService);
    this.services.set("verificationService", verificationService);
    this.services.set("userRepository", userRepository);
    this.services.set("addressRepository", addressRepository);
    this.services.set("prisma", prisma);

    // Handlers
    const registerHandler = new RegisterUserHandler(authService);
    const loginHandler = new LoginUserHandler(authService);
    const logoutHandler = new LogoutHandler(TokenBlacklistService);
    const refreshTokenHandler = new RefreshTokenHandler(authService, TokenBlacklistService);
    const changePasswordHandler = new ChangePasswordHandler(authService);
    const changeEmailHandler = new ChangeEmailHandler(authService);
    const initiatePasswordResetHandler = new InitiatePasswordResetHandler(authService);
    const resetPasswordHandler = new ResetPasswordHandler(authService);
    const verifyEmailHandler = new VerifyEmailHandler(authService);
    const getUserByEmailHandler = new GetUserByEmailHandler(authService);
    const deleteAccountHandler = new DeleteAccountHandler(authService, userService, TokenBlacklistService);
    const getProfileHandler = new GetUserProfileHandler(profileService);
    const updateProfileHandler = new UpdateProfileHandler(profileService);
    const addAddressHandler = new AddAddressHandler(addressService);
    const updateAddressHandler = new UpdateAddressHandler(addressService);
    const deleteAddressHandler = new DeleteAddressHandler(addressService);
    const listAddressesHandler = new ListAddressesHandler(addressService);
    const addPaymentMethodHandler = new AddPaymentMethodHandler(paymentMethodService);
    const updatePaymentMethodHandler = new UpdatePaymentMethodHandler(paymentMethodService);
    const deletePaymentMethodHandler = new DeletePaymentMethodHandler(paymentMethodService);
    const setDefaultPaymentMethodHandler = new SetDefaultPaymentMethodHandler(paymentMethodService);
    const listPaymentMethodsHandler = new ListPaymentMethodsHandler(paymentMethodService);
    const getUserDetailsHandler = new GetUserDetailsHandler(userService);
    const listUsersHandler = new ListUsersHandler(userService);
    const updateUserStatusHandler = new UpdateUserStatusHandler(userService);
    const updateUserRoleHandler = new UpdateUserRoleHandler(userService);
    const deleteUserHandler = new DeleteUserHandler(userService);
    const toggleUserEmailVerifiedHandler = new ToggleUserEmailVerifiedHandler(userService);

    // Controllers
    const authController = new AuthController(
      registerHandler, loginHandler, logoutHandler, refreshTokenHandler,
      changePasswordHandler, changeEmailHandler, initiatePasswordResetHandler,
      resetPasswordHandler, verifyEmailHandler, getUserByEmailHandler,
      deleteAccountHandler, TokenBlacklistService,
    );
    const profileController = new ProfileController(getProfileHandler, updateProfileHandler);
    const addressesController = new AddressesController(addAddressHandler, updateAddressHandler, deleteAddressHandler, listAddressesHandler);
    const paymentMethodsController = new PaymentMethodsController(addPaymentMethodHandler, updatePaymentMethodHandler, deletePaymentMethodHandler, setDefaultPaymentMethodHandler, listPaymentMethodsHandler);
    const usersController = new UsersController(getUserDetailsHandler, listUsersHandler, updateUserStatusHandler, updateUserRoleHandler, deleteUserHandler, toggleUserEmailVerifiedHandler);

    // Store controllers
    this.services.set("authController", authController);
    this.services.set("profileController", profileController);
    this.services.set("addressesController", addressesController);
    this.services.set("paymentMethodsController", paymentMethodsController);
    this.services.set("usersController", usersController);

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
      productTagRepository,
    );

    const categoryManagementService = new CategoryManagementService(
      categoryRepository,
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

    const variantMediaRepository = new VariantMediaRepository(prisma);

    const variantMediaManagementService = new VariantMediaManagementService(
      variantMediaRepository,
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

    // Product Catalog — Handlers
    const createProductHandler = new CreateProductHandler(productManagementService);
    const updateProductHandler = new UpdateProductHandler(productManagementService);
    const deleteProductHandler = new DeleteProductHandler(productManagementService);
    const getProductHandler = new GetProductHandler(productManagementService);
    const listProductsHandler = new ListProductsHandler(productManagementService);
    const searchProductsHandler = new SearchProductsHandler(productSearchService);

    const createCategoryHandler = new CreateCategoryHandler(categoryManagementService);
    const updateCategoryHandler = new UpdateCategoryHandler(categoryManagementService);
    const deleteCategoryHandler = new DeleteCategoryHandler(categoryManagementService);
    const reorderCategoriesHandler = new ReorderCategoriesHandler(categoryManagementService);
    const getCategoryHandler = new GetCategoryHandler(categoryManagementService);
    const listCategoriesHandler = new ListCategoriesHandler(categoryManagementService);
    const getCategoryHierarchyHandler = new GetCategoryHierarchyHandler(categoryManagementService);

    const createVariantHandler = new CreateProductVariantHandler(variantManagementService);
    const updateVariantHandler = new UpdateProductVariantHandler(variantManagementService);
    const deleteVariantHandler = new DeleteProductVariantHandler(variantManagementService);
    const getVariantHandler = new GetVariantHandler(variantManagementService);
    const listVariantsHandler = new ListVariantsHandler(variantManagementService);

    // Product Catalog — Controllers
    const productController = new ProductController(
      createProductHandler,
      updateProductHandler,
      deleteProductHandler,
      getProductHandler,
      listProductsHandler,
      searchProductsHandler,
    );

    const categoryController = new CategoryController(
      createCategoryHandler,
      updateCategoryHandler,
      deleteCategoryHandler,
      reorderCategoriesHandler,
      getCategoryHandler,
      listCategoriesHandler,
      getCategoryHierarchyHandler,
    );

    const variantController = new VariantController(
      createVariantHandler,
      updateVariantHandler,
      deleteVariantHandler,
      listVariantsHandler,
      getVariantHandler,
    );

    this.services.set("productController", productController);
    this.services.set("categoryController", categoryController);
    this.services.set("variantController", variantController);

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

    // Repositories
    const cartRepository = new CartRepositoryImpl(prisma);
    const checkoutRepository = new CheckoutRepositoryImpl(prisma);

    const checkoutCompletionPort = new CheckoutCompletionPortImpl(prisma);

    // Port adapter: wraps stock service + adds warehouse lookup via location repository
    const stockServiceAdapter: IExternalStockService = {
      adjustStock: (...args) => stockManagementService.adjustStock(...args),
      getTotalAvailableStock: (variantId) =>
        stockManagementService.getTotalAvailableStock(variantId),
      async findWarehouseId() {
        const locations = await locationRepository.findByType(
          LocationType.WAREHOUSE,
        );
        return locations.length > 0
          ? locations[0].locationId.getValue()
          : null;
      },
    };

    const reservationRepository = new ReservationRepositoryImpl(
      prisma,
      stockServiceAdapter,
    );

    // Services
    const settingsService = new SettingsService();

    // Port adapters: wrap product-catalog repositories to satisfy cart external port interfaces
    const externalProductVariantRepository: IExternalProductVariantRepository = {
      findById: (variantId: { getValue(): string }) =>
        productVariantRepository.findById(variantId as any) as any,
    };

    const externalProductRepository: IExternalProductRepository = {
      findById: (productId: { getValue(): string }) =>
        productRepository.findById(productId as any) as any,
    };

    const externalProductMediaRepository: IExternalProductMediaRepository = {
      findByProductId: (productId: { getValue(): string }) =>
        productMediaRepository.findByProductId(productId as any).then((items) =>
          items.map((item) => ({
            getAssetId: () => item.mediaAssetId,
          })),
        ),
    };

    const externalMediaAssetRepository: IExternalMediaAssetRepository = {
      findById: (assetId: { getValue(): string }) =>
        mediaAssetRepository.findById(assetId as any).then((asset) =>
          asset
            ? {
                getStorageKey: () => asset.storageKey,
                getAltText: () => asset.altText,
              }
            : null,
        ),
    };

    const cartManagementService = new CartManagementService(
      cartRepository,
      reservationRepository,
      checkoutRepository,
      externalProductVariantRepository,
      externalProductRepository,
      externalProductMediaRepository,
      externalMediaAssetRepository,
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
      checkoutCompletionPort,
      checkoutRepository,
      cartRepository,
      reservationRepository,
      stockServiceAdapter,
      externalProductRepository,
      externalProductVariantRepository,
      {
        create: (data) => ProductSnapshot.create(data),
      } satisfies IProductSnapshotFactory,
      { defaultStockLocation: process.env.DEFAULT_STOCK_LOCATION },
    );

    // Cart — Controllers
    const cartController = new CartController(
      new AddToCartHandler(cartManagementService),
      new UpdateCartItemHandler(cartManagementService),
      new RemoveFromCartHandler(cartManagementService),
      new ClearCartHandler(cartManagementService),
      new ClearUserCartHandler(cartManagementService),
      new ClearGuestCartHandler(cartManagementService),
      new CreateUserCartHandler(cartManagementService),
      new CreateGuestCartHandler(cartManagementService),
      new TransferCartHandler(cartManagementService),
      new UpdateCartEmailHandler(cartManagementService),
      new UpdateCartShippingInfoHandler(cartManagementService),
      new UpdateCartAddressesHandler(cartManagementService),
      new CleanupExpiredCartsHandler(cartManagementService),
      new GetCartHandler(cartManagementService),
      new GetActiveCartByUserHandler(cartManagementService),
      new GetActiveCartByGuestTokenHandler(cartManagementService),
      new GetCartSummaryHandler(cartManagementService),
      new GetCartStatisticsHandler(cartManagementService),
    );

    const reservationController = new ReservationController(
      new CreateReservationHandler(reservationService),
      new ExtendReservationHandler(reservationService),
      new RenewReservationHandler(reservationService),
      new ReleaseReservationHandler(reservationService),
      new AdjustReservationHandler(reservationService),
      new CreateBulkReservationsHandler(reservationService),
      new ResolveReservationConflictsHandler(reservationService),
      new GetReservationsHandler(reservationService),
      new GetReservationHandler(reservationService),
      new GetReservationByVariantHandler(reservationService),
      new GetVariantReservationsHandler(reservationService),
      new CheckAvailabilityHandler(reservationService),
      new GetReservedQuantityHandler(reservationService),
      new GetReservationStatisticsHandler(reservationService),
      new GetReservationsByStatusHandler(reservationService),
    );

    const checkoutController = new CheckoutController(
      new InitializeCheckoutHandler(checkoutService),
      new CompleteCheckoutHandler(checkoutService),
      new CancelCheckoutHandler(checkoutService),
      new CompleteCheckoutWithOrderHandler(checkoutOrderService),
      new GetCheckoutHandler(checkoutService),
      new GetOrderByCheckoutHandler(checkoutOrderService),
    );

    // Store Cart services and controllers
    this.services.set("cartManagementService", cartManagementService);
    this.services.set("reservationService", reservationService);
    this.services.set("checkoutService", checkoutService);
    this.services.set("checkoutOrderService", checkoutOrderService);
    this.services.set("cartController", cartController);
    this.services.set("reservationController", reservationController);
    this.services.set("checkoutController", checkoutController);

    // ============================================
    // Order Management Module
    // ============================================

    // Repositories
    const orderRepository = new OrderRepositoryImpl(prisma);
    const orderItemRepository = new OrderItemRepositoryImpl(prisma);
    const orderAddressRepository = new OrderAddressRepositoryImpl(prisma);
    const orderShipmentRepository = new OrderShipmentRepositoryImpl(prisma);
    const orderStatusHistoryRepository = new OrderStatusHistoryRepositoryImpl(
      prisma,
    );
    const orderEventRepository = new OrderEventRepositoryImpl(prisma);
    const backorderRepository = new BackorderRepositoryImpl(prisma);
    const preorderRepository = new PreorderRepositoryImpl(prisma);

    // Services
    const orderEventService = new OrderEventService(orderEventRepository);

    const externalVariantService: IExternalVariantService = {
      getVariantById: async (variantId: string) => {
        try {
          const dto = await variantManagementService.getVariantById(variantId);
          return {
            getId: () => ({ getValue: () => dto.id }),
            getProductId: () => ({ getValue: () => dto.productId }),
            getSku: () => ({ getValue: () => dto.sku }),
            getSize: () => dto.size,
            getColor: () => dto.color,
            getWeightG: () => dto.weightG,
            getDims: () => dto.dims,
          };
        } catch {
          return null;
        }
      },
    };

    const externalProductService: IExternalProductService = {
      getProductById: async (productId: string) => {
        try {
          const dto = await productManagementService.getProductById(productId);
          return {
            getId: () => ({ getValue: () => dto.id }),
            getTitle: () => dto.title,
            getPrice: () => ({ getValue: () => dto.price }),
          };
        } catch {
          return null;
        }
      },
    };

    const externalProductMediaService: IExternalProductMediaService = {
      getProductMedia: async (productId: string, options?: { coverOnly?: boolean }) => {
        const summary = await productMediaManagementService.getProductMedia(productId, {
          coverOnly: options?.coverOnly,
        });
        return {
          mediaAssets: summary.mediaAssets.map((a) => ({
            isCover: a.isCover,
            storageKey: a.storageKey,
          })),
        };
      },
    };

    const externalStockService: IOrderExternalStockService = {
      getStock: async (variantId: string, locationId: string) => {
        const dto = await stockManagementService.getStock(variantId, locationId);
        if (!dto) return null;
        return {
          getStockLevel: () => ({ getAvailable: () => dto.available }),
        };
      },
      adjustStock: (...args) => stockManagementService.adjustStock(...args),
      reserveStock: (...args) => stockManagementService.reserveStock(...args),
    };

    const orderManagementService = new OrderManagementService(
      orderRepository,
      orderAddressRepository,
      orderItemRepository,
      orderShipmentRepository,
      orderStatusHistoryRepository,
      externalVariantService,
      externalProductService,
      externalProductMediaService,
      externalStockService,
      orderEventService,
    );

    const orderItemManagementService = new OrderItemManagementService(
      orderItemRepository,
    );
    const shipmentManagementService = new ShipmentManagementService(
      orderShipmentRepository,
    );
    const backorderManagementService = new BackorderManagementService(
      backorderRepository,
    );
    const preorderManagementService = new PreorderManagementService(
      preorderRepository,
    );

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
    const paymentTransactionRepository = new PaymentTransactionRepository(
      prisma,
    );
    const paymentWebhookEventRepository = new PaymentWebhookEventRepository(
      prisma,
    );
    const bnplTransactionRepository = new BnplTransactionRepository(prisma);
    const giftCardRepository = new GiftCardRepository(prisma);
    const giftCardTransactionRepository = new GiftCardTransactionRepository(
      prisma,
    );
    const promotionRepository = new PromotionRepository(prisma);
    const promotionUsageRepository = new PromotionUsageRepository(prisma);
    const loyaltyAccountRepository = new LoyaltyAccountRepository(prisma);
    const loyaltyProgramRepository = new LoyaltyProgramRepository(prisma);
    const loyaltyTransactionRepository = new LoyaltyTransactionRepository(
      prisma,
    );

    // Port adapter: cross-module Order ownership lookup via order-management repository
    const orderQueryPort: IExternalOrderQueryPort = {
      async findOrderOwner(orderId: string) {
        const order = await orderRepository.findById(
          OrderId.fromString(orderId),
        );
        return order ? { userId: order.getUserId() ?? null } : null;
      },
    };

    // Services
    const paymentService = new PaymentService(
      orderQueryPort,
      paymentIntentRepository,
      paymentTransactionRepository,
    );
    const bnplTransactionService = new BnplTransactionService(
      paymentIntentRepository,
      orderQueryPort,
      bnplTransactionRepository,
    );
    const giftCardService = new GiftCardService(
      orderQueryPort,
      giftCardRepository,
      giftCardTransactionRepository,
    );
    const promotionService = new PromotionService(
      promotionRepository,
      promotionUsageRepository,
    );
    const paymentWebhookService = new PaymentWebhookService(
      paymentWebhookEventRepository,
      {
        stripe: process.env.STRIPE_WEBHOOK_SECRET,
        paypal: process.env.PAYPAL_WEBHOOK_SECRET,
        razorpay: process.env.RAZORPAY_WEBHOOK_SECRET,
      },
    );
    const loyaltyService = new LoyaltyService(
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
      authController: this.get<AuthController>("authController"),
      profileController: this.get<ProfileController>("profileController"),
      addressesController: this.get<AddressesController>("addressesController"),
      paymentMethodsController: this.get<PaymentMethodsController>("paymentMethodsController"),
      usersController: this.get<UsersController>("usersController"),
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
      productController: this.get<ProductController>("productController"),
      categoryController: this.get<CategoryController>("categoryController"),
      variantController: this.get<VariantController>("variantController"),
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
    };
  }

  getCartServices() {
    return {
      cartController: this.get<CartController>("cartController"),
      reservationController: this.get<ReservationController>("reservationController"),
      checkoutController: this.get<CheckoutController>("checkoutController"),
    };
  }

  getOrderManagementServices() {
    return {
      orderService: this.get<OrderManagementService>("orderManagementService"),
      orderItemService: this.get<OrderItemManagementService>(
        "orderItemManagementService",
      ),
      shipmentService: this.get<ShipmentManagementService>(
        "shipmentManagementService",
      ),
      orderEventService: this.get<OrderEventService>("orderEventService"),
      preorderService: this.get<PreorderManagementService>(
        "preorderManagementService",
      ),
      backorderService: this.get<BackorderManagementService>(
        "backorderManagementService",
      ),
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
      loyaltyTxnService: this.get<LoyaltyTransactionService>(
        "loyaltyTransactionService",
      ),
    };
  }
}

export const container = Container.getInstance();
