import { PrismaClient } from "@prisma/client";
import { InMemoryEventBus } from "../../../packages/core/src/domain/events/in-memory-event-bus";

// ============================================================
// User Management — Imports
// ============================================================
import { UserRepository } from "../../../modules/user-management/infra/persistence/repositories/user.repository";
import { UserProfileRepository } from "../../../modules/user-management/infra/persistence/repositories/user-profile.repository";
import { AddressRepository } from "../../../modules/user-management/infra/persistence/repositories/address.repository";
import { PaymentMethodRepository } from "../../../modules/user-management/infra/persistence/repositories/payment-method.repository";
import { VerificationTokenRepository } from "../../../modules/user-management/infra/persistence/repositories/verification-token.repository";
import { VerificationRateLimitRepository } from "../../../modules/user-management/infra/persistence/repositories/verification-rate-limit.repository";
import { VerificationAuditLogRepository } from "../../../modules/user-management/infra/persistence/repositories/verification-audit-log.repository";
import { AuthenticationService } from "../../../modules/user-management/application/services/authentication.service";
import { UserProfileService } from "../../../modules/user-management/application/services/user-profile.service";
import { AddressManagementService } from "../../../modules/user-management/application/services/address-management.service";
import { PaymentMethodService } from "../../../modules/user-management/application/services/payment-method.service";
import { PasswordHasherService } from "../../../modules/user-management/application/services/password-hasher.service";
import { VerificationService } from "../../../modules/user-management/application/services/verification.service";
import { UserService } from "../../../modules/user-management/application/services/user.service";
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
import { ResendVerificationHandler } from "../../../modules/user-management/application/commands/resend-verification.command";
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
import { GetUserDetailsHandler } from "../../../modules/user-management/application/queries/get-user-details.query";
import { ListAddressesHandler } from "../../../modules/user-management/application/queries/list-addresses.query";
import { ListPaymentMethodsHandler } from "../../../modules/user-management/application/queries/list-payment-methods.query";
import { ListUsersHandler } from "../../../modules/user-management/application/queries/list-user.query";
import { AuthController } from "../../../modules/user-management/infra/http/controllers/auth.controller";
import { ProfileController } from "../../../modules/user-management/infra/http/controllers/profile.controller";
import { AddressesController } from "../../../modules/user-management/infra/http/controllers/addresses.controller";
import { PaymentMethodsController } from "../../../modules/user-management/infra/http/controllers/payment-methods.controller";
import { UsersController } from "../../../modules/user-management/infra/http/controllers/users.controller";
import { JwtService } from "../../../modules/user-management/infra/http/security/jwt.service";
import { TokenBlacklistService } from "../../../modules/user-management/infra/http/security/token-blacklist";

// ============================================================
// Product Catalog — Imports
// ============================================================
import {
  ProductRepositoryImpl,
  ProductVariantRepositoryImpl,
  CategoryRepositoryImpl,
  MediaAssetRepositoryImpl,
  ProductTagRepositoryImpl,
  ProductTagAssociationRepositoryImpl,
  SizeGuideRepositoryImpl,
  EditorialLookRepositoryImpl,
  ProductMediaRepositoryImpl,
  VariantMediaRepositoryImpl,
} from "../../../modules/product-catalog/infra/persistence/repositories";
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
  CreateMediaAssetHandler,
  UpdateMediaAssetHandler,
  DeleteMediaAssetHandler,
  GetMediaAssetHandler,
  SearchMediaAssetsHandler,
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
  GetProductMediaHandler,
  GetProductsUsingAssetHandler,
  GetProductMediaAssetUsageCountHandler,
  ValidateProductMediaHandler,
  GetProductMediaStatisticsHandler,
  CreateProductTagHandler,
  UpdateProductTagHandler,
  DeleteProductTagHandler,
  CreateBulkProductTagsHandler,
  DeleteBulkProductTagsHandler,
  AssociateProductTagsHandler,
  RemoveProductTagAssociationHandler,
  ListProductTagsHandler,
  GetProductTagHandler,
  GetProductTagSuggestionsHandler,
  GetProductTagStatsHandler,
  GetMostUsedProductTagsHandler,
  ValidateProductTagHandler,
  GetProductTagsHandler,
  GetTagProductsHandler,
  GetSearchSuggestionsHandler,
  GetPopularSearchesHandler,
  GetSearchFiltersHandler,
  GetSearchStatsHandler,
  CreateSizeGuideHandler,
  UpdateSizeGuideHandler,
  DeleteSizeGuideHandler,
  CreateRegionalSizeGuideHandler,
  CreateCategorySizeGuideHandler,
  UpdateSizeGuideContentHandler,
  ClearSizeGuideContentHandler,
  CreateBulkSizeGuidesHandler,
  DeleteBulkSizeGuidesHandler,
  ListSizeGuidesHandler,
  GetSizeGuideHandler,
  GetRegionalSizeGuidesHandler,
  GetGeneralSizeGuidesHandler,
  GetSizeGuideStatsHandler,
  GetAvailableSizeGuideRegionsHandler,
  GetAvailableSizeGuideCategoriesHandler,
  ValidateSizeGuideUniquenessHandler,
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
  AddMediaToVariantHandler,
  RemoveMediaFromVariantHandler,
  RemoveAllVariantMediaHandler,
  SetVariantMediaHandler,
  AddMediaToMultipleVariantsHandler,
  AddMultipleMediaToVariantHandler,
  DuplicateVariantMediaHandler,
  CopyProductVariantMediaHandler,
  GetVariantMediaHandler,
  GetProductVariantMediaHandler,
  GetVariantsUsingAssetHandler,
  GetVariantMediaAssetUsageCountHandler,
  GetColorVariantMediaHandler,
  GetSizeVariantMediaHandler,
  GetUnusedVariantMediaAssetsHandler,
  ValidateVariantMediaHandler,
  GetVariantMediaStatisticsHandler,
} from "../../../modules/product-catalog/application";
import { ProductController } from "../../../modules/product-catalog/infra/http/controllers/product.controller";
import { CategoryController } from "../../../modules/product-catalog/infra/http/controllers/category.controller";
import { VariantController } from "../../../modules/product-catalog/infra/http/controllers/variant.controller";
import { MediaController } from "../../../modules/product-catalog/infra/http/controllers/media.controller";
import { ProductMediaController } from "../../../modules/product-catalog/infra/http/controllers/product-media.controller";
import { ProductTagController } from "../../../modules/product-catalog/infra/http/controllers/product-tag.controller";
import { SearchController } from "../../../modules/product-catalog/infra/http/controllers/search.controller";
import { SizeGuideController } from "../../../modules/product-catalog/infra/http/controllers/size-guide.controller";
import { EditorialLookController } from "../../../modules/product-catalog/infra/http/controllers/editorial-look.controller";
import { VariantMediaController } from "../../../modules/product-catalog/infra/http/controllers/variant-media.controller";

// ============================================================
// Inventory Management — Imports
// ============================================================
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
import {
  StockManagementService,
  LocationManagementService,
  SupplierManagementService,
  PurchaseOrderManagementService,
  StockAlertService,
  PickupReservationService,
} from "../../../modules/inventory-management/application/services";
import {
  StockController,
  LocationController,
  SupplierController,
  PurchaseOrderController,
  PurchaseOrderItemController,
  StockAlertController,
  PickupReservationController,
  InventoryTransactionController,
} from "../../../modules/inventory-management/infra/http/controllers";
import {
  AddStockHandler,
  AdjustStockHandler,
  TransferStockHandler,
  ReserveStockHandler,
  FulfillReservationHandler,
  SetStockThresholdsHandler,
  GetStockHandler,
  GetStockByVariantHandler,
  GetStockStatsHandler,
  GetTotalAvailableStockHandler,
  ListStocksHandler,
  GetLowStockItemsHandler,
  GetOutOfStockItemsHandler,
  CreateLocationHandler,
  UpdateLocationHandler,
  DeleteLocationHandler,
  GetLocationHandler,
  ListLocationsHandler,
  CreateSupplierHandler,
  UpdateSupplierHandler,
  DeleteSupplierHandler,
  GetSupplierHandler,
  ListSuppliersHandler,
  CreatePurchaseOrderHandler,
  CreatePurchaseOrderWithItemsHandler,
  AddPOItemHandler,
  UpdatePOItemHandler,
  RemovePOItemHandler,
  UpdatePOStatusHandler,
  UpdatePOEtaHandler,
  ReceivePOItemsHandler,
  DeletePurchaseOrderHandler,
  GetPurchaseOrderHandler,
  GetPOItemsHandler,
  ListPurchaseOrdersHandler,
  GetOverduePurchaseOrdersHandler,
  GetPendingReceivalHandler,
  CreateStockAlertHandler,
  ResolveStockAlertHandler,
  DeleteStockAlertHandler,
  GetStockAlertHandler,
  GetActiveAlertsHandler,
  ListStockAlertsHandler,
  CreatePickupReservationHandler,
  CancelPickupReservationHandler,
  GetPickupReservationHandler,
  ListPickupReservationsHandler,
  GetTransactionHandler,
  ListTransactionsHandler,
  GetTransactionsByVariantHandler,
} from "../../../modules/inventory-management/application";
import { LocationType } from "../../../modules/inventory-management/domain/value-objects/location-type.vo";

// ============================================================
// Cart — Imports
// ============================================================
import {
  CartRepositoryImpl,
  ReservationRepositoryImpl,
  CheckoutRepositoryImpl,
} from "../../../modules/cart/infra/persistence/repositories";
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
import { CartController } from "../../../modules/cart/infra/http/controllers/cart.controller";
import { ReservationController } from "../../../modules/cart/infra/http/controllers/reservation.controller";
import { CheckoutController } from "../../../modules/cart/infra/http/controllers/checkout.controller";

// ============================================================
// Admin — Imports (SettingsService used by Cart)
// ============================================================
import { SettingsService } from "../../../modules/admin/application/services/settings.service";

// ============================================================
// Order Management — Imports
// ============================================================
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
import { OrderManagementService } from "../../../modules/order-management/application/services/order-management.service";
import { OrderEventService } from "../../../modules/order-management/application/services/order-event.service";
import { OrderItemManagementService } from "../../../modules/order-management/application/services/order-item-management.service";
import { ShipmentManagementService } from "../../../modules/order-management/application/services/shipment-management.service";
import { BackorderManagementService } from "../../../modules/order-management/application/services/backorder-management.service";
import { PreorderManagementService } from "../../../modules/order-management/application/services/preorder-management.service";
import {
  IExternalVariantService,
  IExternalProductService,
  IExternalStockService as IOrderExternalStockService,
} from "../../../modules/order-management/domain/external-services";
import { ProductSnapshot } from "../../../modules/order-management/domain/value-objects/product-snapshot.vo";
import { OrderId } from "../../../modules/order-management/domain/value-objects/order-id.vo";
import {
  OrderController,
  OrderAddressController,
  OrderItemController,
  OrderShipmentController,
  OrderStatusHistoryController,
  OrderEventController,
  PreorderController,
  BackorderController,
} from "../../../modules/order-management/infra/http/controllers";
import {
  CreateOrderHandler,
  UpdateOrderStatusHandler,
  UpdateOrderTotalsHandler,
  MarkOrderPaidHandler,
  MarkOrderFulfilledHandler,
  CancelOrderHandler,
  DeleteOrderHandler,
  GetOrderHandler,
  ListOrdersHandler,
  TrackOrderHandler,
  SetOrderAddressesHandler,
  UpdateBillingAddressHandler,
  UpdateShippingAddressHandler,
  GetOrderAddressHandler,
  AddOrderItemHandler,
  UpdateOrderItemHandler,
  RemoveOrderItemHandler,
  ListOrderItemsHandler,
  GetOrderItemHandler,
  CreateShipmentHandler,
  UpdateShipmentTrackingHandler,
  MarkShipmentShippedHandler,
  MarkShipmentDeliveredHandler,
  ListOrderShipmentsHandler,
  GetShipmentHandler,
  LogOrderStatusChangeHandler,
  GetOrderStatusHistoryHandler,
  LogOrderEventHandler,
  ListOrderEventsHandler,
  GetOrderEventHandler,
  CreatePreorderHandler,
  UpdatePreorderReleaseDateHandler,
  MarkPreorderNotifiedHandler,
  DeletePreorderHandler,
  GetPreorderHandler,
  ListPreordersHandler,
  CreateBackorderHandler,
  UpdateBackorderEtaHandler,
  MarkBackorderNotifiedHandler,
  DeleteBackorderHandler,
  GetBackorderHandler,
  ListBackordersHandler,
} from "../../../modules/order-management/application";

// ============================================================
// Payment — Imports
// ============================================================
import {
  PaymentIntentRepositoryImpl,
  PaymentTransactionRepositoryImpl,
  PaymentWebhookEventRepositoryImpl,
  BnplTransactionRepositoryImpl,
  GiftCardRepositoryImpl,
  GiftCardTransactionRepositoryImpl,
  PromotionRepositoryImpl,
  PromotionUsageRepositoryImpl,
} from "../../../modules/payment/infra/persistence/repositories";
import {
  PaymentService,
  BnplTransactionService,
  GiftCardService,
  PromotionService,
  PaymentWebhookService,
} from "../../../modules/payment/application/services";
import {
  CreatePaymentIntentHandler,
  ProcessPaymentHandler,
  RefundPaymentHandler,
  VoidPaymentHandler,
  CreateBnplTransactionHandler,
  ProcessBnplPaymentHandler,
  CreateGiftCardHandler,
  RedeemGiftCardHandler,
  CreatePromotionHandler,
  ApplyPromotionHandler,
  RecordPromotionUsageHandler,
  ProcessWebhookEventHandler,
} from "../../../modules/payment/application/commands";
import {
  GetPaymentIntentHandler,
  GetPaymentTransactionsHandler,
  GetBnplTransactionsHandler,
  GetGiftCardBalanceHandler,
  GetGiftCardTransactionsHandler,
  GetActivePromotionsHandler,
  GetPromotionUsageHandler,
  GetWebhookEventsHandler,
} from "../../../modules/payment/application/queries";
import {
  PaymentIntentController,
  PaymentWebhookController,
  BnplTransactionController,
  GiftCardController,
  PromotionController,
  StripeWebhookController,
} from "../../../modules/payment/infra/http/controllers";
import { isStripeConfigured } from "../../../modules/payment/infra/config/stripe.config";
import type { IExternalOrderQueryPort } from "../../../modules/payment/domain/external-services";

// ============================================================
// Loyalty — Imports
// ============================================================
import {
  LoyaltyAccountRepositoryImpl,
  LoyaltyProgramRepositoryImpl,
  LoyaltyTransactionRepositoryImpl,
} from "../../../modules/loyalty/infra/persistence/repositories";
import { LoyaltyService } from "../../../modules/loyalty/application/services/loyalty.service";
import { LoyaltyProgramService } from "../../../modules/loyalty/application/services/loyalty-program.service";
import {
  CreateLoyaltyProgramHandler,
  AwardLoyaltyPointsHandler,
  RedeemLoyaltyPointsHandler,
  AdjustLoyaltyPointsHandler,
} from "../../../modules/loyalty/application/commands";
import {
  GetLoyaltyProgramsHandler,
  GetLoyaltyAccountHandler,
  GetLoyaltyTransactionsHandler,
} from "../../../modules/loyalty/application/queries";
import { LoyaltyController } from "../../../modules/loyalty/infra/http/controllers/loyalty.controller";

// ============================================================
// Engagement — Imports
// ============================================================
import {
  WishlistController,
  ReminderController,
  NotificationController,
  AppointmentController,
  ProductReviewController,
  NewsletterController,
} from "../../../modules/engagement/infra/http/controllers";
import {
  CreateWishlistHandler,
  AddToWishlistHandler,
  RemoveFromWishlistHandler,
  UpdateWishlistHandler,
  DeleteWishlistHandler,
  GetWishlistHandler,
  GetUserWishlistsHandler,
  GetPublicWishlistsHandler,
  GetWishlistItemsHandler,
  CreateReminderHandler,
  MarkReminderAsSentHandler,
  UnsubscribeReminderHandler,
  DeleteReminderHandler,
  GetReminderHandler,
  GetUserRemindersHandler,
  GetVariantRemindersHandler,
  ScheduleNotificationHandler,
  SendNotificationHandler,
  GetNotificationHandler,
  GetNotificationsByTypeHandler,
  CreateAppointmentHandler,
  UpdateAppointmentHandler,
  CancelAppointmentHandler,
  GetAppointmentHandler,
  GetUserAppointmentsHandler,
  GetLocationAppointmentsHandler,
  CreateProductReviewHandler,
  UpdateReviewStatusHandler,
  DeleteProductReviewHandler,
  GetProductReviewHandler,
  GetProductReviewsHandler,
  GetUserReviewsHandler,
  SubscribeNewsletterHandler,
  UnsubscribeNewsletterHandler,
  GetNewsletterSubscriptionHandler,
} from "../../../modules/engagement/application";
import { WishlistRepositoryImpl } from "../../../modules/engagement/infra/persistence/repositories/wishlist.repository.impl";
import { WishlistItemRepositoryImpl } from "../../../modules/engagement/infra/persistence/repositories/wishlist-item.repository.impl";
import { ReminderRepositoryImpl } from "../../../modules/engagement/infra/persistence/repositories/reminder.repository.impl";
import { NotificationRepositoryImpl } from "../../../modules/engagement/infra/persistence/repositories/notification.repository.impl";
import { AppointmentRepositoryImpl } from "../../../modules/engagement/infra/persistence/repositories/appointment.repository.impl";
import { ProductReviewRepositoryImpl } from "../../../modules/engagement/infra/persistence/repositories/product-review.repository.impl";
import { NewsletterSubscriptionRepositoryImpl } from "../../../modules/engagement/infra/persistence/repositories/newsletter-subscription.repository.impl";
import { WishlistManagementService } from "../../../modules/engagement/application/services/wishlist-management.service";
import { ReminderManagementService } from "../../../modules/engagement/application/services/reminder-management.service";
import { NotificationService } from "../../../modules/engagement/application/services/notification.service";
import { AppointmentService } from "../../../modules/engagement/application/services/appointment.service";
import { ProductReviewService } from "../../../modules/engagement/application/services/product-review.service";
import { NewsletterService } from "../../../modules/engagement/application/services/newsletter.service";

/**
 * Dependency Injection Container
 * Centralises all module wiring — repositories → services → handlers → controllers.
 * Modules are registered in dependency order:
 *   User Management → Product Catalog → Inventory Management →
 *   Cart → Order Management → Payment → Loyalty → Engagement
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

    // ============================================================
    // Shared Infrastructure — Event Bus
    // ============================================================

    const eventBus = new InMemoryEventBus();

    // ============================================================
    // User Management Module
    // ============================================================

    const userRepository = new UserRepository(prisma, eventBus);
    const userProfileRepository = new UserProfileRepository(prisma);
    const addressRepository = new AddressRepository(prisma, eventBus);
    const paymentMethodRepository = new PaymentMethodRepository(prisma, eventBus);
    const verificationTokenRepository = new VerificationTokenRepository(prisma, eventBus);
    const verificationRateLimitRepository = new VerificationRateLimitRepository(prisma, eventBus);
    const verificationAuditLogRepository = new VerificationAuditLogRepository(prisma, eventBus);

    const passwordHasher = new PasswordHasherService();
    const jwtService = new JwtService({
      accessTokenSecret: config.jwtSecret,
      refreshTokenSecret: config.jwtSecret,
      accessTokenExpiresIn: "15m",
      refreshTokenExpiresIn: config.jwtExpiresIn,
    });
    const authService = new AuthenticationService(userRepository, passwordHasher, jwtService);
    const profileService = new UserProfileService(userRepository, userProfileRepository, addressRepository, paymentMethodRepository);
    const addressService = new AddressManagementService(addressRepository);
    const paymentMethodService = new PaymentMethodService(paymentMethodRepository, userRepository, addressRepository);
    const verificationService = new VerificationService(userRepository, verificationTokenRepository, verificationRateLimitRepository, verificationAuditLogRepository);
    const userService = new UserService(userRepository);

    const authController = new AuthController(
      new RegisterUserHandler(authService),
      new LoginUserHandler(authService, TokenBlacklistService),
      new LogoutHandler(authService, TokenBlacklistService),
      new RefreshTokenHandler(authService, TokenBlacklistService),
      new ChangePasswordHandler(authService),
      new ChangeEmailHandler(authService),
      new InitiatePasswordResetHandler(authService, TokenBlacklistService),
      new ResetPasswordHandler(authService, TokenBlacklistService),
      new VerifyEmailHandler(authService, TokenBlacklistService),
      new DeleteAccountHandler(authService, TokenBlacklistService),
      new ResendVerificationHandler(authService, TokenBlacklistService),
    );
    const profileController = new ProfileController(
      new GetUserProfileHandler(profileService),
      new UpdateProfileHandler(profileService),
    );
    const addressesController = new AddressesController(
      new AddAddressHandler(addressService),
      new UpdateAddressHandler(addressService),
      new DeleteAddressHandler(addressService),
      new ListAddressesHandler(addressService),
    );
    const paymentMethodsController = new PaymentMethodsController(
      new AddPaymentMethodHandler(paymentMethodService),
      new UpdatePaymentMethodHandler(paymentMethodService),
      new DeletePaymentMethodHandler(paymentMethodService),
      new SetDefaultPaymentMethodHandler(paymentMethodService),
      new ListPaymentMethodsHandler(paymentMethodService),
    );
    const usersController = new UsersController(
      new GetUserDetailsHandler(userService),
      new ListUsersHandler(userService),
      new UpdateUserStatusHandler(userService),
      new UpdateUserRoleHandler(userService),
      new DeleteUserHandler(userService),
      new ToggleUserEmailVerifiedHandler(userService),
    );

    this.services.set("eventBus", eventBus);
    this.services.set("prisma", prisma);
    this.services.set("userRepository", userRepository);
    this.services.set("addressRepository", addressRepository);
    this.services.set("authService", authService);
    this.services.set("profileService", profileService);
    this.services.set("addressService", addressService);
    this.services.set("paymentMethodService", paymentMethodService);
    this.services.set("verificationService", verificationService);
    this.services.set("authController", authController);
    this.services.set("profileController", profileController);
    this.services.set("addressesController", addressesController);
    this.services.set("paymentMethodsController", paymentMethodsController);
    this.services.set("usersController", usersController);

    // ============================================================
    // Product Catalog Module
    // ============================================================

    const productRepository = new ProductRepositoryImpl(prisma, eventBus);
    const productVariantRepository = new ProductVariantRepositoryImpl(prisma, eventBus);
    const categoryRepository = new CategoryRepositoryImpl(prisma, eventBus);
    const mediaAssetRepository = new MediaAssetRepositoryImpl(prisma, eventBus);
    const productTagRepository = new ProductTagRepositoryImpl(prisma, eventBus);
    const productTagAssociationRepository = new ProductTagAssociationRepositoryImpl(prisma);
    const sizeGuideRepository = new SizeGuideRepositoryImpl(prisma, eventBus);
    const editorialLookRepository = new EditorialLookRepositoryImpl(prisma, eventBus);
    const productMediaRepository = new ProductMediaRepositoryImpl(prisma);
    const variantMediaRepository = new VariantMediaRepositoryImpl(prisma);

    const slugGeneratorService = new SlugGeneratorService();
    const productManagementService = new ProductManagementService(productRepository, productTagRepository);
    const categoryManagementService = new CategoryManagementService(categoryRepository);
    const mediaManagementService = new MediaManagementService(mediaAssetRepository);
    const variantManagementService = new VariantManagementService(productVariantRepository, productRepository);
    const productSearchService = new ProductSearchService(productRepository, categoryRepository);
    const productTagManagementService = new ProductTagManagementService(productTagRepository, productTagAssociationRepository);
    const sizeGuideManagementService = new SizeGuideManagementService(sizeGuideRepository);
    const editorialLookManagementService = new EditorialLookManagementService(editorialLookRepository, mediaAssetRepository, productRepository);
    const productMediaManagementService = new ProductMediaManagementService(productMediaRepository, mediaAssetRepository, productRepository);
    const variantMediaManagementService = new VariantMediaManagementService(variantMediaRepository, mediaAssetRepository, productVariantRepository, productRepository);

    const productController = new ProductController(
      new CreateProductHandler(productManagementService),
      new UpdateProductHandler(productManagementService),
      new DeleteProductHandler(productManagementService),
      new GetProductHandler(productManagementService),
      new ListProductsHandler(productManagementService),
      new SearchProductsHandler(productSearchService),
    );
    const categoryController = new CategoryController(
      new CreateCategoryHandler(categoryManagementService),
      new UpdateCategoryHandler(categoryManagementService),
      new DeleteCategoryHandler(categoryManagementService),
      new ReorderCategoriesHandler(categoryManagementService),
      new GetCategoryHandler(categoryManagementService),
      new ListCategoriesHandler(categoryManagementService),
      new GetCategoryHierarchyHandler(categoryManagementService),
    );
    const variantController = new VariantController(
      new CreateProductVariantHandler(variantManagementService),
      new UpdateProductVariantHandler(variantManagementService),
      new DeleteProductVariantHandler(variantManagementService),
      new ListVariantsHandler(variantManagementService),
      new GetVariantHandler(variantManagementService),
    );
    const mediaController = new MediaController(
      new CreateMediaAssetHandler(mediaManagementService),
      new UpdateMediaAssetHandler(mediaManagementService),
      new DeleteMediaAssetHandler(mediaManagementService),
      new GetMediaAssetHandler(mediaManagementService),
      new SearchMediaAssetsHandler(mediaManagementService),
    );
    const productMediaController = new ProductMediaController(
      new AddMediaToProductHandler(productMediaManagementService),
      new RemoveMediaFromProductHandler(productMediaManagementService),
      new RemoveAllProductMediaHandler(productMediaManagementService),
      new SetProductCoverImageHandler(productMediaManagementService),
      new RemoveCoverImageHandler(productMediaManagementService),
      new ReorderProductMediaHandler(productMediaManagementService),
      new MoveMediaPositionHandler(productMediaManagementService),
      new SetProductMediaHandler(productMediaManagementService),
      new DuplicateProductMediaHandler(productMediaManagementService),
      new CompactProductMediaPositionsHandler(productMediaManagementService),
      new GetProductMediaHandler(productMediaManagementService),
      new GetProductsUsingAssetHandler(productMediaManagementService),
      new GetProductMediaAssetUsageCountHandler(productMediaManagementService),
      new ValidateProductMediaHandler(productMediaManagementService),
      new GetProductMediaStatisticsHandler(productMediaManagementService),
    );
    const productTagController = new ProductTagController(
      new CreateProductTagHandler(productTagManagementService),
      new UpdateProductTagHandler(productTagManagementService),
      new DeleteProductTagHandler(productTagManagementService),
      new CreateBulkProductTagsHandler(productTagManagementService),
      new DeleteBulkProductTagsHandler(productTagManagementService),
      new AssociateProductTagsHandler(productTagManagementService),
      new RemoveProductTagAssociationHandler(productTagManagementService),
      new ListProductTagsHandler(productTagManagementService),
      new GetProductTagHandler(productTagManagementService),
      new GetProductTagSuggestionsHandler(productTagManagementService),
      new GetProductTagStatsHandler(productTagManagementService),
      new GetMostUsedProductTagsHandler(productTagManagementService),
      new ValidateProductTagHandler(productTagManagementService),
      new GetProductTagsHandler(productTagManagementService),
      new GetTagProductsHandler(productTagManagementService),
    );
    const searchController = new SearchController(
      new SearchProductsHandler(productSearchService),
      new GetSearchSuggestionsHandler(productSearchService),
      new GetPopularSearchesHandler(productSearchService),
      new GetSearchFiltersHandler(productSearchService),
      new GetSearchStatsHandler(productSearchService),
    );
    const sizeGuideController = new SizeGuideController(
      new CreateSizeGuideHandler(sizeGuideManagementService),
      new UpdateSizeGuideHandler(sizeGuideManagementService),
      new DeleteSizeGuideHandler(sizeGuideManagementService),
      new CreateRegionalSizeGuideHandler(sizeGuideManagementService),
      new CreateCategorySizeGuideHandler(sizeGuideManagementService),
      new UpdateSizeGuideContentHandler(sizeGuideManagementService),
      new ClearSizeGuideContentHandler(sizeGuideManagementService),
      new CreateBulkSizeGuidesHandler(sizeGuideManagementService),
      new DeleteBulkSizeGuidesHandler(sizeGuideManagementService),
      new ListSizeGuidesHandler(sizeGuideManagementService),
      new GetSizeGuideHandler(sizeGuideManagementService),
      new GetRegionalSizeGuidesHandler(sizeGuideManagementService),
      new GetGeneralSizeGuidesHandler(sizeGuideManagementService),
      new GetSizeGuideStatsHandler(sizeGuideManagementService),
      new GetAvailableSizeGuideRegionsHandler(sizeGuideManagementService),
      new GetAvailableSizeGuideCategoriesHandler(sizeGuideManagementService),
      new ValidateSizeGuideUniquenessHandler(sizeGuideManagementService),
    );
    const editorialLookController = new EditorialLookController(
      new CreateEditorialLookHandler(editorialLookManagementService),
      new UpdateEditorialLookHandler(editorialLookManagementService),
      new DeleteEditorialLookHandler(editorialLookManagementService),
      new PublishEditorialLookHandler(editorialLookManagementService),
      new UnpublishEditorialLookHandler(editorialLookManagementService),
      new ScheduleEditorialLookPublicationHandler(editorialLookManagementService),
      new ProcessScheduledEditorialLookPublicationsHandler(editorialLookManagementService),
      new SetEditorialLookHeroImageHandler(editorialLookManagementService),
      new RemoveEditorialLookHeroImageHandler(editorialLookManagementService),
      new AddProductToEditorialLookHandler(editorialLookManagementService),
      new RemoveProductFromEditorialLookHandler(editorialLookManagementService),
      new SetEditorialLookProductsHandler(editorialLookManagementService),
      new UpdateEditorialLookStoryContentHandler(editorialLookManagementService),
      new ClearEditorialLookStoryContentHandler(editorialLookManagementService),
      new CreateBulkEditorialLooksHandler(editorialLookManagementService),
      new DeleteBulkEditorialLooksHandler(editorialLookManagementService),
      new PublishBulkEditorialLooksHandler(editorialLookManagementService),
      new DuplicateEditorialLookHandler(editorialLookManagementService),
      new ListEditorialLooksHandler(editorialLookManagementService),
      new GetEditorialLookHandler(editorialLookManagementService),
      new GetReadyToPublishEditorialLooksHandler(editorialLookManagementService),
      new GetEditorialLooksByHeroAssetHandler(editorialLookManagementService),
      new GetEditorialLookProductsHandler(editorialLookManagementService),
      new GetProductEditorialLooksHandler(editorialLookManagementService),
      new GetEditorialLooksByProductHandler(editorialLookManagementService),
      new GetEditorialLookStatsHandler(editorialLookManagementService),
      new GetPopularEditorialLookProductsHandler(editorialLookManagementService),
      new ValidateEditorialLookForPublicationHandler(editorialLookManagementService),
    );
    const variantMediaController = new VariantMediaController(
      new AddMediaToVariantHandler(variantMediaManagementService),
      new RemoveMediaFromVariantHandler(variantMediaManagementService),
      new RemoveAllVariantMediaHandler(variantMediaManagementService),
      new SetVariantMediaHandler(variantMediaManagementService),
      new AddMediaToMultipleVariantsHandler(variantMediaManagementService),
      new AddMultipleMediaToVariantHandler(variantMediaManagementService),
      new DuplicateVariantMediaHandler(variantMediaManagementService),
      new CopyProductVariantMediaHandler(variantMediaManagementService),
      new GetVariantMediaHandler(variantMediaManagementService),
      new GetProductVariantMediaHandler(variantMediaManagementService),
      new GetVariantsUsingAssetHandler(variantMediaManagementService),
      new GetVariantMediaAssetUsageCountHandler(variantMediaManagementService),
      new GetColorVariantMediaHandler(variantMediaManagementService),
      new GetSizeVariantMediaHandler(variantMediaManagementService),
      new GetUnusedVariantMediaAssetsHandler(variantMediaManagementService),
      new ValidateVariantMediaHandler(variantMediaManagementService),
      new GetVariantMediaStatisticsHandler(variantMediaManagementService),
    );

    this.services.set("productManagementService", productManagementService);
    this.services.set("categoryManagementService", categoryManagementService);
    this.services.set("mediaManagementService", mediaManagementService);
    this.services.set("variantManagementService", variantManagementService);
    this.services.set("productSearchService", productSearchService);
    this.services.set("productTagManagementService", productTagManagementService);
    this.services.set("sizeGuideManagementService", sizeGuideManagementService);
    this.services.set("editorialLookManagementService", editorialLookManagementService);
    this.services.set("productMediaManagementService", productMediaManagementService);
    this.services.set("variantMediaManagementService", variantMediaManagementService);
    this.services.set("productController", productController);
    this.services.set("categoryController", categoryController);
    this.services.set("variantController", variantController);
    this.services.set("mediaController", mediaController);
    this.services.set("productMediaController", productMediaController);
    this.services.set("productTagController", productTagController);
    this.services.set("searchController", searchController);
    this.services.set("sizeGuideController", sizeGuideController);
    this.services.set("editorialLookController", editorialLookController);
    this.services.set("variantMediaController", variantMediaController);

    // ============================================================
    // Inventory Management Module
    // ============================================================

    const stockRepository = new StockRepositoryImpl(prisma, eventBus);
    const locationRepository = new LocationRepositoryImpl(prisma, eventBus);
    const supplierRepository = new SupplierRepositoryImpl(prisma, eventBus);
    const purchaseOrderRepository = new PurchaseOrderRepositoryImpl(prisma, eventBus);
    const purchaseOrderItemRepository = new PurchaseOrderItemRepositoryImpl(prisma);
    const inventoryTransactionRepository = new InventoryTransactionRepositoryImpl(prisma, eventBus);
    const stockAlertRepository = new StockAlertRepositoryImpl(prisma, eventBus);
    const pickupReservationRepository = new PickupReservationRepositoryImpl(prisma, eventBus);

    const stockManagementService = new StockManagementService(stockRepository, inventoryTransactionRepository);
    const locationManagementService = new LocationManagementService(locationRepository);
    const supplierManagementService = new SupplierManagementService(supplierRepository);
    const purchaseOrderManagementService = new PurchaseOrderManagementService(purchaseOrderRepository, purchaseOrderItemRepository, stockRepository, inventoryTransactionRepository);
    const stockAlertService = new StockAlertService(stockAlertRepository, stockRepository);
    const pickupReservationService = new PickupReservationService(pickupReservationRepository, stockRepository, inventoryTransactionRepository);

    const stockController = new StockController(
      new AddStockHandler(stockManagementService),
      new AdjustStockHandler(stockManagementService),
      new TransferStockHandler(stockManagementService),
      new ReserveStockHandler(stockManagementService),
      new FulfillReservationHandler(stockManagementService),
      new SetStockThresholdsHandler(stockManagementService),
      new GetStockHandler(stockManagementService),
      new GetStockByVariantHandler(stockManagementService),
      new GetStockStatsHandler(stockManagementService),
      new GetTotalAvailableStockHandler(stockManagementService),
      new ListStocksHandler(stockManagementService),
      new GetLowStockItemsHandler(stockManagementService),
      new GetOutOfStockItemsHandler(stockManagementService),
    );
    const locationController = new LocationController(
      new CreateLocationHandler(locationManagementService),
      new UpdateLocationHandler(locationManagementService),
      new DeleteLocationHandler(locationManagementService),
      new GetLocationHandler(locationManagementService),
      new ListLocationsHandler(locationManagementService),
    );
    const supplierController = new SupplierController(
      new CreateSupplierHandler(supplierManagementService),
      new UpdateSupplierHandler(supplierManagementService),
      new DeleteSupplierHandler(supplierManagementService),
      new GetSupplierHandler(supplierManagementService),
      new ListSuppliersHandler(supplierManagementService),
    );
    const poController = new PurchaseOrderController(
      new CreatePurchaseOrderHandler(purchaseOrderManagementService),
      new CreatePurchaseOrderWithItemsHandler(purchaseOrderManagementService),
      new AddPOItemHandler(purchaseOrderManagementService),
      new UpdatePOItemHandler(purchaseOrderManagementService),
      new RemovePOItemHandler(purchaseOrderManagementService),
      new UpdatePOStatusHandler(purchaseOrderManagementService),
      new ReceivePOItemsHandler(purchaseOrderManagementService),
      new DeletePurchaseOrderHandler(purchaseOrderManagementService),
      new GetPurchaseOrderHandler(purchaseOrderManagementService),
      new GetPOItemsHandler(purchaseOrderManagementService),
      new ListPurchaseOrdersHandler(purchaseOrderManagementService),
      new GetOverduePurchaseOrdersHandler(purchaseOrderManagementService),
      new GetPendingReceivalHandler(purchaseOrderManagementService),
      new UpdatePOEtaHandler(purchaseOrderManagementService),
    );
    const poItemController = new PurchaseOrderItemController(
      new AddPOItemHandler(purchaseOrderManagementService),
      new UpdatePOItemHandler(purchaseOrderManagementService),
      new RemovePOItemHandler(purchaseOrderManagementService),
      new GetPOItemsHandler(purchaseOrderManagementService),
    );
    const alertController = new StockAlertController(
      new CreateStockAlertHandler(stockAlertService),
      new ResolveStockAlertHandler(stockAlertService),
      new DeleteStockAlertHandler(stockAlertService),
      new GetStockAlertHandler(stockAlertService),
      new GetActiveAlertsHandler(stockAlertService),
      new ListStockAlertsHandler(stockAlertService),
    );
    const pickupReservationController = new PickupReservationController(
      new CreatePickupReservationHandler(pickupReservationService),
      new CancelPickupReservationHandler(pickupReservationService),
      new GetPickupReservationHandler(pickupReservationService),
      new ListPickupReservationsHandler(pickupReservationService),
    );
    const inventoryTransactionController = new InventoryTransactionController(
      new GetTransactionsByVariantHandler(stockManagementService),
      new ListTransactionsHandler(stockManagementService),
      new GetTransactionHandler(stockManagementService),
    );

    this.services.set("stockController", stockController);
    this.services.set("locationController", locationController);
    this.services.set("supplierController", supplierController);
    this.services.set("poController", poController);
    this.services.set("poItemController", poItemController);
    this.services.set("alertController", alertController);
    this.services.set("pickupReservationController", pickupReservationController);
    this.services.set("inventoryTransactionController", inventoryTransactionController);

    // ============================================================
    // Cart Module
    // ============================================================

    const cartRepository = new CartRepositoryImpl(prisma);
    const checkoutRepository = new CheckoutRepositoryImpl(prisma);
    const checkoutCompletionPort = new CheckoutCompletionPortImpl(prisma);
    const settingsService = new SettingsService();

    // Cross-module port adapters: bridge inventory & product-catalog into cart's external port interfaces
    const stockServiceAdapter: IExternalStockService = {
      adjustStock: (...args) => stockManagementService.adjustStock(...args),
      getTotalAvailableStock: (variantId) => stockManagementService.getTotalAvailableStock(variantId),
      async findWarehouseId() {
        const locations = await locationRepository.findByType(LocationType.WAREHOUSE);
        return locations.length > 0 ? locations[0].locationId.getValue() : null;
      },
    };

    const reservationRepository = new ReservationRepositoryImpl(prisma, stockServiceAdapter);

    const externalProductVariantRepository: IExternalProductVariantRepository = {
      findById: async (variantId) => {
        try {
          const dto = await variantManagementService.getVariantById(variantId.getValue());
          return {
            getId: () => ({ getValue: () => dto.id }),
            getProductId: () => ({ getValue: () => dto.productId }),
            getSku: () => ({ getValue: () => dto.sku }),
            getSize: () => dto.size,
            getColor: () => dto.color,
            getWeightG: () => dto.weightG,
          };
        } catch {
          return null;
        }
      },
    };

    const externalProductRepository: IExternalProductRepository = {
      findById: async (productId) => {
        try {
          const dto = await productManagementService.getProductById(productId.getValue());
          return {
            getId: () => ({ getValue: () => dto.id }),
            getTitle: () => dto.title,
            getSlug: () => ({ getValue: () => dto.slug }),
            getPrice: () => ({ getValue: () => dto.price }),
          };
        } catch {
          return null;
        }
      },
    };

    const externalProductMediaRepository: IExternalProductMediaRepository = {
      findByProductId: async (productId) => {
        try {
          const summary = await productMediaManagementService.getProductMedia(productId.getValue());
          return summary.mediaAssets.map((asset) => ({
            getAssetId: () => ({ getValue: () => asset.assetId }),
          }));
        } catch {
          return [];
        }
      },
    };

    const externalMediaAssetRepository: IExternalMediaAssetRepository = {
      findById: async (assetId) => {
        try {
          const dto = await mediaManagementService.getAssetById(assetId.getValue());
          return dto ? { getStorageKey: () => dto.storageKey, getAltText: () => dto.altText ?? null } : null;
        } catch {
          return null;
        }
      },
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
    const reservationService = new ReservationService(reservationRepository, cartRepository);
    const checkoutService = new CheckoutService(checkoutRepository, cartRepository, settingsService);
    const checkoutOrderService = new CheckoutOrderService(
      checkoutCompletionPort,
      checkoutRepository,
      cartRepository,
      reservationRepository,
      stockServiceAdapter,
      externalProductRepository,
      externalProductVariantRepository,
      { create: (data) => ProductSnapshot.create(data) } satisfies IProductSnapshotFactory,
      { defaultStockLocation: process.env.DEFAULT_STOCK_LOCATION },
    );

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

    this.services.set("cartManagementService", cartManagementService);
    this.services.set("reservationService", reservationService);
    this.services.set("checkoutService", checkoutService);
    this.services.set("checkoutOrderService", checkoutOrderService);
    this.services.set("cartController", cartController);
    this.services.set("reservationController", reservationController);
    this.services.set("checkoutController", checkoutController);

    // ============================================================
    // Order Management Module
    // ============================================================

    const orderRepository = new OrderRepositoryImpl(prisma, eventBus);
    const orderItemRepository = new OrderItemRepositoryImpl(prisma);
    const orderAddressRepository = new OrderAddressRepositoryImpl(prisma, eventBus);
    const orderShipmentRepository = new OrderShipmentRepositoryImpl(prisma);
    const orderStatusHistoryRepository = new OrderStatusHistoryRepositoryImpl(prisma);
    const orderEventRepository = new OrderEventRepositoryImpl(prisma);
    const backorderRepository = new BackorderRepositoryImpl(prisma, eventBus);
    const preorderRepository = new PreorderRepositoryImpl(prisma, eventBus);

    // Cross-module port adapters: bridge product-catalog & inventory into order's external port interfaces
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

    const externalStockService: IOrderExternalStockService = {
      getStock: async (variantId: string, locationId: string) => {
        const dto = await stockManagementService.getStock(variantId, locationId);
        if (!dto) return null;
        return { getStockLevel: () => ({ getAvailable: () => dto.available }) };
      },
      adjustStock: (...args) => stockManagementService.adjustStock(...args),
      reserveStock: (...args) => stockManagementService.reserveStock(...args),
    };

    const orderEventService = new OrderEventService(orderEventRepository);
    const orderManagementService = new OrderManagementService(orderRepository, orderAddressRepository, orderShipmentRepository, orderStatusHistoryRepository, externalVariantService, externalProductService, externalStockService);
    const orderItemManagementService = new OrderItemManagementService(orderItemRepository);
    const shipmentManagementService = new ShipmentManagementService(orderShipmentRepository);
    const backorderManagementService = new BackorderManagementService(backorderRepository);
    const preorderManagementService = new PreorderManagementService(preorderRepository);

    const orderController = new OrderController(
      new CreateOrderHandler(orderManagementService),
      new GetOrderHandler(orderManagementService),
      new ListOrdersHandler(orderManagementService),
      new UpdateOrderStatusHandler(orderManagementService),
      new UpdateOrderTotalsHandler(orderManagementService),
      new MarkOrderPaidHandler(orderManagementService),
      new MarkOrderFulfilledHandler(orderManagementService),
      new CancelOrderHandler(orderManagementService),
      new DeleteOrderHandler(orderManagementService),
      new TrackOrderHandler(orderManagementService),
    );
    const orderAddressController = new OrderAddressController(
      new SetOrderAddressesHandler(orderManagementService),
      new UpdateBillingAddressHandler(orderManagementService),
      new UpdateShippingAddressHandler(orderManagementService),
      new GetOrderAddressHandler(orderManagementService),
    );
    const orderItemController = new OrderItemController(
      new AddOrderItemHandler(orderManagementService),
      new UpdateOrderItemHandler(orderManagementService),
      new RemoveOrderItemHandler(orderManagementService),
      new ListOrderItemsHandler(orderItemManagementService),
      new GetOrderItemHandler(orderItemManagementService),
    );
    const orderShipmentController = new OrderShipmentController(
      new CreateShipmentHandler(orderManagementService),
      new UpdateShipmentTrackingHandler(orderManagementService),
      new MarkShipmentShippedHandler(orderManagementService),
      new MarkShipmentDeliveredHandler(orderManagementService),
      new ListOrderShipmentsHandler(shipmentManagementService),
      new GetShipmentHandler(shipmentManagementService),
    );
    const orderStatusHistoryController = new OrderStatusHistoryController(
      new LogOrderStatusChangeHandler(orderManagementService),
      new GetOrderStatusHistoryHandler(orderManagementService),
    );
    const orderEventController = new OrderEventController(
      new LogOrderEventHandler(orderEventService),
      new ListOrderEventsHandler(orderEventService),
      new GetOrderEventHandler(orderEventService),
    );
    const preorderController = new PreorderController(
      new CreatePreorderHandler(preorderManagementService),
      new UpdatePreorderReleaseDateHandler(preorderManagementService),
      new MarkPreorderNotifiedHandler(preorderManagementService),
      new DeletePreorderHandler(preorderManagementService),
      new GetPreorderHandler(preorderManagementService),
      new ListPreordersHandler(preorderManagementService),
    );
    const backorderController = new BackorderController(
      new CreateBackorderHandler(backorderManagementService),
      new UpdateBackorderEtaHandler(backorderManagementService),
      new MarkBackorderNotifiedHandler(backorderManagementService),
      new DeleteBackorderHandler(backorderManagementService),
      new GetBackorderHandler(backorderManagementService),
      new ListBackordersHandler(backorderManagementService),
    );

    this.services.set("orderController", orderController);
    this.services.set("orderAddressController", orderAddressController);
    this.services.set("orderItemController", orderItemController);
    this.services.set("orderShipmentController", orderShipmentController);
    this.services.set("orderStatusHistoryController", orderStatusHistoryController);
    this.services.set("orderEventController", orderEventController);
    this.services.set("preorderController", preorderController);
    this.services.set("backorderController", backorderController);

    // ============================================================
    // Payment Module
    // ============================================================

    const paymentIntentRepository = new PaymentIntentRepositoryImpl(prisma, eventBus);
    const paymentTransactionRepository = new PaymentTransactionRepositoryImpl(prisma, eventBus);
    const paymentWebhookEventRepository = new PaymentWebhookEventRepositoryImpl(prisma, eventBus);
    const bnplTransactionRepository = new BnplTransactionRepositoryImpl(prisma, eventBus);
    const giftCardRepository = new GiftCardRepositoryImpl(prisma, eventBus);
    const giftCardTransactionRepository = new GiftCardTransactionRepositoryImpl(prisma, eventBus);
    const promotionRepository = new PromotionRepositoryImpl(prisma, eventBus);
    const promotionUsageRepository = new PromotionUsageRepositoryImpl(prisma, eventBus);

    // Cross-module port adapter: bridge order-management into payment's order query port
    const orderQueryPort: IExternalOrderQueryPort = {
      async findOrderOwner(orderId: string) {
        const order = await orderRepository.findById(OrderId.fromString(orderId));
        return order ? { userId: order.userId ?? null } : null;
      },
    };

    const paymentService = new PaymentService(orderQueryPort, paymentIntentRepository, paymentTransactionRepository);
    const bnplTransactionService = new BnplTransactionService(paymentIntentRepository, orderQueryPort, bnplTransactionRepository);
    const giftCardService = new GiftCardService(orderQueryPort, giftCardRepository, giftCardTransactionRepository);
    const promotionService = new PromotionService(promotionRepository, promotionUsageRepository);
    const paymentWebhookService = new PaymentWebhookService(paymentWebhookEventRepository, {
      stripe: process.env.STRIPE_WEBHOOK_SECRET,
      paypal: process.env.PAYPAL_WEBHOOK_SECRET,
      razorpay: process.env.RAZORPAY_WEBHOOK_SECRET,
    });

    const paymentIntentController = new PaymentIntentController(
      new CreatePaymentIntentHandler(paymentService),
      new ProcessPaymentHandler(paymentService),
      new RefundPaymentHandler(paymentService),
      new VoidPaymentHandler(paymentService),
      new GetPaymentIntentHandler(paymentService),
      new GetPaymentTransactionsHandler(paymentService),
    );
    const paymentWebhookController = new PaymentWebhookController(
      new ProcessWebhookEventHandler(paymentWebhookService),
      new GetWebhookEventsHandler(paymentWebhookService),
    );
    const bnplController = new BnplTransactionController(
      new CreateBnplTransactionHandler(bnplTransactionService),
      new ProcessBnplPaymentHandler(bnplTransactionService),
      new GetBnplTransactionsHandler(bnplTransactionService),
    );
    const giftCardController = new GiftCardController(
      new CreateGiftCardHandler(giftCardService),
      new RedeemGiftCardHandler(giftCardService),
      new GetGiftCardBalanceHandler(giftCardService),
      new GetGiftCardTransactionsHandler(giftCardService),
    );
    const promotionController = new PromotionController(
      new CreatePromotionHandler(promotionService),
      new ApplyPromotionHandler(promotionService),
      new GetActivePromotionsHandler(promotionService),
      new RecordPromotionUsageHandler(promotionService),
      new GetPromotionUsageHandler(promotionService),
    );
    const stripeController = isStripeConfigured()
      ? new StripeWebhookController(paymentService)
      : null;

    this.services.set("paymentService", paymentService);
    this.services.set("bnplTransactionService", bnplTransactionService);
    this.services.set("giftCardService", giftCardService);
    this.services.set("promotionService", promotionService);
    this.services.set("paymentWebhookService", paymentWebhookService);
    this.services.set("paymentIntentController", paymentIntentController);
    this.services.set("paymentWebhookController", paymentWebhookController);
    this.services.set("bnplController", bnplController);
    this.services.set("giftCardController", giftCardController);
    this.services.set("promotionController", promotionController);
    this.services.set("stripeController", stripeController);

    // ============================================================
    // Loyalty Module
    // ============================================================

    const loyaltyAccountRepository = new LoyaltyAccountRepositoryImpl(prisma, eventBus);
    const loyaltyProgramRepository = new LoyaltyProgramRepositoryImpl(prisma, eventBus);
    const loyaltyTransactionRepository = new LoyaltyTransactionRepositoryImpl(prisma, eventBus);

    const loyaltyService = new LoyaltyService(loyaltyAccountRepository, loyaltyTransactionRepository);
    const loyaltyProgramService = new LoyaltyProgramService(loyaltyProgramRepository);

    const loyaltyController = new LoyaltyController(
      new CreateLoyaltyProgramHandler(loyaltyProgramService),
      new GetLoyaltyProgramsHandler(loyaltyProgramService),
      new GetLoyaltyAccountHandler(loyaltyService),
      new AwardLoyaltyPointsHandler(loyaltyService),
      new RedeemLoyaltyPointsHandler(loyaltyService),
      new AdjustLoyaltyPointsHandler(loyaltyService),
      new GetLoyaltyTransactionsHandler(loyaltyService),
    );

    this.services.set("loyaltyService", loyaltyService);
    this.services.set("loyaltyProgramService", loyaltyProgramService);
    this.services.set("loyaltyController", loyaltyController);

    // ============================================================
    // Engagement Module
    // ============================================================

    const wishlistRepository = new WishlistRepositoryImpl(prisma, eventBus);
    const wishlistItemRepository = new WishlistItemRepositoryImpl(prisma, eventBus);
    const reminderRepository = new ReminderRepositoryImpl(prisma, eventBus);
    const notificationRepository = new NotificationRepositoryImpl(prisma, eventBus);
    const appointmentRepository = new AppointmentRepositoryImpl(prisma, eventBus);
    const productReviewRepository = new ProductReviewRepositoryImpl(prisma, eventBus);
    const newsletterSubscriptionRepository = new NewsletterSubscriptionRepositoryImpl(prisma, eventBus);

    const wishlistManagementService = new WishlistManagementService(wishlistRepository, wishlistItemRepository);
    const reminderManagementService = new ReminderManagementService(reminderRepository);
    const notificationService = new NotificationService(notificationRepository);
    const appointmentService = new AppointmentService(appointmentRepository);
    const productReviewService = new ProductReviewService(productReviewRepository);
    const newsletterService = new NewsletterService(newsletterSubscriptionRepository);

    const wishlistController = new WishlistController(
      new CreateWishlistHandler(wishlistManagementService),
      new AddToWishlistHandler(wishlistManagementService),
      new RemoveFromWishlistHandler(wishlistManagementService),
      new UpdateWishlistHandler(wishlistManagementService),
      new DeleteWishlistHandler(wishlistManagementService),
      new GetWishlistHandler(wishlistManagementService),
      new GetUserWishlistsHandler(wishlistManagementService),
      new GetPublicWishlistsHandler(wishlistManagementService),
      new GetWishlistItemsHandler(wishlistManagementService),
    );
    const reminderController = new ReminderController(
      new CreateReminderHandler(reminderManagementService),
      new MarkReminderAsSentHandler(reminderManagementService),
      new UnsubscribeReminderHandler(reminderManagementService),
      new DeleteReminderHandler(reminderManagementService),
      new GetReminderHandler(reminderManagementService),
      new GetUserRemindersHandler(reminderManagementService),
      new GetVariantRemindersHandler(reminderManagementService),
    );
    const notificationController = new NotificationController(
      new ScheduleNotificationHandler(notificationService),
      new SendNotificationHandler(notificationService),
      new GetNotificationHandler(notificationService),
      new GetNotificationsByTypeHandler(notificationService),
    );
    const appointmentController = new AppointmentController(
      new CreateAppointmentHandler(appointmentService),
      new UpdateAppointmentHandler(appointmentService),
      new CancelAppointmentHandler(appointmentService),
      new GetAppointmentHandler(appointmentService),
      new GetUserAppointmentsHandler(appointmentService),
      new GetLocationAppointmentsHandler(appointmentService),
    );
    const productReviewController = new ProductReviewController(
      new CreateProductReviewHandler(productReviewService),
      new UpdateReviewStatusHandler(productReviewService),
      new DeleteProductReviewHandler(productReviewService),
      new GetProductReviewHandler(productReviewService),
      new GetProductReviewsHandler(productReviewService),
      new GetUserReviewsHandler(productReviewService),
    );
    const newsletterController = new NewsletterController(
      new SubscribeNewsletterHandler(newsletterService),
      new UnsubscribeNewsletterHandler(newsletterService),
      new GetNewsletterSubscriptionHandler(newsletterService),
    );

    this.services.set("wishlistController", wishlistController);
    this.services.set("reminderController", reminderController);
    this.services.set("notificationController", notificationController);
    this.services.set("appointmentController", appointmentController);
    this.services.set("productReviewController", productReviewController);
    this.services.set("newsletterController", newsletterController);
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

  getProductCatalogServices() {
    return {
      productController: this.get<ProductController>("productController"),
      categoryController: this.get<CategoryController>("categoryController"),
      variantController: this.get<VariantController>("variantController"),
      mediaController: this.get<MediaController>("mediaController"),
      productMediaController: this.get<ProductMediaController>("productMediaController"),
      productTagController: this.get<ProductTagController>("productTagController"),
      searchController: this.get<SearchController>("searchController"),
      sizeGuideController: this.get<SizeGuideController>("sizeGuideController"),
      editorialLookController: this.get<EditorialLookController>("editorialLookController"),
      variantMediaController: this.get<VariantMediaController>("variantMediaController"),
    };
  }

  getInventoryManagementServices() {
    return {
      stockController: this.get<StockController>("stockController"),
      locationController: this.get<LocationController>("locationController"),
      supplierController: this.get<SupplierController>("supplierController"),
      poController: this.get<PurchaseOrderController>("poController"),
      poItemController: this.get<PurchaseOrderItemController>("poItemController"),
      alertController: this.get<StockAlertController>("alertController"),
      pickupReservationController: this.get<PickupReservationController>("pickupReservationController"),
      inventoryTransactionController: this.get<InventoryTransactionController>("inventoryTransactionController"),
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
      orderController: this.get<OrderController>("orderController"),
      orderAddressController: this.get<OrderAddressController>("orderAddressController"),
      orderItemController: this.get<OrderItemController>("orderItemController"),
      orderShipmentController: this.get<OrderShipmentController>("orderShipmentController"),
      orderStatusHistoryController: this.get<OrderStatusHistoryController>("orderStatusHistoryController"),
      orderEventController: this.get<OrderEventController>("orderEventController"),
      preorderController: this.get<PreorderController>("preorderController"),
      backorderController: this.get<BackorderController>("backorderController"),
    };
  }

  getPaymentServices() {
    return {
      paymentIntentController: this.get<PaymentIntentController>("paymentIntentController"),
      paymentWebhookController: this.get<PaymentWebhookController>("paymentWebhookController"),
      bnplController: this.get<BnplTransactionController>("bnplController"),
      giftCardController: this.get<GiftCardController>("giftCardController"),
      promotionController: this.get<PromotionController>("promotionController"),
      stripeController: this.get<StripeWebhookController | null>("stripeController"),
    };
  }

  getLoyaltyServices() {
    return {
      loyaltyController: this.get<LoyaltyController>("loyaltyController"),
    };
  }

  /** Combined getter for registerPaymentRoutes — which owns both payment and loyalty routes. */
  getPaymentLoyaltyServices() {
    return {
      ...this.getPaymentServices(),
      ...this.getLoyaltyServices(),
    };
  }

  getEngagementServices() {
    return {
      wishlistController: this.get<WishlistController>("wishlistController"),
      reminderController: this.get<ReminderController>("reminderController"),
      notificationController: this.get<NotificationController>("notificationController"),
      appointmentController: this.get<AppointmentController>("appointmentController"),
      productReviewController: this.get<ProductReviewController>("productReviewController"),
      newsletterController: this.get<NewsletterController>("newsletterController"),
    };
  }
}

export const container = Container.getInstance();


