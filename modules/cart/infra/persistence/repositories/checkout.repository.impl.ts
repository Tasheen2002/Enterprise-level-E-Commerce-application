import { PrismaClient, CheckoutStatusEnum } from "@prisma/client";
import { CheckoutRepository } from "../../../domain/repositories/checkout.repository";
import {
  Checkout,
  CheckoutEntityData,
} from "../../../domain/entities/checkout.entity";
import { CheckoutId } from "../../../domain/value-objects/checkout-id.vo";
import { CartId } from "../../../domain/value-objects/cart-id.vo";
import { UserId } from "../../../../user-management/domain/value-objects/user-id.vo";
import { GuestToken } from "../../../domain/value-objects/guest-token.vo";

export class CheckoutRepositoryImpl implements CheckoutRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(checkout: Checkout): Promise<void> {
    const data = checkout.toData();

    try {
      // Check if checkout already exists for this cart
      // Check if there is an active (pending) checkout for this cart
      const existing = await this.prisma.checkout.findFirst({
        where: {
          cartId: data.cartId,
          status: CheckoutStatusEnum.pending,
        },
      });

      if (existing) {
        // Update existing checkout
        await this.prisma.checkout.update({
          where: { id: existing.id }, // Use ID instead of cartId because cartId is no longer unique
          data: {
            userId: data.userId || null,
            guestToken: data.guestToken || null,
            status: data.status as CheckoutStatusEnum,
            totalAmount: data.totalAmount,
            currency: data.currency,
            expiresAt: data.expiresAt,
            completedAt: data.completedAt || null,
            updatedAt: data.updatedAt,
          },
        });
      } else {
        // Create new checkout
        await this.prisma.checkout.create({
          data: {
            id: data.checkoutId,
            userId: data.userId || null,
            guestToken: data.guestToken || null,
            cartId: data.cartId,
            status: data.status as CheckoutStatusEnum,
            totalAmount: data.totalAmount,
            currency: data.currency,
            expiresAt: data.expiresAt,
            completedAt: data.completedAt || null,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
        });
      }
    } catch (error: any) {
      console.error("Failed to save checkout:", error);
      console.error("Checkout data:", JSON.stringify(data, null, 2));
      throw error;
    }
  }

  async findById(checkoutId: CheckoutId): Promise<Checkout | null> {
    const checkoutData = await this.prisma.checkout.findUnique({
      where: { id: checkoutId.toString() },
    });

    if (!checkoutData) {
      return null;
    }

    return this.mapPrismaToEntity(checkoutData);
  }

  async findByCartId(cartId: CartId): Promise<Checkout | null> {
    // Only return the active (pending) or most recent checkout
    // If we have completed checkouts, we ignore them here so the service creates a new one
    const checkoutData = await this.prisma.checkout.findFirst({
      where: {
        cartId: cartId.toString(),
        status: CheckoutStatusEnum.pending,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!checkoutData) {
      return null;
    }

    return this.mapPrismaToEntity(checkoutData);
  }

  async update(checkout: Checkout): Promise<void> {
    const data = checkout.toData();
    await this.prisma.checkout.update({
      where: { id: data.checkoutId },
      data: {
        cartId: data.cartId, // Allow updating cartId (for archiving)
        status: data.status as CheckoutStatusEnum,
        completedAt: data.completedAt,
        updatedAt: data.updatedAt,
      },
    });
  }

  async delete(checkoutId: CheckoutId): Promise<void> {
    await this.prisma.checkout.delete({
      where: { id: checkoutId.toString() },
    });
  }

  async findByUserId(userId: UserId): Promise<Checkout[]> {
    const checkouts = await this.prisma.checkout.findMany({
      where: { userId: userId.toString() },
      orderBy: { createdAt: "desc" },
    });

    return checkouts.map((c) => this.mapPrismaToEntity(c));
  }

  async findByGuestToken(guestToken: GuestToken): Promise<Checkout[]> {
    const checkouts = await this.prisma.checkout.findMany({
      where: { guestToken: guestToken.toString() },
      orderBy: { createdAt: "desc" },
    });

    return checkouts.map((c) => this.mapPrismaToEntity(c));
  }

  async findPendingCheckouts(): Promise<Checkout[]> {
    const checkouts = await this.prisma.checkout.findMany({
      where: { status: CheckoutStatusEnum.pending },
      orderBy: { createdAt: "desc" },
    });

    return checkouts.map((c) => this.mapPrismaToEntity(c));
  }

  async findExpiredCheckouts(): Promise<Checkout[]> {
    const now = new Date();
    const checkouts = await this.prisma.checkout.findMany({
      where: {
        status: CheckoutStatusEnum.pending,
        expiresAt: { lt: now },
      },
      orderBy: { expiresAt: "asc" },
    });

    return checkouts.map((c) => this.mapPrismaToEntity(c));
  }

  async markAsCompleted(
    checkoutId: CheckoutId,
    completedAt: Date,
  ): Promise<void> {
    await this.prisma.checkout.update({
      where: { id: checkoutId.toString() },
      data: {
        status: CheckoutStatusEnum.completed,
        completedAt,
        updatedAt: new Date(),
      },
    });
  }

  async markAsExpired(checkoutId: CheckoutId): Promise<void> {
    await this.prisma.checkout.update({
      where: { id: checkoutId.toString() },
      data: {
        status: CheckoutStatusEnum.expired,
        updatedAt: new Date(),
      },
    });
  }

  async markAsCancelled(checkoutId: CheckoutId): Promise<void> {
    await this.prisma.checkout.update({
      where: { id: checkoutId.toString() },
      data: {
        status: CheckoutStatusEnum.cancelled,
        updatedAt: new Date(),
      },
    });
  }

  async cleanupExpiredCheckouts(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.checkout.updateMany({
      where: {
        status: CheckoutStatusEnum.pending,
        expiresAt: { lt: now },
      },
      data: {
        status: CheckoutStatusEnum.expired,
        updatedAt: now,
      },
    });

    return result.count;
  }

  private mapPrismaToEntity(prismaData: any): Checkout {
    const entityData: CheckoutEntityData = {
      checkoutId: prismaData.id,
      cartId: prismaData.cartId,
      userId: prismaData.userId,
      // If both userId and guestToken exist (invalid state), prioritize userId
      guestToken: prismaData.userId ? null : prismaData.guestToken,
      status: prismaData.status,
      totalAmount: parseFloat(prismaData.totalAmount.toString()),
      currency: prismaData.currency,
      expiresAt: prismaData.expiresAt,
      completedAt: prismaData.completedAt,
      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
    };

    return Checkout.fromData(entityData);
  }
}
