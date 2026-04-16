import { PrismaClient } from "@prisma/client";
import { ICartRepository, CartWithCheckoutInfo } from "../../../domain/repositories/cart.repository";
import {
  ShoppingCart,
  ShoppingCartEntityData,
} from "../../../domain/entities/shopping-cart.entity";
import {
  CartItem,
  CartItemEntityData,
} from "../../../domain/entities/cart-item.entity";
import { CartId } from "../../../domain/value-objects/cart-id.vo";
import { CartOwnerId } from "../../../domain/value-objects/cart-owner-id.vo";
import { GuestToken } from "../../../domain/value-objects/guest-token.vo";
import { Currency } from "../../../domain/value-objects/currency.vo";

export class CartRepositoryImpl implements ICartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Core CRUD operations
  async save(cart: ShoppingCart): Promise<void> {
    const data = cart.toSnapshot();

    await this.prisma.$transaction(async (tx) => {
      await tx.shoppingCart.upsert({
        where: { id: data.cartId },
        create: {
          id: data.cartId,
          userId: data.userId ?? null,
          guestToken: data.guestToken ?? null,
          currency: data.currency,
          reservationExpiresAt: data.reservationExpiresAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        },
        update: {
          userId: data.userId ?? null,
          guestToken: data.guestToken ?? null,
          currency: data.currency,
          reservationExpiresAt: data.reservationExpiresAt,
          updatedAt: data.updatedAt,
        },
      });

      // Replace all items
      await tx.cartItem.deleteMany({
        where: { cartId: data.cartId },
      });

      if (data.items && data.items.length > 0) {
        await tx.cartItem.createMany({
          data: data.items.map((item) => ({
            id: item.id,
            cartId: data.cartId,
            variantId: item.variantId,
            qty: item.quantity,
            unitPriceSnapshot: item.unitPriceSnapshot,
            appliedPromos: item.appliedPromos as any,
            isGift: item.isGift,
            giftMessage: item.giftMessage,
          })),
        });
      }
    });
  }

  async findById(cartId: CartId): Promise<ShoppingCart | null> {
    const cartData = await this.prisma.shoppingCart.findUnique({
      where: { id: cartId.getValue() },
      include: { items: true },
    });

    if (!cartData) {
      return null;
    }

    return this.mapPrismaToEntity(cartData);
  }

  async delete(cartId: CartId): Promise<void> {
    await this.prisma.shoppingCart.delete({
      where: { id: cartId.getValue() },
    });
  }

  // User cart operations
  async findByCartOwnerId(userId: CartOwnerId): Promise<ShoppingCart | null> {
    const cartData = await this.prisma.shoppingCart.findFirst({
      where: { userId: userId.getValue() },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!cartData) {
      return null;
    }

    return this.mapPrismaToEntity(cartData);
  }

  async findActiveCartByCartOwnerId(
    userId: CartOwnerId,
  ): Promise<ShoppingCart | null> {
    const cartData = await this.prisma.shoppingCart.findFirst({
      where: {
        userId: userId.getValue(),
      },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!cartData) {
      return null;
    }

    return this.mapPrismaToEntity(cartData);
  }

  async existsByCartOwnerId(userId: CartOwnerId): Promise<boolean> {
    const count = await this.prisma.shoppingCart.count({
      where: { userId: userId.getValue() },
    });
    return count > 0;
  }

  // Guest cart operations
  async findByGuestToken(guestToken: GuestToken): Promise<ShoppingCart | null> {
    const cartData = await this.prisma.shoppingCart.findFirst({
      where: { guestToken: guestToken.getValue() },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!cartData) {
      return null;
    }

    return this.mapPrismaToEntity(cartData);
  }

  async findActiveCartByGuestToken(
    guestToken: GuestToken,
  ): Promise<ShoppingCart | null> {
    const cartData = await this.prisma.shoppingCart.findFirst({
      where: {
        guestToken: guestToken.getValue(),
      },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!cartData) {
      return null;
    }

    return this.mapPrismaToEntity(cartData);
  }

  async existsByGuestToken(guestToken: GuestToken): Promise<boolean> {
    const count = await this.prisma.shoppingCart.count({
      where: { guestToken: guestToken.getValue() },
    });
    return count > 0;
  }

  // Cart management operations
  async createUserCart(
    userId: CartOwnerId,
    currency: Currency,
  ): Promise<ShoppingCart> {
    const cart = ShoppingCart.createForUser({
      userId: userId.getValue(),
      currency: currency.getValue(),
    });
    await this.save(cart);
    return cart;
  }

  async createGuestCart(
    guestToken: GuestToken,
    currency: Currency,
  ): Promise<ShoppingCart> {
    const cart = ShoppingCart.createForGuest({
      guestToken: guestToken.getValue(),
      currency: currency.getValue(),
    });
    await this.save(cart);
    return cart;
  }

  async transferGuestCartToUser(
    guestToken: GuestToken,
    userId: CartOwnerId,
  ): Promise<ShoppingCart> {
    const guestCart = await this.findByGuestToken(guestToken);
    if (!guestCart) {
      throw new Error("Guest cart not found");
    }

    // Transfer ownership by updating the cart
    await this.prisma.shoppingCart.update({
      where: { id: guestCart.cartId.getValue() },
      data: {
        userId: userId.getValue(),
        guestToken: null,
        updatedAt: new Date(),
      },
    });

    return this.findById(guestCart.cartId) as Promise<ShoppingCart>;
  }

  async mergeGuestCartIntoUserCart(
    guestToken: GuestToken,
    userId: CartOwnerId,
  ): Promise<ShoppingCart> {
    const guestCart = await this.findByGuestToken(guestToken);
    const userCart = await this.findByCartOwnerId(userId);

    if (!guestCart) {
      throw new Error("Guest cart not found");
    }

    if (!userCart) {
      // No existing user cart, just transfer the guest cart
      return this.transferGuestCartToUser(guestToken, userId);
    }

    // Merge items from guest cart into user cart
    const guestCartData = guestCart.toSnapshot();
    for (const guestItem of guestCartData.items) {
      userCart.addItem({
        variantId: guestItem.variantId,
        quantity: guestItem.quantity,
        unitPrice: guestItem.unitPriceSnapshot,
        appliedPromos: guestItem.appliedPromos,
        isGift: guestItem.isGift,
        giftMessage: guestItem.giftMessage,
      });
    }

    // Save updated user cart and delete guest cart
    await this.save(userCart);
    await this.delete(guestCart.cartId);

    return userCart;
  }

  // Query operations
  async findEmptyCarts(olderThanDays?: number): Promise<ShoppingCart[]> {
    const whereClause: any = {
      items: { none: {} },
    };

    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      whereClause.updatedAt = { lt: cutoffDate };
    }

    const carts = await this.prisma.shoppingCart.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  async findExpiredReservationCarts(): Promise<ShoppingCart[]> {
    const carts = await this.prisma.shoppingCart.findMany({
      where: {
        reservationExpiresAt: { lt: new Date() },
      },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  async findCartsByCurrency(
    currency: Currency,
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]> {
    const carts = await this.prisma.shoppingCart.findMany({
      where: { currency: currency.getValue() },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  async findRecentlyUpdatedCarts(
    hours: number,
    limit?: number,
  ): Promise<ShoppingCart[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    const carts = await this.prisma.shoppingCart.findMany({
      where: {
        updatedAt: { gte: cutoffDate },
      },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  // Business operations
  async countItemsInCart(cartId: CartId): Promise<number> {
    const result = await this.prisma.cartItem.aggregate({
      where: { cartId: cartId.getValue() },
      _sum: { qty: true },
    });

    return result._sum?.qty || 0;
  }

  async getCartTotal(cartId: CartId): Promise<number> {
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cartId.getValue() },
    });

    return items.reduce((total, item) => {
      return total + item.unitPriceSnapshot.toNumber() * item.qty;
    }, 0);
  }

  async hasItems(cartId: CartId): Promise<boolean> {
    const count = await this.prisma.cartItem.count({
      where: { cartId: cartId.getValue() },
    });
    return count > 0;
  }

  async getCartAge(cartId: CartId): Promise<number> {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { id: cartId.getValue() },
      select: { createdAt: true },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const now = new Date();
    const ageMs = now.getTime() - cart.createdAt.getTime();
    return Math.floor(ageMs / (1000 * 60 * 60)); // Convert to hours
  }

  // Batch operations
  async findByIds(cartIds: CartId[]): Promise<ShoppingCart[]> {
    const ids = cartIds.map((id) => id.getValue());
    const carts = await this.prisma.shoppingCart.findMany({
      where: { id: { in: ids } },
      include: { items: true },
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  async deleteEmptyCarts(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.shoppingCart.deleteMany({
      where: {
        AND: [{ updatedAt: { lt: cutoffDate } }, { items: { none: {} } }],
      },
    });

    return result.count;
  }

  async deleteExpiredGuestCarts(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.shoppingCart.deleteMany({
      where: {
        AND: [{ guestToken: { not: null } }, { updatedAt: { lt: cutoffDate } }],
      },
    });

    return result.count;
  }

  async updateExpiredReservations(): Promise<number> {
    const result = await this.prisma.shoppingCart.updateMany({
      where: {
        reservationExpiresAt: { lt: new Date() },
      },
      data: {
        reservationExpiresAt: null,
        updatedAt: new Date(),
      },
    });

    return result.count;
  }

  // Analytics operations
  async getCartStatistics(): Promise<{
    totalCarts: number;
    userCarts: number;
    guestCarts: number;
    emptyCarts: number;
    averageItemsPerCart: number;
    averageCartValue: number;
  }> {
    const [totalCarts, userCarts, guestCarts, emptyCarts, itemStats] =
      await Promise.all([
        this.prisma.shoppingCart.count(),
        this.prisma.shoppingCart.count({ where: { userId: { not: null } } }),
        this.prisma.shoppingCart.count({
          where: { guestToken: { not: null } },
        }),
        this.prisma.shoppingCart.count({ where: { items: { none: {} } } }),
        this.prisma.cartItem.aggregate({
          _count: true,
          _avg: { qty: true, unitPriceSnapshot: true },
        }),
      ]);

    const totalItems = itemStats._count || 0;
    const averageItemsPerCart = totalCarts > 0 ? totalItems / totalCarts : 0;
    const averageCartValue =
      (itemStats._avg?.unitPriceSnapshot?.toNumber() || 0) *
      (itemStats._avg?.qty || 0);

    return {
      totalCarts,
      userCarts,
      guestCarts,
      emptyCarts,
      averageItemsPerCart,
      averageCartValue,
    };
  }

  async getCartsByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]> {
    const carts = await this.prisma.shoppingCart.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  // Advanced query operations
  async findAbandonedCarts(
    abandonedAfterHours: number,
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - abandonedAfterHours);

    const carts = await this.prisma.shoppingCart.findMany({
      where: {
        AND: [
          { updatedAt: { lt: cutoffDate } },
          { items: { some: {} } }, // Has items
        ],
      },
      include: { items: true },
      orderBy: { updatedAt: "asc" },
      take: limit,
      skip: offset,
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  async findCartsWithGiftItems(
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]> {
    const carts = await this.prisma.shoppingCart.findMany({
      where: {
        items: {
          some: { isGift: true },
        },
      },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  async findCartsWithPromotions(
    limit?: number,
    offset?: number,
  ): Promise<ShoppingCart[]> {
    const carts = await this.prisma.shoppingCart.findMany({
      where: {
        items: {
          some: {
            appliedPromos: { not: [] },
          },
        },
      },
      include: { items: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    return carts.map((cart) => this.mapPrismaToEntity(cart));
  }

  async findCartsAboveValue(
    minValue: number,
    currency: Currency,
  ): Promise<ShoppingCart[]> {
    const carts = await this.prisma.shoppingCart.findMany({
      where: { currency: currency.getValue() },
      include: { items: true },
    });

    const results: ShoppingCart[] = [];
    for (const cart of carts) {
      const entity = this.mapPrismaToEntity(cart);
      const total = await this.getCartTotal(entity.cartId);
      if (total >= minValue) {
        results.push(entity);
      }
    }
    return results;
  }

  // Cleanup operations
  async cleanupExpiredGuestCarts(): Promise<number> {
    return this.deleteExpiredGuestCarts(30); // Default 30 days
  }

  async cleanupAbandonedCarts(abandonedAfterDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - abandonedAfterDays);

    const result = await this.prisma.shoppingCart.deleteMany({
      where: {
        AND: [
          { updatedAt: { lt: cutoffDate } },
          { guestToken: { not: null } }, // Only clean up guest carts
        ],
      },
    });

    return result.count;
  }

  async archiveOldCarts(olderThanDays: number): Promise<number> {
    // This is a placeholder - in a real implementation you'd move to an archive table
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const cartsToArchive = await this.prisma.shoppingCart.count({
      where: { updatedAt: { lt: cutoffDate } },
    });

    // For now, just return the count without actually archiving
    return cartsToArchive;
  }

  // Reservation integration
  async findCartsWithExpiredReservations(): Promise<ShoppingCart[]> {
    return this.findExpiredReservationCarts();
  }

  async updateCartReservationExpiry(
    cartId: CartId,
    expiresAt: Date | null,
  ): Promise<void> {
    await this.prisma.shoppingCart.update({
      where: { id: cartId.getValue() },
      data: {
        reservationExpiresAt: expiresAt,
        updatedAt: new Date(),
      },
    });
  }

  async extendCartReservations(
    cartId: CartId,
    additionalHours: number,
  ): Promise<void> {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { id: cartId.getValue() },
      select: { reservationExpiresAt: true },
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    const currentExpiry = cart.reservationExpiresAt || new Date();
    const newExpiry = new Date(
      currentExpiry.getTime() + additionalHours * 60 * 60 * 1000,
    );

    await this.updateCartReservationExpiry(cartId, newExpiry);
  }

  // Search and filtering
  async searchCarts(criteria: {
    userId?: string;
    guestToken?: string;
    currency?: string;
    minValue?: number;
    maxValue?: number;
    hasGiftItems?: boolean;
    isEmpty?: boolean;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
    limit?: number;
    offset?: number;
  }): Promise<ShoppingCart[]> {
    const whereConditions: any = {};

    if (criteria.userId) whereConditions.userId = criteria.userId;
    if (criteria.guestToken) whereConditions.guestToken = criteria.guestToken;
    if (criteria.currency) whereConditions.currency = criteria.currency;
    if (criteria.hasGiftItems) {
      whereConditions.items = { some: { isGift: true } };
    }
    if (criteria.isEmpty !== undefined) {
      whereConditions.items = criteria.isEmpty ? { none: {} } : { some: {} };
    }
    if (criteria.createdAfter || criteria.createdBefore) {
      whereConditions.createdAt = {};
      if (criteria.createdAfter)
        whereConditions.createdAt.gte = criteria.createdAfter;
      if (criteria.createdBefore)
        whereConditions.createdAt.lte = criteria.createdBefore;
    }
    if (criteria.updatedAfter || criteria.updatedBefore) {
      whereConditions.updatedAt = {};
      if (criteria.updatedAfter)
        whereConditions.updatedAt.gte = criteria.updatedAfter;
      if (criteria.updatedBefore)
        whereConditions.updatedAt.lte = criteria.updatedBefore;
    }

    const carts = await this.prisma.shoppingCart.findMany({
      where: whereConditions,
      include: { items: true },
      orderBy: { updatedAt: "desc" },
      take: criteria.limit,
      skip: criteria.offset,
    });

    let results = carts.map((cart) => this.mapPrismaToEntity(cart));

    // Filter by value if specified (requires calculation)
    if (criteria.minValue !== undefined || criteria.maxValue !== undefined) {
      const filteredResults = [];
      for (const cart of results) {
        const total = await this.getCartTotal(cart.cartId);
        if (criteria.minValue !== undefined && total < criteria.minValue)
          continue;
        if (criteria.maxValue !== undefined && total > criteria.maxValue)
          continue;
        filteredResults.push(cart);
      }
      results = filteredResults;
    }

    return results;
  }

  // Validation operations
  async validateCartOwnership(
    cartId: CartId,
    userId?: CartOwnerId,
    guestToken?: GuestToken,
  ): Promise<boolean> {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { id: cartId.getValue() },
      select: { userId: true, guestToken: true },
    });

    if (!cart) return false;

    if (userId && cart.userId === userId.getValue()) return true;
    if (guestToken && cart.guestToken === guestToken.getValue()) return true;

    return false;
  }

  async isCartAccessible(
    cartId: CartId,
    userId?: CartOwnerId,
    guestToken?: GuestToken,
  ): Promise<boolean> {
    return this.validateCartOwnership(cartId, userId, guestToken);
  }

  // Performance operations
  async getCartSummary(cartId: CartId): Promise<{
    cartId: string;
    itemCount: number;
    uniqueItemCount: number;
    subtotal: number;
    totalDiscount: number;
    total: number;
    currency: string;
    hasGiftItems: boolean;
    isExpired: boolean;
    updatedAt: Date;
  } | null> {
    const cart = await this.prisma.shoppingCart.findUnique({
      where: { id: cartId.getValue() },
      include: { items: true },
    });

    if (!cart) return null;

    const itemCount = cart.items.reduce((sum, item) => sum + item.qty, 0);
    const uniqueItemCount = cart.items.length;
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.unitPriceSnapshot.toNumber() * item.qty,
      0,
    );
    const hasGiftItems = cart.items.some((item) => item.isGift);
    const isExpired = cart.reservationExpiresAt
      ? cart.reservationExpiresAt < new Date()
      : false;

    return {
      cartId: cart.id,
      itemCount,
      uniqueItemCount,
      subtotal,
      totalDiscount: 0, // TODO: Calculate from applied promos
      total: subtotal, // TODO: Apply discounts
      currency: cart.currency || "",
      hasGiftItems,
      isExpired,
      updatedAt: cart.updatedAt,
    };
  }

  // Transaction support
  async saveWithTransaction(
    cart: ShoppingCart,
    transactionContext?: any,
  ): Promise<void> {
    if (transactionContext) {
      // Use provided transaction context
      await this.saveWithPrismaClient(cart, transactionContext);
    } else {
      await this.save(cart);
    }
  }

  async deleteWithTransaction(
    cartId: CartId,
    transactionContext?: any,
  ): Promise<void> {
    if (transactionContext) {
      await transactionContext.shoppingCart.delete({
        where: { id: cartId.getValue() },
      });
    } else {
      await this.delete(cartId);
    }
  }

  // Private helper methods
  private async saveWithPrismaClient(
    cart: ShoppingCart,
    prismaClient: any,
  ): Promise<void> {
    const data = cart.toSnapshot();

    await prismaClient.shoppingCart.create({
      data: {
        id: data.cartId,
        userId: data.userId ?? null,
        guestToken: data.guestToken ?? null,
        currency: data.currency,
        reservationExpiresAt: data.reservationExpiresAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        items: {
          create:
            data.items?.map((item) => ({
              id: item.id,
              variantId: item.variantId,
              qty: item.quantity,
              unitPriceSnapshot: item.unitPriceSnapshot,
              appliedPromos: item.appliedPromos as any,
              isGift: item.isGift,
              giftMessage: item.giftMessage,
            })) || [],
        },
      },
    });
  }

  // Checkout field operations
  async updateEmail(cartId: CartId, email: string): Promise<void> {
    await this.prisma.shoppingCart.update({
      where: { id: cartId.getValue() },
      data: { email, updatedAt: new Date() },
    });
  }

  async updateShippingInfo(
    cartId: CartId,
    data: {
      shippingMethod?: string;
      shippingOption?: string;
      isGift?: boolean;
    },
  ): Promise<void> {
    await this.prisma.shoppingCart.update({
      where: { id: cartId.getValue() },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async updateAddresses(
    cartId: CartId,
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
  ): Promise<void> {
    await this.prisma.shoppingCart.update({
      where: { id: cartId.getValue() },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async getCartWithCheckoutInfo(cartId: string): Promise<CartWithCheckoutInfo | null> {
    return await this.prisma.shoppingCart.findUnique({
      where: { id: cartId },
      include: { items: true },
    });
  }

  private mapPrismaToEntity(cartData: any): ShoppingCart {
    const entityData: ShoppingCartEntityData = {
      cartId: cartData.id,
      userId: cartData.userId ?? undefined,
      // If both userId and guestToken exist (invalid state), prioritize userId
      guestToken: cartData.userId ? undefined : (cartData.guestToken ?? undefined),
      currency: cartData.currency,
      reservationExpiresAt: cartData.reservationExpiresAt ?? undefined,
      createdAt: cartData.createdAt,
      updatedAt: cartData.updatedAt,
      items: (cartData.items ?? []).map((item: any): CartItemEntityData => ({
        id: item.id,
        cartId: item.cartId,
        variantId: item.variantId,
        quantity: item.qty,
        unitPriceSnapshot: item.unitPriceSnapshot,
        appliedPromos: item.appliedPromos ?? [],
        isGift: item.isGift,
        giftMessage: item.giftMessage ?? undefined,
      })),
    };
    return ShoppingCart.fromPersistence(entityData);
  }
}