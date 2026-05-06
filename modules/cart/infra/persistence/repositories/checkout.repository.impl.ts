import { PrismaClient, CheckoutStatusEnum, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { ICheckoutRepository } from "../../../domain/repositories/checkout.repository";
import {
  Checkout,
  CheckoutEntityData,
} from "../../../domain/entities/checkout.entity";
import { CheckoutId } from "../../../domain/value-objects/checkout-id.vo";
import { CartId } from "../../../domain/value-objects/cart-id.vo";
import { CartOwnerId } from "../../../domain/value-objects/cart-owner-id.vo";
import { GuestToken } from "../../../domain/value-objects/guest-token.vo";

export class CheckoutRepositoryImpl
  extends PrismaRepository<Checkout>
  implements ICheckoutRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(checkout: Checkout): Promise<void> {
    const data = checkout.toSnapshot();

    await this.prisma.checkout.upsert({
      where: { id: data.checkoutId },
      create: {
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
      update: {
        cartId: data.cartId,
        status: data.status as CheckoutStatusEnum,
        completedAt: data.completedAt || null,
        updatedAt: data.updatedAt,
      },
    });

    await this.dispatchEvents(checkout);
  }

  async findById(checkoutId: CheckoutId): Promise<Checkout | null> {
    const checkoutData = await this.prisma.checkout.findUnique({
      where: { id: checkoutId.getValue() },
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
        cartId: cartId.getValue(),
        status: CheckoutStatusEnum.pending,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!checkoutData) {
      return null;
    }

    return this.mapPrismaToEntity(checkoutData);
  }

  async delete(checkoutId: CheckoutId): Promise<void> {
    await this.prisma.checkout.delete({
      where: { id: checkoutId.getValue() },
    });
  }

  async findByCartOwnerId(userId: CartOwnerId): Promise<Checkout[]> {
    const checkouts = await this.prisma.checkout.findMany({
      where: { userId: userId.getValue() },
      orderBy: { createdAt: "desc" },
    });

    return checkouts.map((c) => this.mapPrismaToEntity(c));
  }

  async findByGuestToken(guestToken: GuestToken): Promise<Checkout[]> {
    const checkouts = await this.prisma.checkout.findMany({
      where: { guestToken: guestToken.getValue() },
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

  private mapPrismaToEntity(prismaData: Prisma.CheckoutGetPayload<Record<string, never>>): Checkout {
    const entityData: CheckoutEntityData = {
      checkoutId: prismaData.id,
      cartId: prismaData.cartId,
      userId: prismaData.userId ?? undefined,
      // If both userId and guestToken exist (invalid state), prioritize userId
      guestToken: prismaData.userId ? undefined : (prismaData.guestToken ?? undefined),
      status: prismaData.status,
      totalAmount: Number(prismaData.totalAmount),
      currency: prismaData.currency,
      expiresAt: prismaData.expiresAt,
      completedAt: prismaData.completedAt ?? undefined,
      createdAt: prismaData.createdAt,
      updatedAt: prismaData.updatedAt,
    };
    return Checkout.fromPersistence(entityData);
  }
}