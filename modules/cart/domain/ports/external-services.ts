export interface ExternalVariantData {
  getId(): { getValue(): string };
  getProductId(): { getValue(): string };
  getSku(): { getValue(): string };
  getSize(): string | null;
  getColor(): string | null;
  getWeightG(): number | null;
}

export interface IExternalProductVariantRepository {
  findById(variantId: {
    getValue(): string;
  }): Promise<ExternalVariantData | null>;
}

// ---- Product Catalog: Product Lookup ----

export interface ExternalProductData {
  getId(): { getValue(): string };
  getTitle(): string;
  getSlug(): { getValue(): string };
  getPrice(): { getValue(): number };
}

export interface IExternalProductRepository {
  findById(productId: {
    getValue(): string;
  }): Promise<ExternalProductData | null>;
}

// ---- Product Catalog: Media Lookup ----

export interface ExternalProductMediaData {
  getAssetId(): { getValue(): string };
}

export interface IExternalProductMediaRepository {
  findByProductId(
    productId: { getValue(): string },
    options?: { sortBy?: string; sortOrder?: string },
  ): Promise<ExternalProductMediaData[]>;
}

export interface ExternalMediaAssetData {
  getStorageKey(): string;
  getAltText(): string | null;
}

export interface IExternalMediaAssetRepository {
  findById(assetId: {
    getValue(): string;
  }): Promise<ExternalMediaAssetData | null>;
}

// ---- Inventory: Stock Management ----

export interface IExternalStockService {
  adjustStock(
    variantId: string,
    locationId: string,
    quantityDelta: number,
    reason: string,
    referenceId?: string,
  ): Promise<unknown>;
  getTotalAvailableStock(variantId: string): Promise<number>;
  findWarehouseId(): Promise<string | null>;
}

// ---- Order Management: Product Snapshot ----

export interface ProductSnapshotData {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  variantName?: string;
  price: number;
  imageUrl?: string;
  weight?: number;
  attributes?: Record<string, any>;
}

export interface IProductSnapshotFactory {
  create(data: ProductSnapshotData): { toJSON(): ProductSnapshotData };
}

// ---- Admin: Settings ----

export interface ShippingRates {
  colombo: number;
  suburbs: number;
}

export interface IExternalSettingsService {
  getShippingRates(): Promise<ShippingRates>;
}

// ---- Infrastructure: Transaction Support ----

/**
 * Data required to atomically persist a completed checkout as an order.
 * The application layer gathers and validates all this data,
 * then delegates the atomic multi-table persistence to the infra layer.
 */
export interface PersistCheckoutOrderData {
  orderNo: string;
  userId?: string;
  guestToken?: string;
  checkoutId: string;
  paymentIntentId: string;
  currency: string;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  items: Array<{
    variantId: string;
    qty: number;
    productSnapshot: Record<string, unknown>;
    isGift: boolean;
    giftMessage?: string;
  }>;
  shippingAddress: Record<string, unknown>;
  billingAddress: Record<string, unknown>;
  email?: string;
  cartId: string;
  stockAdjustments: Array<{
    variantId: string;
    warehouseId: string;
    quantity: number;
    orderId?: string;
  }>;
}

// Full Prisma `OrderItem` row shape — what `findExistingOrder` and
// `persistCheckoutOrder` return. Mirrors the Prisma `OrderItem` model in
// `order_management.order_items` (no createdAt/updatedAt on this model).
export interface CheckoutOrderItemRow {
  id: string;
  orderId: string;
  variantId: string;
  qty: number;
  productSnapshot: unknown;
  isGift: boolean;
  giftMessage: string | null;
}

// API-flattened shape — what `findOrderByCheckoutId` returns for the
// "view order" endpoint. Different from the row shape because the consumer
// reads denormalised fields out of `productSnapshot` (productId, price)
// rather than the JSON blob itself.
export interface CheckoutOrderItemView {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
}

export type CheckoutOrderItem =
  | CheckoutOrderItemRow
  | CheckoutOrderItemView;

export interface CheckoutOrderResult {
  orderId: string;
  orderNo: string;
  checkoutId: string;
  paymentIntentId: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: Date;
  items: CheckoutOrderItem[];
}

export interface PaymentIntentInfo {
  intentId: string;
  status: string;
}

/**
 * Port for checkout-to-order completion.
 * Implemented in the infra layer using Prisma transactions.
 * The application layer calls query methods for validation,
 * then calls persistCheckoutOrder() for atomic writes.
 */
export interface ICheckoutCompletionPort {
  /** Find payment intent by checkoutId, falling back to intentId. */
  findPaymentIntent(
    checkoutId: string,
    paymentIntentId: string,
  ): Promise<PaymentIntentInfo | null>;

  /** Check if an order already exists for this checkout (idempotency). */
  findExistingOrder(checkoutId: string): Promise<CheckoutOrderResult | null>;

  /** Get the email stored on the cart (not exposed via domain entity). */
  getCartEmail(cartId: string): Promise<string | null>;

  /** Find an order by checkoutId for a specific user/guest. */
  findOrderByCheckoutId(
    checkoutId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CheckoutOrderResult | null>;

  persistCheckoutOrder(
    data: PersistCheckoutOrderData,
  ): Promise<CheckoutOrderResult>;
}
