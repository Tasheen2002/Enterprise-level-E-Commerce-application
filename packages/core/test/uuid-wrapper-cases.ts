import { CartId as CartCartId } from "../../../modules/cart/domain/value-objects/cart-id.vo";
import { CartOwnerId as CartCartOwnerId } from "../../../modules/cart/domain/value-objects/cart-owner-id.vo";
import { CheckoutId as CartCheckoutId } from "../../../modules/cart/domain/value-objects/checkout-id.vo";
import { ReservationId as CartReservationId } from "../../../modules/cart/domain/value-objects/reservation-id.vo";
import { AppointmentId as EngagementAppointmentId } from "../../../modules/engagement/domain/value-objects/appointment-id.vo";
import { NotificationId as EngagementNotificationId } from "../../../modules/engagement/domain/value-objects/notification-id.vo";
import { ReminderId as EngagementReminderId } from "../../../modules/engagement/domain/value-objects/reminder-id.vo";
import { ReviewId as EngagementReviewId } from "../../../modules/engagement/domain/value-objects/review-id.vo";
import { SubscriptionId as EngagementSubscriptionId } from "../../../modules/engagement/domain/value-objects/subscription-id.vo";
import { WishlistId as EngagementWishlistId } from "../../../modules/engagement/domain/value-objects/wishlist-id.vo";
import { WishlistItemId as EngagementWishlistItemId } from "../../../modules/engagement/domain/value-objects/wishlist-item-id.vo";
import { AlertId as InventoryManagementAlertId } from "../../../modules/inventory-management/domain/value-objects/alert-id.vo";
import { LocationId as InventoryManagementLocationId } from "../../../modules/inventory-management/domain/value-objects/location-id.vo";
import { PurchaseOrderId as InventoryManagementPurchaseOrderId } from "../../../modules/inventory-management/domain/value-objects/purchase-order-id.vo";
import { ReservationId as InventoryManagementReservationId } from "../../../modules/inventory-management/domain/value-objects/reservation-id.vo";
import { SupplierId as InventoryManagementSupplierId } from "../../../modules/inventory-management/domain/value-objects/supplier-id.vo";
import { TransactionId as InventoryManagementTransactionId } from "../../../modules/inventory-management/domain/value-objects/transaction-id.vo";
import { LoyaltyAccountId as LoyaltyLoyaltyAccountId } from "../../../modules/loyalty/domain/value-objects/loyalty-account-id.vo";
import { LoyaltyProgramId as LoyaltyLoyaltyProgramId } from "../../../modules/loyalty/domain/value-objects/loyalty-program-id.vo";
import { LoyaltyTransactionId as LoyaltyLoyaltyTransactionId } from "../../../modules/loyalty/domain/value-objects/loyalty-transaction-id.vo";
import { OrderId as OrderManagementOrderId } from "../../../modules/order-management/domain/value-objects/order-id.vo";
import { OrderItemId as OrderManagementOrderItemId } from "../../../modules/order-management/domain/value-objects/order-item-id.vo";
import { ShipmentId as OrderManagementShipmentId } from "../../../modules/order-management/domain/value-objects/shipment-id.vo";
import { BnplTransactionId as PaymentBnplTransactionId } from "../../../modules/payment/domain/value-objects/bnpl-transaction-id.vo";
import { GiftCardId as PaymentGiftCardId } from "../../../modules/payment/domain/value-objects/gift-card-id.vo";
import { GiftCardTransactionId as PaymentGiftCardTransactionId } from "../../../modules/payment/domain/value-objects/gift-card-transaction-id.vo";
import { PaymentIntentId as PaymentPaymentIntentId } from "../../../modules/payment/domain/value-objects/payment-intent-id.vo";
import { PaymentTransactionId as PaymentPaymentTransactionId } from "../../../modules/payment/domain/value-objects/payment-transaction-id.vo";
import { PromotionId as PaymentPromotionId } from "../../../modules/payment/domain/value-objects/promotion-id.vo";
import { PromotionUsageId as PaymentPromotionUsageId } from "../../../modules/payment/domain/value-objects/promotion-usage-id.vo";
import { WebhookEventId as PaymentWebhookEventId } from "../../../modules/payment/domain/value-objects/webhook-event-id.vo";
import { CategoryId as ProductCatalogCategoryId } from "../../../modules/product-catalog/domain/value-objects/category-id.vo";
import { EditorialLookId as ProductCatalogEditorialLookId } from "../../../modules/product-catalog/domain/value-objects/editorial-look-id.vo";
import { MediaAssetId as ProductCatalogMediaAssetId } from "../../../modules/product-catalog/domain/value-objects/media-asset-id.vo";
import { ProductId as ProductCatalogProductId } from "../../../modules/product-catalog/domain/value-objects/product-id.vo";
import { ProductTagId as ProductCatalogProductTagId } from "../../../modules/product-catalog/domain/value-objects/product-tag-id.vo";
import { SizeGuideId as ProductCatalogSizeGuideId } from "../../../modules/product-catalog/domain/value-objects/size-guide-id.vo";
import { VariantId as ProductCatalogVariantId } from "../../../modules/product-catalog/domain/value-objects/variant-id.vo";
import { AddressId as UserManagementAddressId } from "../../../modules/user-management/domain/value-objects/address-id.vo";
import { PaymentMethodId as UserManagementPaymentMethodId } from "../../../modules/user-management/domain/value-objects/payment-method-id.vo";
import { SocialLoginId as UserManagementSocialLoginId } from "../../../modules/user-management/domain/value-objects/social-login-id.vo";
import { UserId as UserManagementUserId } from "../../../modules/user-management/domain/value-objects/user-id.vo";

// Explicit current UUID wrapper inventory; the runtime suite checks discovery for omissions.
export const uuidCases = [
  {
    name: "cart.CartId",
    source: "modules/cart/domain/value-objects/cart-id.vo.ts",
    label: "Cart ID",
    type: CartCartId,
  },
  {
    name: "cart.CartOwnerId",
    source: "modules/cart/domain/value-objects/cart-owner-id.vo.ts",
    label: "Cart Owner ID",
    type: CartCartOwnerId,
  },
  {
    name: "cart.CheckoutId",
    source: "modules/cart/domain/value-objects/checkout-id.vo.ts",
    label: "Checkout ID",
    type: CartCheckoutId,
  },
  {
    name: "cart.ReservationId",
    source: "modules/cart/domain/value-objects/reservation-id.vo.ts",
    label: "Reservation ID",
    type: CartReservationId,
  },
  {
    name: "engagement.AppointmentId",
    source: "modules/engagement/domain/value-objects/appointment-id.vo.ts",
    label: "AppointmentId",
    type: EngagementAppointmentId,
  },
  {
    name: "engagement.NotificationId",
    source: "modules/engagement/domain/value-objects/notification-id.vo.ts",
    label: "NotificationId",
    type: EngagementNotificationId,
  },
  {
    name: "engagement.ReminderId",
    source: "modules/engagement/domain/value-objects/reminder-id.vo.ts",
    label: "ReminderId",
    type: EngagementReminderId,
  },
  {
    name: "engagement.ReviewId",
    source: "modules/engagement/domain/value-objects/review-id.vo.ts",
    label: "ReviewId",
    type: EngagementReviewId,
  },
  {
    name: "engagement.SubscriptionId",
    source: "modules/engagement/domain/value-objects/subscription-id.vo.ts",
    label: "SubscriptionId",
    type: EngagementSubscriptionId,
  },
  {
    name: "engagement.WishlistId",
    source: "modules/engagement/domain/value-objects/wishlist-id.vo.ts",
    label: "WishlistId",
    type: EngagementWishlistId,
  },
  {
    name: "engagement.WishlistItemId",
    source: "modules/engagement/domain/value-objects/wishlist-item-id.vo.ts",
    label: "WishlistItemId",
    type: EngagementWishlistItemId,
  },
  {
    name: "inventory-management.AlertId",
    source: "modules/inventory-management/domain/value-objects/alert-id.vo.ts",
    label: "Alert ID",
    type: InventoryManagementAlertId,
  },
  {
    name: "inventory-management.LocationId",
    source: "modules/inventory-management/domain/value-objects/location-id.vo.ts",
    label: "Location ID",
    type: InventoryManagementLocationId,
  },
  {
    name: "inventory-management.PurchaseOrderId",
    source: "modules/inventory-management/domain/value-objects/purchase-order-id.vo.ts",
    label: "Purchase Order ID",
    type: InventoryManagementPurchaseOrderId,
  },
  {
    name: "inventory-management.ReservationId",
    source: "modules/inventory-management/domain/value-objects/reservation-id.vo.ts",
    label: "Reservation ID",
    type: InventoryManagementReservationId,
  },
  {
    name: "inventory-management.SupplierId",
    source: "modules/inventory-management/domain/value-objects/supplier-id.vo.ts",
    label: "Supplier ID",
    type: InventoryManagementSupplierId,
  },
  {
    name: "inventory-management.TransactionId",
    source: "modules/inventory-management/domain/value-objects/transaction-id.vo.ts",
    label: "Transaction ID",
    type: InventoryManagementTransactionId,
  },
  {
    name: "loyalty.LoyaltyAccountId",
    source: "modules/loyalty/domain/value-objects/loyalty-account-id.vo.ts",
    label: "Loyalty Account ID",
    type: LoyaltyLoyaltyAccountId,
  },
  {
    name: "loyalty.LoyaltyProgramId",
    source: "modules/loyalty/domain/value-objects/loyalty-program-id.vo.ts",
    label: "Loyalty Program ID",
    type: LoyaltyLoyaltyProgramId,
  },
  {
    name: "loyalty.LoyaltyTransactionId",
    source: "modules/loyalty/domain/value-objects/loyalty-transaction-id.vo.ts",
    label: "Loyalty Transaction ID",
    type: LoyaltyLoyaltyTransactionId,
  },
  {
    name: "order-management.OrderId",
    source: "modules/order-management/domain/value-objects/order-id.vo.ts",
    label: "OrderId",
    type: OrderManagementOrderId,
  },
  {
    name: "order-management.OrderItemId",
    source: "modules/order-management/domain/value-objects/order-item-id.vo.ts",
    label: "OrderItemId",
    type: OrderManagementOrderItemId,
  },
  {
    name: "order-management.ShipmentId",
    source: "modules/order-management/domain/value-objects/shipment-id.vo.ts",
    label: "ShipmentId",
    type: OrderManagementShipmentId,
  },
  {
    name: "payment.BnplTransactionId",
    source: "modules/payment/domain/value-objects/bnpl-transaction-id.vo.ts",
    label: "BNPL Transaction ID",
    type: PaymentBnplTransactionId,
  },
  {
    name: "payment.GiftCardId",
    source: "modules/payment/domain/value-objects/gift-card-id.vo.ts",
    label: "Gift Card ID",
    type: PaymentGiftCardId,
  },
  {
    name: "payment.GiftCardTransactionId",
    source: "modules/payment/domain/value-objects/gift-card-transaction-id.vo.ts",
    label: "Gift Card Transaction ID",
    type: PaymentGiftCardTransactionId,
  },
  {
    name: "payment.PaymentIntentId",
    source: "modules/payment/domain/value-objects/payment-intent-id.vo.ts",
    label: "Payment Intent ID",
    type: PaymentPaymentIntentId,
  },
  {
    name: "payment.PaymentTransactionId",
    source: "modules/payment/domain/value-objects/payment-transaction-id.vo.ts",
    label: "Payment Transaction ID",
    type: PaymentPaymentTransactionId,
  },
  {
    name: "payment.PromotionId",
    source: "modules/payment/domain/value-objects/promotion-id.vo.ts",
    label: "Promotion ID",
    type: PaymentPromotionId,
  },
  {
    name: "payment.PromotionUsageId",
    source: "modules/payment/domain/value-objects/promotion-usage-id.vo.ts",
    label: "Promotion Usage ID",
    type: PaymentPromotionUsageId,
  },
  {
    name: "payment.WebhookEventId",
    source: "modules/payment/domain/value-objects/webhook-event-id.vo.ts",
    label: "Webhook Event ID",
    type: PaymentWebhookEventId,
  },
  {
    name: "product-catalog.CategoryId",
    source: "modules/product-catalog/domain/value-objects/category-id.vo.ts",
    label: "CategoryId",
    type: ProductCatalogCategoryId,
  },
  {
    name: "product-catalog.EditorialLookId",
    source: "modules/product-catalog/domain/value-objects/editorial-look-id.vo.ts",
    label: "EditorialLookId",
    type: ProductCatalogEditorialLookId,
  },
  {
    name: "product-catalog.MediaAssetId",
    source: "modules/product-catalog/domain/value-objects/media-asset-id.vo.ts",
    label: "MediaAssetId",
    type: ProductCatalogMediaAssetId,
  },
  {
    name: "product-catalog.ProductId",
    source: "modules/product-catalog/domain/value-objects/product-id.vo.ts",
    label: "ProductId",
    type: ProductCatalogProductId,
  },
  {
    name: "product-catalog.ProductTagId",
    source: "modules/product-catalog/domain/value-objects/product-tag-id.vo.ts",
    label: "ProductTagId",
    type: ProductCatalogProductTagId,
  },
  {
    name: "product-catalog.SizeGuideId",
    source: "modules/product-catalog/domain/value-objects/size-guide-id.vo.ts",
    label: "SizeGuideId",
    type: ProductCatalogSizeGuideId,
  },
  {
    name: "product-catalog.VariantId",
    source: "modules/product-catalog/domain/value-objects/variant-id.vo.ts",
    label: "VariantId",
    type: ProductCatalogVariantId,
  },
  {
    name: "user-management.AddressId",
    source: "modules/user-management/domain/value-objects/address-id.vo.ts",
    label: "AddressId",
    type: UserManagementAddressId,
  },
  {
    name: "user-management.PaymentMethodId",
    source: "modules/user-management/domain/value-objects/payment-method-id.vo.ts",
    label: "PaymentMethodId",
    type: UserManagementPaymentMethodId,
  },
  {
    name: "user-management.SocialLoginId",
    source: "modules/user-management/domain/value-objects/social-login-id.vo.ts",
    label: "SocialLoginId",
    type: UserManagementSocialLoginId,
  },
  {
    name: "user-management.UserId",
    source: "modules/user-management/domain/value-objects/user-id.vo.ts",
    label: "UserId",
    type: UserManagementUserId,
  },
] as const;
