import { ICartRepository } from "../../domain/repositories/cart.repository";
import { IReservationRepository } from "../../domain/repositories/reservation.repository";
import { ICheckoutRepository } from "../../domain/repositories/checkout.repository";
import {
  ShoppingCart,
  CreateShoppingCartData,
} from "../../domain/entities/shopping-cart.entity";
import {
  CartItem,
  CreateCartItemData,
} from "../../domain/entities/cart-item.entity";
import { CartId } from "../../domain/value-objects/cart-id.vo";
import { CartOwnerId } from "../../domain/value-objects/cart-owner-id.vo";
import { GuestToken } from "../../domain/value-objects/guest-token.vo";
import { VariantId } from "../../domain/value-objects/variant-id.vo";
import { PromoData } from "../../domain/value-objects/applied-promos.vo";
import {
  IExternalProductVariantRepository,
  IExternalProductRepository,
  IExternalProductMediaRepository,
  IExternalMediaAssetRepository,
  IExternalSettingsService,
} from "../../domain/ports/external-services";
import {
  RESERVATION_DEFAULT_DURATION_MINUTES,
  DEFAULT_CURRENCY,
} from "../../domain/constants";
import {
  DomainValidationError,
  CartNotFoundError,
  CartOwnershipError,
  InvalidCartStateError,
} from "../../domain/errors/cart.errors";

// DTOs for service operations
interface CreateCartDto {
  userId?: string;
  guestToken?: string;
  currency: string;
  reservationDurationMinutes?: number;
}

interface AddToCartDto {
  cartId?: string;
  userId?: string;
  guestToken?: string;
  variantId: string;
  quantity: number;
  appliedPromos?: PromoData[];
  isGift?: boolean;
  giftMessage?: string;
}

interface UpdateCartItemDto {
  cartId: string;
  variantId: string;
  quantity: number;
  userId?: string;
  guestToken?: string;
}

interface RemoveFromCartDto {
  cartId: string;
  variantId: string;
  userId?: string;
  guestToken?: string;
}

interface TransferCartDto {
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

interface CartItemDto {
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
    private readonly cartRepository: ICartRepository,
    private readonly reservationRepository: IReservationRepository,
    private readonly checkoutRepository: ICheckoutRepository,
    private readonly productVariantRepository: IExternalProductVariantRepository,
    private readonly productRepository: IExternalProductRepository,
    private readonly productMediaRepository: IExternalProductMediaRepository,
    private readonly mediaAssetRepository: IExternalMediaAssetRepository,
    private readonly settingsService: IExternalSettingsService,
  ) {}

  // Cart creation
  async createUserCart(
    dto: CreateCartDto & { userId: string },
  ): Promise<CartDto> {
    // Check if user already has an active cart
    const existingCart = await this.cartRepository.findActiveCartByCartOwnerId(
      CartOwnerId.fromString(dto.userId),
    );

    if (existingCart) {
      // Update existing cart with new reservation settings if provided
      if (dto.reservationDurationMinutes) {
        const newExpiryTime = new Date(
          Date.now() + dto.reservationDurationMinutes * 60 * 1000,
        );
        existingCart.updateReservationExpiry(newExpiryTime);
        await this.cartRepository.save(existingCart);
      }

      return await this.mapCartToDto(existingCart);
    }

    // Create new cart
    const cartData: CreateShoppingCartData & { userId: string } = {
      userId: dto.userId,
      currency: dto.currency,
      reservationExpiresAt: new Date(
        Date.now() +
          (dto.reservationDurationMinutes ||
            RESERVATION_DEFAULT_DURATION_MINUTES) *
            60 *
            1000,
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
        existingCart.cartId,
      );

      if (!existingCheckout || !existingCheckout.isCompleted) {
        // Safe to reuse - update reservation expiry and return existing cart
        const newExpiryTime = new Date(
          Date.now() +
            (dto.reservationDurationMinutes ||
              RESERVATION_DEFAULT_DURATION_MINUTES) *
              60 *
              1000,
        );
        existingCart.updateReservationExpiry(newExpiryTime);
        await this.cartRepository.save(existingCart);

        return await this.mapCartToDto(existingCart);
      }
    }

    // Create new guest cart
    const cartData: CreateShoppingCartData & { guestToken: string } = {
      guestToken: dto.guestToken,
      currency: dto.currency,
      reservationExpiresAt: new Date(
        Date.now() +
          (dto.reservationDurationMinutes ||
            RESERVATION_DEFAULT_DURATION_MINUTES) *
            60 *
            1000,
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
    const cart = await this.cartRepository.findActiveCartByCartOwnerId(
      CartOwnerId.fromString(userId),
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
    const productVariant = await this.productVariantRepository.findById({
      getValue: () => dto.variantId,
    });

    if (!productVariant) {
      throw new DomainValidationError("Product variant not found");
    }

    // Get the unit price from the product (price is now at product level)
    const product = await this.productRepository.findById(
      productVariant.getProductId(),
    );

    if (!product) {
      throw new DomainValidationError("Product not found");
    }

    const unitPrice = product.getPrice().getValue();

    // Find or create cart
    if (dto.cartId) {
      cart = await this.cartRepository.findById(CartId.fromString(dto.cartId));
      if (!cart) {
        throw new CartNotFoundError(dto.cartId);
      }

      // CRITICAL: Check if this cart has a completed checkout
      // If so, we should NOT add items to it - create a new cart instead
      const existingCheckout = await this.checkoutRepository.findByCartId(
        CartId.fromString(dto.cartId),
      );
      if (existingCheckout && existingCheckout.isCompleted) {
        // Cart has a completed order - create a new cart instead
        if (dto.guestToken) {
          const newCartDto = await this.createGuestCart({
            guestToken: dto.guestToken,
            currency: cart.currency.getValue(),
          });
          cart = await this.cartRepository.findById(
            CartId.fromString(newCartDto.cartId),
          );
        } else if (dto.userId) {
          const newCartDto = await this.createUserCart({
            userId: dto.userId,
            currency: cart.currency.getValue(),
          });
          cart = await this.cartRepository.findById(
            CartId.fromString(newCartDto.cartId),
          );
        } else {
          throw new InvalidCartStateError(
            "Cannot add items to a cart with a completed order",
          );
        }
      }
    } else if (dto.userId) {
      cart = await this.cartRepository.findActiveCartByCartOwnerId(
        CartOwnerId.fromString(dto.userId),
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
      throw new CartNotFoundError();
    }

    // Validate ownership
    this.validateCartOwnership(cart, dto.userId, dto.guestToken);

    // Check if reservation already exists for this cart+variant
    const existingReservation =
      await this.reservationRepository.findByCartAndVariant(
        cart.cartId,
        VariantId.fromString(dto.variantId),
      );

    if (existingReservation) {
      // Update existing reservation quantity if needed
      const currentReservedQty = existingReservation.quantity.getValue();
      const existingCartItem = cart.findItemByVariantId(dto.variantId);
      const currentCartQty = existingCartItem
        ? existingCartItem.quantity.getValue()
        : 0;
      const newTotalQty = currentCartQty + dto.quantity;

      if (newTotalQty > currentReservedQty) {
        // Need to reserve additional quantity
        await this.reservationRepository.adjustReservation(
          cart.cartId,
          VariantId.fromString(dto.variantId),
          newTotalQty,
        );
      }
    } else {
      // Create new reservation
      await this.reservationRepository.reserveInventory(
        cart.cartId,
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
    await this.cartRepository.save(cart);

    return await this.mapCartToDto(cart);
  }

  async updateCartItem(dto: UpdateCartItemDto): Promise<CartDto> {
    const cart = await this.cartRepository.findById(
      CartId.fromString(dto.cartId),
    );

    if (!cart) {
      throw new CartNotFoundError(dto.cartId);
    }

    // Validate ownership
    this.validateCartOwnership(cart, dto.userId, dto.guestToken);

    // Update reservation if exists
    const reservation = await this.reservationRepository.findByCartAndVariant(
      cart.cartId,
      VariantId.fromString(dto.variantId),
    );

    if (reservation) {
      if (dto.quantity > 0) {
        reservation.updateQuantity(dto.quantity);
        await this.reservationRepository.save(reservation);
      } else {
        await this.reservationRepository.delete(reservation.reservationId.getValue());
      }
    }

    // Update cart item
    cart.updateItemQuantity(dto.variantId, dto.quantity);
    await this.cartRepository.save(cart);

    return await this.mapCartToDto(cart);
  }

  async removeFromCart(dto: RemoveFromCartDto): Promise<CartDto> {
    const cart = await this.cartRepository.findById(
      CartId.fromString(dto.cartId),
    );

    if (!cart) {
      throw new CartNotFoundError(dto.cartId);
    }

    // Validate ownership
    this.validateCartOwnership(cart, dto.userId, dto.guestToken);

    // Remove reservation if exists
    await this.reservationRepository.deleteByCartAndVariant(
      cart.cartId,
      VariantId.fromString(dto.variantId),
    );

    // Remove from cart
    cart.removeItem(dto.variantId);
    await this.cartRepository.save(cart);

    return await this.mapCartToDto(cart);
  }

  async clearCart(
    cartId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<CartDto> {
    const cart = await this.cartRepository.findById(CartId.fromString(cartId));

    if (!cart) {
      throw new CartNotFoundError(cartId);
    }

    // Validate ownership
    this.validateCartOwnership(cart, userId, guestToken);

    // Clear all reservations for this cart
    await this.reservationRepository.deleteByCartId(cart.cartId);

    // Clear cart items
    cart.clearItems();
    await this.cartRepository.save(cart);

    return await this.mapCartToDto(cart);
  }

  // Cart transfer and merging
  async transferGuestCartToUser(dto: TransferCartDto): Promise<CartDto> {
    const guestCart = await this.cartRepository.findActiveCartByGuestToken(
      GuestToken.fromString(dto.guestToken),
    );

    if (!guestCart) {
      throw new CartNotFoundError(dto.guestToken);
    }

    if (dto.mergeWithExisting) {
      // Check if user has existing cart
      const userCart = await this.cartRepository.findActiveCartByCartOwnerId(
        CartOwnerId.fromString(dto.userId),
      );

      if (userCart) {
        // Merge guest cart into user cart
        userCart.mergeWith(guestCart);
        await this.cartRepository.save(userCart);

        // Transfer reservations
        const guestReservations =
          await this.reservationRepository.findActiveByCartId(
            guestCart.cartId,
          );
        for (const reservation of guestReservations) {
          // Create new reservations for user cart
          await this.reservationRepository.createReservation(
            userCart.cartId,
            reservation.variantId,
            reservation.quantity,
          );
        }

        // Delete guest cart and its reservations
        await this.reservationRepository.deleteByCartId(guestCart.cartId);
        await this.cartRepository.delete(guestCart.cartId);

        await this.refreshCartReservations(userCart);
        return await this.mapCartToDto(userCart);
      }
    }

    // Transfer ownership of guest cart to user
    const transferredCart = guestCart.transferToUser(dto.userId);
    await this.cartRepository.save(transferredCart);

    await this.refreshCartReservations(transferredCart);
    return await this.mapCartToDto(transferredCart);
  }

  private async refreshCartReservations(cart: ShoppingCart): Promise<void> {
    try {
      const items = cart.items;

      for (const item of items) {
        const quantity = item.quantity.getValue();

        // Find existing reservation (even if expired, as repo method might return it depending on implementation)
        // Usually findByCartAndVariant returns null if expired or doesn't exist?
        // Let's assume we need to check if we have a VALID ACTIVE reservation.

        const existingReservation =
          await this.reservationRepository.findByCartAndVariant(
            cart.cartId,
            item.variantId,
          );

        let needsRenewal = false;

        if (!existingReservation) {
          needsRenewal = true;
        } else if (existingReservation.isExpired) {
          needsRenewal = true;
        } else if (existingReservation.quantity.getValue() < quantity) {
          // If reserved less than cart quantity (e.g. partial expiry or update), renew/adjust
          needsRenewal = true;
        }

        if (needsRenewal) {
          try {
            await this.reservationRepository.reserveInventory(
              cart.cartId,
              item.variantId,
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
    const cartCartOwnerId = cart.cartOwnerId?.getValue();
    const cartGuestToken = cart.guestToken?.getValue();

    if (cartCartOwnerId) {
      if (!userId || cartCartOwnerId !== userId) {
        throw new CartOwnershipError("Cart does not belong to user");
      }
    } else if (cartGuestToken) {
      if (!guestToken || cartGuestToken !== guestToken) {
        throw new CartOwnershipError("Cart does not belong to guest");
      }
    } else {
      throw new CartOwnershipError("Cart has no owner");
    }
  }

  private async mapCartToDto(cart: ShoppingCart): Promise<CartDto> {
    // Map all cart items with product details
    const items = await Promise.all(
      cart.items.map((item) => this.mapCartItemToDto(item)),
    );

    // Fetch checkout fields from database (they're not in the domain entity)
    const cartWithCheckoutInfo =
      await this.cartRepository.getCartWithCheckoutInfo(
        cart.cartId.getValue(),
      );

    // Calculate shipping
    const shippingCost = await this.calculateShippingCost(
      cartWithCheckoutInfo?.shippingMethod ?? undefined,
      cartWithCheckoutInfo?.shippingOption ?? undefined,
    );

    const summary: CartSummaryDto = {
      cartId: cart.cartId.getValue(),
      isUserCart: cart.isUserCart,
      isGuestCart: cart.isGuestCart,
      currency: cart.currency.getValue(),
      itemCount: cart.itemCount,
      uniqueItemCount: cart.uniqueItemCount,
      subtotal: cart.subtotal,
      totalDiscount: cart.totalDiscount,
      total: cart.total + shippingCost,
      shippingAmount: shippingCost,
      hasGiftItems: cart.hasGiftItems,
      hasFreeShipping: cart.hasFreeShipping,
      isEmpty: cart.isEmpty,
      isReservationExpired: cart.isReservationExpired,
      reservationExpiresAt: cart.reservationExpiresAt ?? undefined,
      updatedAt: cart.updatedAt,
    };

    return {
      cartId: cart.cartId.getValue(),
      userId: cart.cartOwnerId?.getValue(),
      guestToken: cart.guestToken?.getValue(),
      currency: cart.currency.getValue(),
      items,
      summary,
      reservationExpiresAt: cart.reservationExpiresAt ?? undefined,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,

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
    const variantId = item.variantId.getValue();

    // Fetch variant details
    const variant = await this.productVariantRepository.findById({
      getValue: () => variantId,
    });

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
            const asset = await this.mediaAssetRepository.findById(
              media.getAssetId(),
            );
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
      id: item.id,
      variantId,
      quantity: item.quantity.getValue(),
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      discountAmount: item.discountAmount,
      totalPrice: item.totalPrice,
      appliedPromos: item.appliedPromos.getValue(),
      isGift: item.isGift,
      giftMessage: item.giftMessage,
      hasPromosApplied: item.hasPromosApplied,
      hasFreeShipping: item.hasFreeShipping,
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
      throw new CartNotFoundError(cartId);
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
      throw new CartNotFoundError(cartId);
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
      throw new CartNotFoundError(cartId);
    }

    this.validateCartOwnership(cart, userId, guestToken);

    await this.cartRepository.updateAddresses(CartId.fromString(cartId), data);
  }

  async getCartWithCheckoutInfo(
    cartId: string,
    userId?: string,
    guestToken?: string,
  ): Promise<
    ReturnType<ICartRepository["getCartWithCheckoutInfo"]> extends Promise<
      infer T
    >
      ? T
      : never
  > {
    const cart = await this.cartRepository.findById(CartId.fromString(cartId));
    if (!cart) {
      throw new CartNotFoundError(cartId);
    }

    this.validateCartOwnership(cart, userId, guestToken);

    return await this.cartRepository.getCartWithCheckoutInfo(
      cart.cartId.getValue(),
    );
  }
}