import { AggregateRoot } from "../../../../packages/core/src/domain/aggregate-root";
import { DomainEvent } from "../../../../packages/core/src/domain/events/domain-event";
import { CartId } from "../value-objects/cart-id.vo";
import { CartOwnerId } from "../value-objects/cart-owner-id.vo";
import { GuestToken } from "../value-objects/guest-token.vo";
import { Currency } from "../../../../packages/core/src/domain/value-objects/currency.vo";
import {
  CartItem,
  CartItemDTO,
  CreateCartItemData,
  CartItemEntityData,
} from "./cart-item.entity";
import {
  DomainValidationError,
  CartItemNotFoundError,
  InvalidOperationError,
} from "../errors";
import { CART_RESERVATION_DEFAULT_EXTENSION_HOURS } from "../constants";

// ============================================================================
// Domain Events
// ============================================================================

export class CartCreatedEvent extends DomainEvent {
  constructor(
    public readonly cartId: string,
    public readonly currency: string,
    public readonly isGuestCart: boolean,
  ) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.created";
  }

  getPayload(): Record<string, unknown> {
    return {
      cartId: this.cartId,
      currency: this.currency,
      isGuestCart: this.isGuestCart,
    };
  }
}

export class CartItemAddedEvent extends DomainEvent {
  constructor(
    public readonly cartId: string,
    public readonly variantId: string,
    public readonly quantity: number,
  ) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.item_added";
  }

  getPayload(): Record<string, unknown> {
    return {
      cartId: this.cartId,
      variantId: this.variantId,
      quantity: this.quantity,
    };
  }
}

export class CartItemRemovedEvent extends DomainEvent {
  constructor(
    public readonly cartId: string,
    public readonly variantId: string,
  ) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.item_removed";
  }

  getPayload(): Record<string, unknown> {
    return { cartId: this.cartId, variantId: this.variantId };
  }
}

export class CartItemQuantityChangedEvent extends DomainEvent {
  constructor(
    public readonly cartId: string,
    public readonly cartItemId: string,
    public readonly variantId: string,
    public readonly newQuantity: number,
  ) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.item_quantity_changed";
  }

  getPayload(): Record<string, unknown> {
    return {
      cartId: this.cartId,
      cartItemId: this.cartItemId,
      variantId: this.variantId,
      newQuantity: this.newQuantity,
    };
  }
}

export class CartClearedEvent extends DomainEvent {
  constructor(public readonly cartId: string) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.cleared";
  }

  getPayload(): Record<string, unknown> {
    return { cartId: this.cartId };
  }
}

export class CartEmailUpdatedEvent extends DomainEvent {
  constructor(
    public readonly cartId: string,
    public readonly email: string,
  ) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.email_updated";
  }

  getPayload(): Record<string, unknown> {
    return { cartId: this.cartId, email: this.email };
  }
}

export class CartShippingInfoUpdatedEvent extends DomainEvent {
  constructor(public readonly cartId: string) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.shipping_info_updated";
  }

  getPayload(): Record<string, unknown> {
    return { cartId: this.cartId };
  }
}

export class CartAddressesUpdatedEvent extends DomainEvent {
  constructor(public readonly cartId: string) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.addresses_updated";
  }

  getPayload(): Record<string, unknown> {
    return { cartId: this.cartId };
  }
}

export class CartTransferredToUserEvent extends DomainEvent {
  constructor(
    public readonly cartId: string,
    public readonly userId: string,
  ) {
    super(cartId, "ShoppingCart");
  }

  get eventType(): string {
    return "cart.transferred_to_user";
  }

  getPayload(): Record<string, unknown> {
    return { cartId: this.cartId, userId: this.userId };
  }
}

// ============================================================================
// Props & Data Interfaces
// ============================================================================

// Pre-checkout fields collected on the cart row before checkout
// initialisation. They have no aggregate invariants of their own (any
// non-null string is acceptable; nullability is the contract); they live
// here so a logged-in shopper can populate them across visits and the
// Checkout aggregate can consume them at initialisation time.
export interface CartCheckoutFields {
  email: string | null;
  shippingMethod: string | null;
  shippingOption: string | null;
  isGift: boolean;
  shippingFirstName: string | null;
  shippingLastName: string | null;
  shippingAddress1: string | null;
  shippingAddress2: string | null;
  shippingCity: string | null;
  shippingProvince: string | null;
  shippingPostalCode: string | null;
  shippingCountryCode: string | null;
  shippingPhone: string | null;
  billingFirstName: string | null;
  billingLastName: string | null;
  billingAddress1: string | null;
  billingAddress2: string | null;
  billingCity: string | null;
  billingProvince: string | null;
  billingPostalCode: string | null;
  billingCountryCode: string | null;
  billingPhone: string | null;
  sameAddressForBilling: boolean;
}

export interface UpdateShippingInfoData {
  shippingMethod?: string;
  shippingOption?: string;
  isGift?: boolean;
}

export interface UpdateCartAddressesData {
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCity?: string;
  shippingProvince?: string;
  shippingPostalCode?: string;
  shippingCountryCode?: string;
  shippingPhone?: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingAddress1?: string;
  billingAddress2?: string;
  billingCity?: string;
  billingProvince?: string;
  billingPostalCode?: string;
  billingCountryCode?: string;
  billingPhone?: string;
  sameAddressForBilling?: boolean;
}

export interface ShoppingCartProps extends CartCheckoutFields {
  cartId: CartId;
  userId: CartOwnerId | null;
  guestToken: GuestToken | null;
  currency: Currency;
  items: CartItem[];
  reservationExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_CHECKOUT_FIELDS: CartCheckoutFields = {
  email: null,
  shippingMethod: null,
  shippingOption: null,
  isGift: false,
  shippingFirstName: null,
  shippingLastName: null,
  shippingAddress1: null,
  shippingAddress2: null,
  shippingCity: null,
  shippingProvince: null,
  shippingPostalCode: null,
  shippingCountryCode: null,
  shippingPhone: null,
  billingFirstName: null,
  billingLastName: null,
  billingAddress1: null,
  billingAddress2: null,
  billingCity: null,
  billingProvince: null,
  billingPostalCode: null,
  billingCountryCode: null,
  billingPhone: null,
  sameAddressForBilling: true,
};

// ============================================================================
// DTO
// ============================================================================

export interface ShoppingCartDTO {
  cartId: string;
  userId?: string;
  guestToken?: string;
  currency: string;
  items: CartItemDTO[];
  reservationExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
  isUserCart: boolean;
  isGuestCart: boolean;
  isEmpty: boolean;
  itemCount: number;
  uniqueItemCount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  hasGiftItems: boolean;
  hasFreeShipping: boolean;
  isReservationExpired: boolean;
}

// ============================================================================
// Entity
// ============================================================================

export class ShoppingCart extends AggregateRoot {
  private constructor(private props: ShoppingCartProps) {
    super();
  }

  private static validateOwnership(
    userId: CartOwnerId | null,
    guestToken: GuestToken | null,
  ): void {
    if (userId && guestToken) {
      throw new DomainValidationError(
        "Cart cannot belong to both user and guest",
      );
    }
    if (!userId && !guestToken) {
      throw new DomainValidationError(
        "Cart must belong to either user or guest",
      );
    }
  }

  static create(params: CreateShoppingCartData): ShoppingCart {
    if (params.userId) {
      return ShoppingCart.createForUser(params as CreateShoppingCartData & { userId: string });
    }
    return ShoppingCart.createForGuest(params as CreateShoppingCartData & { guestToken: string });
  }

  static createForUser(
    data: CreateShoppingCartData & { userId: string },
  ): ShoppingCart {
    const userId = CartOwnerId.fromString(data.userId);
    ShoppingCart.validateOwnership(userId, null);
    const cartId = CartId.create();
    const now = new Date();

    const cart = new ShoppingCart({
      cartId,
      userId,
      guestToken: null,
      currency: Currency.fromString(data.currency),
      items: [],
      reservationExpiresAt: data.reservationExpiresAt || null,
      ...DEFAULT_CHECKOUT_FIELDS,
      createdAt: now,
      updatedAt: now,
    });

    cart.addDomainEvent(
      new CartCreatedEvent(cartId.getValue(), data.currency, false),
    );
    return cart;
  }

  static createForGuest(
    data: CreateShoppingCartData & { guestToken: string },
  ): ShoppingCart {
    const guestToken = GuestToken.fromString(data.guestToken);
    ShoppingCart.validateOwnership(null, guestToken);
    const cartId = CartId.create();
    const now = new Date();

    const cart = new ShoppingCart({
      cartId,
      userId: null,
      guestToken,
      currency: Currency.fromString(data.currency),
      items: [],
      reservationExpiresAt: data.reservationExpiresAt || null,
      ...DEFAULT_CHECKOUT_FIELDS,
      createdAt: now,
      updatedAt: now,
    });

    cart.addDomainEvent(
      new CartCreatedEvent(cartId.getValue(), data.currency, true),
    );
    return cart;
  }

  static fromPersistence(data: ShoppingCartEntityData): ShoppingCart {
    return new ShoppingCart({
      cartId: CartId.fromString(data.cartId),
      userId: data.userId ? CartOwnerId.fromString(data.userId) : null,
      guestToken: data.guestToken
        ? GuestToken.fromString(data.guestToken)
        : null,
      currency: Currency.fromString(data.currency),
      items: data.items.map((itemData) => CartItem.fromPersistence(itemData)),
      reservationExpiresAt: data.reservationExpiresAt || null,
      // Pre-checkout fields default to null/false on hydration so older rows
      // without these columns still rehydrate cleanly.
      email: data.email ?? null,
      shippingMethod: data.shippingMethod ?? null,
      shippingOption: data.shippingOption ?? null,
      isGift: data.isGift ?? false,
      shippingFirstName: data.shippingFirstName ?? null,
      shippingLastName: data.shippingLastName ?? null,
      shippingAddress1: data.shippingAddress1 ?? null,
      shippingAddress2: data.shippingAddress2 ?? null,
      shippingCity: data.shippingCity ?? null,
      shippingProvince: data.shippingProvince ?? null,
      shippingPostalCode: data.shippingPostalCode ?? null,
      shippingCountryCode: data.shippingCountryCode ?? null,
      shippingPhone: data.shippingPhone ?? null,
      billingFirstName: data.billingFirstName ?? null,
      billingLastName: data.billingLastName ?? null,
      billingAddress1: data.billingAddress1 ?? null,
      billingAddress2: data.billingAddress2 ?? null,
      billingCity: data.billingCity ?? null,
      billingProvince: data.billingProvince ?? null,
      billingPostalCode: data.billingPostalCode ?? null,
      billingCountryCode: data.billingCountryCode ?? null,
      billingPhone: data.billingPhone ?? null,
      sameAddressForBilling: data.sameAddressForBilling ?? true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  // Getters
  get cartId(): CartId {
    return this.props.cartId;
  }

  get cartOwnerId(): CartOwnerId | null {
    return this.props.userId;
  }

  get guestToken(): GuestToken | null {
    return this.props.guestToken;
  }

  get currency(): Currency {
    return this.props.currency;
  }

  get items(): CartItem[] {
    return [...this.props.items];
  }

  get reservationExpiresAt(): Date | null {
    return this.props.reservationExpiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Cart type identification
  get isUserCart(): boolean {
    return this.props.userId !== null;
  }

  get isGuestCart(): boolean {
    return this.props.guestToken !== null;
  }

  // Cart state
  get isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  get itemCount(): number {
    return this.props.items.reduce(
      (total, item) => total + item.quantity.getValue(),
      0,
    );
  }

  get uniqueItemCount(): number {
    return this.props.items.length;
  }

  // Item management
  addItem(itemData: Omit<CreateCartItemData, "cartId">): void {
    const existingItem = this.findItemByVariantId(itemData.variantId);

    if (existingItem) {
      const newQuantity = existingItem.quantity.getValue() + itemData.quantity;
      existingItem.updateQuantity(newQuantity);
      this.addDomainEvent(
        new CartItemQuantityChangedEvent(
          this.props.cartId.getValue(),
          existingItem.id,
          itemData.variantId,
          newQuantity,
        ),
      );
    } else {
      const newItem = CartItem.create({
        ...itemData,
        cartId: this.props.cartId.getValue(),
      });
      this.props.items.push(newItem);
    }

    this.addDomainEvent(
      new CartItemAddedEvent(
        this.props.cartId.getValue(),
        itemData.variantId,
        itemData.quantity,
      ),
    );
    this.touch();
  }

  updateItemQuantity(variantId: string, quantity: number): void {
    const item = this.findItemByVariantId(variantId);
    if (!item) throw new CartItemNotFoundError(variantId);

    if (quantity <= 0) {
      this.removeItem(variantId);
    } else {
      item.updateQuantity(quantity);
      this.addDomainEvent(
        new CartItemQuantityChangedEvent(
          this.props.cartId.getValue(),
          item.id,
          variantId,
          quantity,
        ),
      );
      this.touch();
    }
  }

  removeItem(variantId: string): void {
    const itemIndex = this.props.items.findIndex(
      (item) => item.variantId.getValue() === variantId,
    );

    if (itemIndex === -1) throw new CartItemNotFoundError(variantId);

    this.props.items.splice(itemIndex, 1);
    this.addDomainEvent(
      new CartItemRemovedEvent(this.props.cartId.getValue(), variantId),
    );
    this.touch();
  }

  clearItems(): void {
    this.props.items = [];
    this.addDomainEvent(new CartClearedEvent(this.props.cartId.getValue()));
    this.touch();
  }

  // Item lookup
  findItemByVariantId(variantId: string): CartItem | undefined {
    return this.props.items.find(
      (item) => item.variantId.getValue() === variantId,
    );
  }

  hasItem(variantId: string): boolean {
    return this.findItemByVariantId(variantId) !== undefined;
  }

  // Price calculations
  get subtotal(): number {
    return this.props.items.reduce((total, item) => total + item.subtotal, 0);
  }

  get totalDiscount(): number {
    return this.props.items.reduce(
      (total, item) => total + item.discountAmount,
      0,
    );
  }

  get total(): number {
    return this.props.items.reduce((total, item) => total + item.totalPrice, 0);
  }

  // Shipping
  get hasFreeShipping(): boolean {
    return this.props.items.some((item) => item.hasFreeShipping);
  }

  get itemsRequiringShipping(): CartItem[] {
    return this.props.items.filter((item) => !item.hasFreeShipping);
  }

  // Gift
  get giftItems(): CartItem[] {
    return this.props.items.filter((item) => item.isGift);
  }

  get hasGiftItems(): boolean {
    return this.giftItems.length > 0;
  }

  // Currency management
  updateCurrency(newCurrency: string): void {
    this.props.currency = Currency.fromString(newCurrency);
    this.touch();
  }

  // ── Pre-checkout fields (read) ─────────────────────────────────────

  get email(): string | null { return this.props.email; }
  get shippingMethod(): string | null { return this.props.shippingMethod; }
  get shippingOption(): string | null { return this.props.shippingOption; }
  get isGiftCart(): boolean { return this.props.isGift; }
  get sameAddressForBilling(): boolean { return this.props.sameAddressForBilling; }
  get shippingFirstName(): string | null { return this.props.shippingFirstName; }
  get shippingLastName(): string | null { return this.props.shippingLastName; }
  get shippingAddress1(): string | null { return this.props.shippingAddress1; }
  get shippingAddress2(): string | null { return this.props.shippingAddress2; }
  get shippingCity(): string | null { return this.props.shippingCity; }
  get shippingProvince(): string | null { return this.props.shippingProvince; }
  get shippingPostalCode(): string | null { return this.props.shippingPostalCode; }
  get shippingCountryCode(): string | null { return this.props.shippingCountryCode; }
  get shippingPhone(): string | null { return this.props.shippingPhone; }
  get billingFirstName(): string | null { return this.props.billingFirstName; }
  get billingLastName(): string | null { return this.props.billingLastName; }
  get billingAddress1(): string | null { return this.props.billingAddress1; }
  get billingAddress2(): string | null { return this.props.billingAddress2; }
  get billingCity(): string | null { return this.props.billingCity; }
  get billingProvince(): string | null { return this.props.billingProvince; }
  get billingPostalCode(): string | null { return this.props.billingPostalCode; }
  get billingCountryCode(): string | null { return this.props.billingCountryCode; }
  get billingPhone(): string | null { return this.props.billingPhone; }

  // ── Pre-checkout fields (mutate) ───────────────────────────────────

  // Aggregate-method API for pre-checkout fields. Mutations flow through
  // these methods (rather than via direct repository updates) so the root
  // can emit `Cart*UpdatedEvent` and bump `updatedAt`. Persistence is by
  // `ICartRepository.save(cart)`.
  updateEmail(email: string): void {
    this.props.email = email;
    this.addDomainEvent(
      new CartEmailUpdatedEvent(this.props.cartId.getValue(), email),
    );
    this.touch();
  }

  updateShippingInfo(data: UpdateShippingInfoData): void {
    if (data.shippingMethod !== undefined) {
      this.props.shippingMethod = data.shippingMethod;
    }
    if (data.shippingOption !== undefined) {
      this.props.shippingOption = data.shippingOption;
    }
    if (data.isGift !== undefined) {
      this.props.isGift = data.isGift;
    }
    this.addDomainEvent(
      new CartShippingInfoUpdatedEvent(this.props.cartId.getValue()),
    );
    this.touch();
  }

  // Patch-style update: only fields present on `data` are written. `null`
  // is a valid clear value for any string field; `undefined` skips it.
  updateAddresses(data: UpdateCartAddressesData): void {
    const set = <K extends keyof UpdateCartAddressesData>(
      key: K,
      value: UpdateCartAddressesData[K],
    ): void => {
      if (value === undefined) return;
      // Type assertion: UpdateCartAddressesData and CartCheckoutFields share
      // identical field shapes for these keys.
      (this.props as unknown as Record<string, unknown>)[key as string] = value;
    };
    set("shippingFirstName", data.shippingFirstName);
    set("shippingLastName", data.shippingLastName);
    set("shippingAddress1", data.shippingAddress1);
    set("shippingAddress2", data.shippingAddress2);
    set("shippingCity", data.shippingCity);
    set("shippingProvince", data.shippingProvince);
    set("shippingPostalCode", data.shippingPostalCode);
    set("shippingCountryCode", data.shippingCountryCode);
    set("shippingPhone", data.shippingPhone);
    set("billingFirstName", data.billingFirstName);
    set("billingLastName", data.billingLastName);
    set("billingAddress1", data.billingAddress1);
    set("billingAddress2", data.billingAddress2);
    set("billingCity", data.billingCity);
    set("billingProvince", data.billingProvince);
    set("billingPostalCode", data.billingPostalCode);
    set("billingCountryCode", data.billingCountryCode);
    set("billingPhone", data.billingPhone);
    if (data.sameAddressForBilling !== undefined) {
      this.props.sameAddressForBilling = data.sameAddressForBilling;
    }
    this.addDomainEvent(
      new CartAddressesUpdatedEvent(this.props.cartId.getValue()),
    );
    this.touch();
  }

  // Reservation management
  updateReservationExpiry(expiresAt: Date | null): void {
    this.props.reservationExpiresAt = expiresAt;
    this.touch();
  }

  get isReservationExpired(): boolean {
    if (!this.props.reservationExpiresAt) return false;
    return new Date() > this.props.reservationExpiresAt;
  }

  extendReservation(
    hours: number = CART_RESERVATION_DEFAULT_EXTENSION_HOURS,
  ): void {
    this.props.reservationExpiresAt = new Date(
      new Date().getTime() + hours * 60 * 60 * 1000,
    );
    this.touch();
  }

  // Cart ownership transfer (guest to user)
  transferToUser(userId: string): ShoppingCart {
    if (this.isUserCart) {
      throw new InvalidOperationError(
        "Cannot transfer user cart to another user",
      );
    }

    const newCartOwnerId = CartOwnerId.fromString(userId);
    const transferredCart = new ShoppingCart({
      ...this.props,
      userId: newCartOwnerId,
      guestToken: null,
      updatedAt: new Date(),
    });

    transferredCart.addDomainEvent(
      new CartTransferredToUserEvent(this.props.cartId.getValue(), userId),
    );

    return transferredCart;
  }

  // Merge carts (guest-to-user)
  mergeWith(otherCart: ShoppingCart): void {
    if (!this.isUserCart) {
      throw new InvalidOperationError("Can only merge into user cart");
    }

    for (const otherItem of otherCart.props.items) {
      const existingItem = this.findItemByVariantId(
        otherItem.variantId.getValue(),
      );

      if (existingItem) {
        const combinedQuantity =
          existingItem.quantity.getValue() + otherItem.quantity.getValue();
        existingItem.updateQuantity(combinedQuantity);
        this.addDomainEvent(
          new CartItemQuantityChangedEvent(
            this.props.cartId.getValue(),
            existingItem.id,
            otherItem.variantId.getValue(),
            combinedQuantity,
          ),
        );
      } else {
        const newItem = CartItem.create({
          cartId: this.props.cartId.getValue(),
          variantId: otherItem.variantId.getValue(),
          quantity: otherItem.quantity.getValue(),
          unitPrice: otherItem.unitPrice,
          appliedPromos: otherItem.appliedPromos.getValue(),
          isGift: otherItem.isGift,
          giftMessage: otherItem.giftMessage,
        });
        this.props.items.push(newItem);
      }
    }

    this.touch();
  }

  equals(other: ShoppingCart): boolean {
    return this.props.cartId.equals(other.props.cartId);
  }

  toSnapshot(): ShoppingCartEntityData {
    return {
      cartId: this.props.cartId.getValue(),
      userId: this.props.userId?.getValue(),
      guestToken: this.props.guestToken?.getValue(),
      currency: this.props.currency.getValue(),
      reservationExpiresAt: this.props.reservationExpiresAt || undefined,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      items: this.props.items.map((item) => item.toSnapshot()),
      // Pre-checkout fields — repository persists what's on the snapshot.
      email: this.props.email,
      shippingMethod: this.props.shippingMethod,
      shippingOption: this.props.shippingOption,
      isGift: this.props.isGift,
      shippingFirstName: this.props.shippingFirstName,
      shippingLastName: this.props.shippingLastName,
      shippingAddress1: this.props.shippingAddress1,
      shippingAddress2: this.props.shippingAddress2,
      shippingCity: this.props.shippingCity,
      shippingProvince: this.props.shippingProvince,
      shippingPostalCode: this.props.shippingPostalCode,
      shippingCountryCode: this.props.shippingCountryCode,
      shippingPhone: this.props.shippingPhone,
      billingFirstName: this.props.billingFirstName,
      billingLastName: this.props.billingLastName,
      billingAddress1: this.props.billingAddress1,
      billingAddress2: this.props.billingAddress2,
      billingCity: this.props.billingCity,
      billingProvince: this.props.billingProvince,
      billingPostalCode: this.props.billingPostalCode,
      billingCountryCode: this.props.billingCountryCode,
      billingPhone: this.props.billingPhone,
      sameAddressForBilling: this.props.sameAddressForBilling,
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  static toDTO(cart: ShoppingCart): ShoppingCartDTO {
    return {
      cartId: cart.props.cartId.getValue(),
      userId: cart.props.userId?.getValue(),
      guestToken: cart.props.guestToken?.getValue(),
      currency: cart.props.currency.getValue(),
      items: cart.props.items.map((item) => CartItem.toDTO(item)),
      reservationExpiresAt: cart.props.reservationExpiresAt?.toISOString(),
      createdAt: cart.props.createdAt.toISOString(),
      updatedAt: cart.props.updatedAt.toISOString(),
      isUserCart: cart.isUserCart,
      isGuestCart: cart.isGuestCart,
      isEmpty: cart.isEmpty,
      itemCount: cart.itemCount,
      uniqueItemCount: cart.uniqueItemCount,
      subtotal: cart.subtotal,
      totalDiscount: cart.totalDiscount,
      total: cart.total,
      hasGiftItems: cart.hasGiftItems,
      hasFreeShipping: cart.hasFreeShipping,
      isReservationExpired: cart.isReservationExpired,
    };
  }
}

// ============================================================================
// Supporting Input Types
// ============================================================================

export interface CreateShoppingCartData {
  userId?: string;
  guestToken?: string;
  currency: string;
  reservationExpiresAt?: Date;
}

export interface ShoppingCartEntityData {
  cartId: string;
  userId?: string;
  guestToken?: string;
  currency: string;
  reservationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  items: CartItemEntityData[];
  email?: string | null;
  shippingMethod?: string | null;
  shippingOption?: string | null;
  isGift?: boolean;
  shippingFirstName?: string | null;
  shippingLastName?: string | null;
  shippingAddress1?: string | null;
  shippingAddress2?: string | null;
  shippingCity?: string | null;
  shippingProvince?: string | null;
  shippingPostalCode?: string | null;
  shippingCountryCode?: string | null;
  shippingPhone?: string | null;
  billingFirstName?: string | null;
  billingLastName?: string | null;
  billingAddress1?: string | null;
  billingAddress2?: string | null;
  billingCity?: string | null;
  billingProvince?: string | null;
  billingPostalCode?: string | null;
  billingCountryCode?: string | null;
  billingPhone?: string | null;
  sameAddressForBilling?: boolean;
}
