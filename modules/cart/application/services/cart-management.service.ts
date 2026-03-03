import { CartRepository } from "../../domain/repositories/cart.repository";
import { ReservationRepository } from "../../domain/repositories/reservation.repository";
import { CheckoutRepository } from "../../domain/repositories/checkout.repository";
import {
  ShoppingCart,
  CreateShoppingCartData,
} from "../../domain/entities/shopping-cart.entity";
import {
  CartItem,
  CreateCartItemData,
} from "../../domain/entities/cart-item.entity";
import { CartId } from "../../domain/value-objects/cart-id.vo";
import { UserId } from "../../../user-management/domain/value-objects/user-id.vo";
import { GuestToken } from "../../domain/value-objects/guest-token.vo";
import { VariantId } from "../../domain/value-objects/variant-id.vo";
import { PromoData } from "../../domain/value-objects/applied-promos.vo";
import { IProductVariantRepository } from "../../../product-catalog/domain/repositories/product-variant.repository";
import { VariantId as ProductVariantId } from "../../../product-catalog/domain/value-objects/variant-id.vo";
import { IProductRepository } from "../../../product-catalog/domain/repositories/product.repository";
import { IProductMediaRepository } from "../../../product-catalog/domain/repositories/product-media.repository";
import { IMediaAssetRepository } from "../../../product-catalog/domain/repositories/media-asset.repository";
import { ProductId } from "../../../product-catalog/domain/value-objects/product-id.vo";
import { MediaAssetId } from "../../../product-catalog/domain/entities/media-asset.entity";
import { SettingsService } from "../../../admin/application/services/settings.service";
import {
  RESERVATION_DEFAULT_DURATION_MINUTES,
  DEFAULT_CURRENCY,
} from "../../domain/constants";

// DTOs for service operations
export interface CreateCartDto {
  userId?: string;
  guestToken?: string;
  currency: string;
  reservationDurationMinutes?: number;
}

export interface AddToCartDto {
  cartId?: string;
  userId?: string;
  guestToken?: string;
  variantId: string;
  quantity: number;
  appliedPromos?: PromoData[];
  isGift?: boolean;
  giftMessage?: string;
}

export interface UpdateCartItemDto {
  cartId: string;
  variantId: string;
  quantity: number;
  userId?: string;
  guestToken?: string;
}

export interface RemoveFromCartDto {
  cartId: string;
  variantId: string;
  userId?: string;
  guestToken?: string;
}

export interface TransferCartDto {
  guestToken: string;
  userId: string;
  mergeWithExisting?: boolean;
}

export interface CartSummaryDto {
  cartId: string;
  isUserCart: boolean;
  isGuestCart: boolean;
  currency: string;
  itemCount: number;
  uniqueItemCount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  shippingAmount?: number;
  hasGiftItems: boolean;
  hasFreeShipping: boolean;
  isEmpty: boolean;
  isReservationExpired: boolean;
  reservationExpiresAt?: Date;
  updatedAt: Date;
}

export interface CartItemDto {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  appliedPromos: PromoData[];
  isGift: boolean;
  giftMessage?: string;
  hasPromosApplied: boolean;
  hasFreeShipping: boolean;
  // Product details
  product?: {
    productId: string;
    title: string;
    slug: string;
    images: Array<{ url: string; alt?: string }>;
  };
  // Variant details
  variant?: {
    size: string | null;
    color: string | null;
    sku: string;
  };
}

export interface CartDto {
  cartId: string;
  userId?: string;
  guestToken?: string;
  currency: string;
  items: CartItemDto[];
  summary: CartSummaryDto;
  reservationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Checkout fields
  email?: string;
  shippingMethod?: string;
  shippingOption?: string;
  isGift?: boolean;
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

export class CartManagementService {
  constructor(
    private readonly cartRepository: CartRepository,
    private readonly reservationRepository: ReservationRepository,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly productVariantRepository: IProductVariantRepository,
    private readonly productRepository: IProductRepository,
    private readonly productMediaRepository: IProductMediaRepository,
    private readonly mediaAssetRepository: IMediaAssetRepository,
    private readonly settingsService: SettingsService,
  ) {}

  // Cart creation
  async createUserCart(
    dto: CreateCartDto & { userId: string },
  ): Promise<CartDto> {
    // Check if user already has an active cart
    const existingCart = await this.cartRepository.findActiveCartByUserId(
      UserId.fromString(dto.userId),
    );

    if (existingCart) {
      // Update existing cart with new reservation settings if provided
      if (dto.reservationDurationMinutes) {
        const newExpiryTime = new Date(
          Date.now() + dto.reservationDurationMinutes * 60 * 1000,
        );
        existingCart.updateReservationExpiry(newExpiryTime);
        await this.cartRepository.update(existingCart);
      }

      return await this.mapCartToDto(existingCart);
    }

    // Create new cart
    const cartData: CreateShoppingCartData & { userId: string } = {
      userId: dto.userId,
      currency: dto.currency,
      reservationExpiresAt: new Date(
        Date.now() +
          (dto.reservationDurationMinutes || RESERVATION_DEFAULT_DURATION_MINUTES) * 60 * 1000,
      ), // Always create with reservation expiry
    };

    const cart = ShoppingCart.createForUser(cartData);

    await this.cartRepository.save(cart);

    return await this.mapCartToDto(cart);
  }

  async createGuestCart(
    dto: CreateCartDto & { guestToken: string },
  ): Promise<CartDto> {
    // Check if a cart already exists for this guest token (active or not)
    const existingCart = await this.cartRepository.findByGuestToken(
      GuestToken.fromString(dto.guestToken),
    );

    if (existingCart) {
      // CRITICAL: Check if this cart has a completed checkout
      // If so, don't reuse it - create a fresh cart instead
      const existingCheckout = await this.checkoutRepository.findByCartId(
        existingCart.getCartId(),
      );

      if (!existingCheckout || !existingCheckout.isCompleted()) {
        // Safe to reuse - update reservation expiry and return existing cart
        const newExpiryTime = new Date(
          Date.now() +
            (dto.reservationDurationMinutes || RESERVATION_DEFAULT_DURATION_MINUTES) * 60 * 1000,
        );
        existingCart.updateReservationExpiry(newExpiryTime);
        await this.cartRepository.update(existingCart);

        return await this.mapCartToDto(existingCart);
      }
    }

    // Create new guest cart
    const cartData: CreateShoppingCartData & { guestToken: string } = {
      guestToken: dto.guestToken,
      currency: dto.currency,
      reservationExpiresAt: new Date(
        Date.now() +
          (dto.reservationDurationMinutes || RESERVATION_DEFAULT_DURATION_MINUTES) * 60 * 1000,
      ), // Always create with reservation expiry
    };

    const cart = ShoppingCart.createForGuest(cartData);

    await this.cartRepository.save(cart);

    return await this.mapCartToDto(cart);
  }

  // Cart retrieval
  async getCart(
    cartId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CartDto | null> {
    const cart = await this.cartRepository.findById(CartId.fromString(cartId));

    if (!cart) {
      return null;
    }

    // Validate ownership
    this.validateCartOwnership(cart, userId, guestToken);

    // Refresh reservations (Lazy Renewal)
    await this.refreshCartReservations(cart);

    return await this.mapCartToDto(cart);
  }

  async getActiveCartByUser(userId: string): Promise<CartDto | null> {
    const cart = await this.cartRepository.findActiveCartByUserId(
      UserId.fromString(userId),
    );

    if (cart) {
      await this.refreshCartReservations(cart);
      return await this.mapCartToDto(cart);
    }
    return null;
  }

  async getActiveCartByGuestToken(guestToken: string): Promise<CartDto | null> {
    const cart = await this.cartRepository.findActiveCartByGuestToken(
      GuestToken.fromString(guestToken),
    );

    if (cart) {
      await this.refreshCartReservations(cart);
      return await this.mapCartToDto(cart);
    }
    return null;
  }

  // Item management
  async addToCart(dto: AddToCartDto): Promise<CartDto> {
    let cart: ShoppingCart | null = null;

    // Fetch product variant
    const productVariant = await this.productVariantRepository.findById(
      ProductVariantId.fromString(dto.variantId),
    );

    if (!productVariant) {
      throw new Error("Product variant not found");
    }

    // Get the unit price from the product (price is now at product level)
    const product = await this.productRepository.findById(
      ProductId.fromString(productVariant.getProductId().getValue()),
    );

    if (!product) {
      throw new Error("Product not found");
    }

    const unitPrice = product.getPrice().getValue();

    // Find or create cart
    if (dto.cartId) {
      cart = await this.cartRepository.findById(CartId.fromString(dto.cartId));
      if (!cart) {
        throw new Error("Cart not found");
      }

      // CRITICAL: Check if this cart has a completed checkout
      // If so, we should NOT add items to it - create a new cart instead
      const existingCheckout = await this.checkoutRepository.findByCartId(
        CartId.fromString(dto.cartId),
      );
      if (existingCheckout && existingCheckout.isCompleted()) {
        // Cart has a completed order - create a new cart instead
        if (dto.guestToken) {
          const newCartDto = await this.createGuestCart({
            guestToken: dto.guestToken,
            currency: cart.getCurrency().toString(),
          });
          cart = await this.cartRepository.findById(
            CartId.fromString(newCartDto.cartId),
          );
        } else if (dto.userId) {
          const newCartDto = await this.createUserCart({
            userId: dto.userId,
            currency: cart.getCurrency().toString(),
          });
          cart = await this.cartRepository.findById(
            CartId.fromString(newCartDto.cartId),
          );
        } else {
          throw new Error("Cannot add items to a cart with a completed order");
        }
      }
    } else if (dto.userId) {
      cart = await this.cartRepository.findActiveCartByUserId(
        UserId.fromString(dto.userId),
      );
      if (!cart) {
        // Create new user cart
        const newCartDto = await this.createUserCart({
          userId: dto.userId,
          currency: DEFAULT_CURRENCY,
        });
        cart = await this.cartRepository.findById(
          CartId.fromString(newCartDto.cartId),
        );
      }
    } else if (dto.guestToken) {
      cart = await this.cartRepository.findActiveCartByGuestToken(
        GuestToken.fromString(dto.guestToken),
      );
      if (!cart) {
        // Create new guest cart
        const newCartDto = await this.createGuestCart({
          guestToken: dto.guestToken,
          currency: DEFAULT_CURRENCY,
        });
        cart = await this.cartRepository.findById(
          CartId.fromString(newCartDto.cartId),
        );
      }
    }

    if (!cart) {
      throw new Error("Unable to find or create cart");
    }

    // Validate ownership
    this.validateCartOwnership(cart, dto.userId, dto.guestToken);

    // Check if reservation already exists for this cart+variant
    const existingReservation =
      await this.reservationRepository.findByCartAndVariant(
        cart.getCartId(),
        VariantId.fromString(dto.variantId),
      );

    if (existingReservation) {
      // Update existing reservation quantity if needed
      const currentReservedQty = existingReservation.getQuantity().getValue();
      const existingCartItem = cart.findItemByVariantId(dto.variantId);
      const currentCartQty = existingCartItem
        ? existingCartItem.getQuantity().getValue()
        : 0;
      const newTotalQty = currentCartQty + dto.quantity;

      if (newTotalQty > currentReservedQty) {
        // Need to reserve additional quantity
        await this.reservationRepository.adjustReservation(
          cart.getCartId(),
          VariantId.fromString(dto.variantId),
          newTotalQty,
        );
      }
    } else {
      // Create new reservation
      await this.reservationRepository.reserveInventory(
        cart.getCartId(),
        VariantId.fromString(dto.variantId),
        dto.quantity,
      );
    }

    // Add item to cart with the fetched unit price
    const itemData: Omit<CreateCartItemData, "cartId"> = {
      variantId: dto.variantId,
      quantity: dto.quantity,
      unitPrice: unitPrice,
      appliedPromos: dto.appliedPromos,
      isGift: dto.isGift,
      giftMessage: dto.giftMessage,
    };

    cart.addItem(itemData);
    await this.cartRepository.update(cart);

    return await this.mapCartToDto(cart);
  }

  async updateCartItem(dto: UpdateCartItemDto): Promise<CartDto> {
    const cart = await this.cartRepository.findById(
      CartId.fromString(dto.cartId),
    );

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Validate ownership
    this.validateCartOwnership(cart, dto.userId, dto.guestToken);

    // Update reservation if exists
    const reservation = await this.reservationRepository.findByCartAndVariant(
      cart.getCartId(),
      VariantId.fromString(dto.variantId),
    );

    if (reservation) {
      if (dto.quantity > 0) {
        reservation.updateQuantity(dto.quantity);
        await this.reservationRepository.update(reservation);
      } else {
        await this.reservationRepository.delete(reservation.getReservationId());
      }
    }

    // Update cart item
    cart.updateItemQuantity(dto.variantId, dto.quantity);
    await this.cartRepository.update(cart);

    return await this.mapCartToDto(cart);
  }

  async removeFromCart(dto: RemoveFromCartDto): Promise<CartDto> {
    const cart = await this.cartRepository.findById(
      CartId.fromString(dto.cartId),
    );

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Validate ownership
    this.validateCartOwnership(cart, dto.userId, dto.guestToken);

    // Remove reservation if exists
    await this.reservationRepository.deleteByCartAndVariant(
      cart.getCartId(),
      VariantId.fromString(dto.variantId),
    );

    // Remove from cart
    cart.removeItem(dto.variantId);
    await this.cartRepository.update(cart);

    return await this.mapCartToDto(cart);
  }

  async clearCart(
    cartId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CartDto> {
    const cart = await this.cartRepository.findById(CartId.fromString(cartId));

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Validate ownership
    this.validateCartOwnership(cart, userId, guestToken);

    // Clear all reservations for this cart
    await this.reservationRepository.deleteByCartId(cart.getCartId());

    // Clear cart items
    cart.clearItems();
    await this.cartRepository.update(cart);

    return await this.mapCartToDto(cart);
  }

  // Cart transfer and merging
  async transferGuestCartToUser(dto: TransferCartDto): Promise<CartDto> {
    const guestCart = await this.cartRepository.findActiveCartByGuestToken(
      GuestToken.fromString(dto.guestToken),
    );

    if (!guestCart) {
      throw new Error("Guest cart not found");
    }

    if (dto.mergeWithExisting) {
      // Check if user has existing cart
      const userCart = await this.cartRepository.findActiveCartByUserId(
        UserId.fromString(dto.userId),
      );

      if (userCart) {
        // Merge guest cart into user cart
        userCart.mergeWith(guestCart);
        await this.cartRepository.update(userCart);

        // Transfer reservations
        const guestReservations =
          await this.reservationRepository.findActiveByCartId(
            guestCart.getCartId(),
          );
        for (const reservation of guestReservations) {
          // Create new reservations for user cart
          await this.reservationRepository.createReservation(
            userCart.getCartId(),
            reservation.getVariantId(),
            reservation.getQuantity(),
          );
        }

        // Delete guest cart and its reservations
        await this.reservationRepository.deleteByCartId(guestCart.getCartId());
        await this.cartRepository.delete(guestCart.getCartId());

        await this.refreshCartReservations(userCart);
        return await this.mapCartToDto(userCart);
      }
    }

    // Transfer ownership of guest cart to user
    const transferredCart = guestCart.transferToUser(dto.userId);
    await this.cartRepository.update(transferredCart);

    await this.refreshCartReservations(transferredCart);
    return await this.mapCartToDto(transferredCart);
  }

  private async refreshCartReservations(cart: ShoppingCart): Promise<void> {
    try {
      const items = cart.getItems();

      for (const item of items) {
        const quantity = item.getQuantity().getValue();

        // Find existing reservation (even if expired, as repo method might return it depending on implementation)
        // Usually findByCartAndVariant returns null if expired or doesn't exist?
        // Let's assume we need to check if we have a VALID ACTIVE reservation.

        const existingReservation =
          await this.reservationRepository.findByCartAndVariant(
            cart.getCartId(),
            item.getVariantId(),
          );

        let needsRenewal = false;

        if (!existingReservation) {
          needsRenewal = true;
        } else if (existingReservation.isExpired()) {
          needsRenewal = true;
        } else if (existingReservation.getQuantity().getValue() < quantity) {
          // If reserved less than cart quantity (e.g. partial expiry or update), renew/adjust
          needsRenewal = true;
        }

        if (needsRenewal) {
          try {
            await this.reservationRepository.reserveInventory(
              cart.getCartId(),
              item.getVariantId(),
              quantity,
            );
          } catch (err) {
            // Stock unavailable — swallow so cart view is not broken.
            // Checkout will correctly reject the item later.
          }
        }
      }
    } catch (error) {
      // Don't fail getCart if refresh fails
    }
  }

  // Utility methods
  private validateCartOwnership(
    cart: ShoppingCart,
    userId?: string,
    guestToken?: string,
  ): void {
    const cartUserId = cart.getUserId()?.getValue();
    const cartGuestToken = cart.getGuestToken()?.getValue();

    if (cartUserId) {
      if (!userId || cartUserId !== userId) {
        throw new Error("Unauthorized: Cart does not belong to user");
      }
    } else if (cartGuestToken) {
      if (!guestToken || cartGuestToken !== guestToken) {
        throw new Error("Unauthorized: Cart does not belong to guest");
      }
    } else {
      throw new Error("Unauthorized: Cart has no owner");
    }
  }

  private async mapCartToDto(cart: ShoppingCart): Promise<CartDto> {
    const summary = cart.getSummary();

    // Map all cart items with product details
    const items = await Promise.all(
      cart.getItems().map((item) => this.mapCartItemToDto(item)),
    );

    // Fetch checkout fields from database (they're not in the domain entity)
    const cartWithCheckoutInfo =
      await this.cartRepository.getCartWithCheckoutInfo(
        cart.getCartId().getValue(),
      );

    // Calculate shipping
    const shippingCost = await this.calculateShippingCost(
      cartWithCheckoutInfo?.shippingMethod,
      cartWithCheckoutInfo?.shippingOption,
    );

    // Update total with shipping
    // Note: cart.getSummary().total only includes item prices
    const summaryWithShipping = {
      ...summary,
      total: summary.total + shippingCost,
      shippingAmount: shippingCost,
    };

    return {
      cartId: cart.getCartId().getValue(),
      userId: cart.getUserId()?.getValue(),
      guestToken: cart.getGuestToken()?.getValue(),
      currency: cart.getCurrency().getValue(),
      items,
      summary: summaryWithShipping as CartSummaryDto,
      reservationExpiresAt: cart.getReservationExpiresAt() || undefined,
      createdAt: cart.getCreatedAt(),
      updatedAt: cart.getUpdatedAt(),

      // Checkout fields from database
      email: cartWithCheckoutInfo?.email || undefined,
      shippingMethod: cartWithCheckoutInfo?.shippingMethod || undefined,
      shippingOption: cartWithCheckoutInfo?.shippingOption || undefined,
      isGift: cartWithCheckoutInfo?.isGift || undefined,
      shippingFirstName: cartWithCheckoutInfo?.shippingFirstName || undefined,
      shippingLastName: cartWithCheckoutInfo?.shippingLastName || undefined,
      shippingAddress1: cartWithCheckoutInfo?.shippingAddress1 || undefined,
      shippingAddress2: cartWithCheckoutInfo?.shippingAddress2 || undefined,
      shippingCity: cartWithCheckoutInfo?.shippingCity || undefined,
      shippingProvince: cartWithCheckoutInfo?.shippingProvince || undefined,
      shippingPostalCode: cartWithCheckoutInfo?.shippingPostalCode || undefined,
      shippingCountryCode:
        cartWithCheckoutInfo?.shippingCountryCode || undefined,
      shippingPhone: cartWithCheckoutInfo?.shippingPhone || undefined,
      billingFirstName: cartWithCheckoutInfo?.billingFirstName || undefined,
      billingLastName: cartWithCheckoutInfo?.billingLastName || undefined,
      billingAddress1: cartWithCheckoutInfo?.billingAddress1 || undefined,
      billingAddress2: cartWithCheckoutInfo?.billingAddress2 || undefined,
      billingCity: cartWithCheckoutInfo?.billingCity || undefined,
      billingProvince: cartWithCheckoutInfo?.billingProvince || undefined,
      billingPostalCode: cartWithCheckoutInfo?.billingPostalCode || undefined,
      billingCountryCode: cartWithCheckoutInfo?.billingCountryCode || undefined,
      billingPhone: cartWithCheckoutInfo?.billingPhone || undefined,
      sameAddressForBilling:
        cartWithCheckoutInfo?.sameAddressForBilling || undefined,
    };
  }

  private async calculateShippingCost(
    shippingMethod?: string,
    shippingOption?: string,
  ): Promise<number> {
    if (shippingMethod === "home") {
      // Get shipping rates from settings service (dynamic)
      const shippingRates = await this.settingsService.getShippingRates();

      if (shippingOption === "colombo") {
        return shippingRates.colombo;
      } else if (shippingOption === "suburbs") {
        return shippingRates.suburbs;
      }
    }
    return 0.0;
  }

  private async mapCartItemToDto(item: CartItem): Promise<CartItemDto> {
    const variantId = item.getVariantId().getValue();

    // Fetch variant details
    const variant = await this.productVariantRepository.findById(
      ProductVariantId.fromString(variantId),
    );

    let productDetails = undefined;
    let variantDetails = undefined;

    if (variant) {
      // Get variant details
      variantDetails = {
        size: variant.getSize(),
        color: variant.getColor(),
        sku: variant.getSku().getValue(),
      };

      // Fetch product details
      const productId = variant.getProductId();
      const product = await this.productRepository.findById(productId);

      if (product) {
        // Fetch product images
        const productMediaList =
          await this.productMediaRepository.findByProductId(productId, {
            sortBy: "position",
            sortOrder: "asc",
          });

        const images = await Promise.all(
          productMediaList.map(async (media) => {
            // Convert value-objects MediaAssetId to entity MediaAssetId
            const assetId = MediaAssetId.fromString(
              media.getAssetId().getValue(),
            );
            const asset = await this.mediaAssetRepository.findById(assetId);
            return {
              url: asset?.getStorageKey() || "",
              alt: asset?.getAltText() || undefined,
            };
          }),
        );

        productDetails = {
          productId: product.getId().getValue(),
          title: product.getTitle(),
          slug: product.getSlug().getValue(),
          images,
        };
      }
    }

    return {
      id: item.getId(),
      variantId,
      quantity: item.getQuantity().getValue(),
      unitPrice: item.getUnitPrice(),
      subtotal: item.getSubtotal(),
      discountAmount: item.getDiscountAmount(),
      totalPrice: item.getTotalPrice(),
      appliedPromos: item.getAppliedPromos().getValue(),
      isGift: item.isGiftItem(),
      giftMessage: item.getGiftMessage(),
      hasPromosApplied: item.hasPromosApplied(),
      hasFreeShipping: item.hasFreeShipping(),
      product: productDetails,
      variant: variantDetails,
    };
  }

  // Cart cleanup and maintenance
  async cleanupExpiredCarts(): Promise<number> {
    return await this.cartRepository.cleanupExpiredGuestCarts();
  }

  async getCartStatistics(): Promise<{
    totalCarts: number;
    userCarts: number;
    guestCarts: number;
    emptyCarts: number;
    averageItemsPerCart: number;
    averageCartValue: number;
  }> {
    return await this.cartRepository.getCartStatistics();
  }

  // Checkout field updates
  async updateCartEmail(
    cartId: string,
    email: string,
    userId?: string,
    guestToken?: string,
  ): Promise<void> {
    const cart = await this.cartRepository.findById(CartId.fromString(cartId));
    if (!cart) {
      throw new Error("Cart not found");
    }

    this.validateCartOwnership(cart, userId, guestToken);

    await this.cartRepository.updateEmail(CartId.fromString(cartId), email);
  }

  async updateCartShippingInfo(
    cartId: string,
    data: {
      shippingMethod?: string;
      shippingOption?: string;
      isGift?: boolean;
    },
    userId?: string,
    guestToken?: string,
  ): Promise<void> {
    const cart = await this.cartRepository.findById(CartId.fromString(cartId));
    if (!cart) {
      throw new Error("Cart not found");
    }

    this.validateCartOwnership(cart, userId, guestToken);

    await this.cartRepository.updateShippingInfo(
      CartId.fromString(cartId),
      data,
    );
  }

  async updateCartAddresses(
    cartId: string,
    data: {
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
    },
    userId?: string,
    guestToken?: string,
  ): Promise<void> {
    const cart = await this.cartRepository.findById(CartId.fromString(cartId));
    if (!cart) {
      throw new Error("Cart not found");
    }

    this.validateCartOwnership(cart, userId, guestToken);

    await this.cartRepository.updateAddresses(CartId.fromString(cartId), data);
  }

  async getCartWithCheckoutInfo(
    cartId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<
    ReturnType<CartRepository["getCartWithCheckoutInfo"]> extends Promise<
      infer T
    >
      ? T
      : never
  > {
    const cart = await this.cartRepository.findById(CartId.fromString(cartId));
    if (!cart) {
      throw new Error("Cart not found");
    }

    this.validateCartOwnership(cart, userId, guestToken);

    return await this.cartRepository.getCartWithCheckoutInfo(cartId);
  }
}
