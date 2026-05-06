import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IPaymentMethodRepository } from "../../../domain/repositories/ipayment-method.repository";
import {
  PaymentMethod,
  PaymentMethodProps,
} from "../../../domain/entities/payment-method.entity";
import { PaymentMethodType } from "../../../domain/value-objects/payment-method-type.vo";
import { PaymentMethodId } from "../../../domain/value-objects/payment-method-id.vo";
import { UserId } from "../../../domain/value-objects/user-id.vo";
import { AddressId } from "../../../domain/value-objects/address-id.vo";

export class PaymentMethodRepository
  extends PrismaRepository<PaymentMethod>
  implements IPaymentMethodRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(paymentMethod: PaymentMethod): Promise<void> {
    const data = this.toPersistence(paymentMethod);

    await this.prisma.paymentMethod.upsert({
      where: { id: paymentMethod.id.getValue() },
      create: data.create,
      update: data.update,
    });

    await this.dispatchEvents(paymentMethod);
  }

  async findById(id: PaymentMethodId): Promise<PaymentMethod | null> {
    const row = await this.prisma.paymentMethod.findUnique({
      where: { id: id.getValue() },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: UserId): Promise<PaymentMethod[]> {
    const rows = await this.prisma.paymentMethod.findMany({
      where: { userId: userId.getValue() },
      orderBy: [
        { isDefault: "desc" }, // Default payment methods first
        { createdAt: "desc" },
      ],
    });

    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: PaymentMethodId): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id: id.getValue() },
    });
  }

  async findByUserIdAndType(
    userId: UserId,
    type: PaymentMethodType,
  ): Promise<PaymentMethod[]> {
    const rows = await this.prisma.paymentMethod.findMany({
      where: {
        userId: userId.getValue(),
        type,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findDefaultByUserId(userId: UserId): Promise<PaymentMethod | null> {
    const row = await this.prisma.paymentMethod.findFirst({
      where: {
        userId: userId.getValue(),
        isDefault: true,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async countByUserId(userId: UserId): Promise<number> {
    return this.prisma.paymentMethod.count({
      where: { userId: userId.getValue() },
    });
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    const result = await this.prisma.paymentMethod.deleteMany({
      where: { userId: userId.getValue() },
    });
    return result.count;
  }

  // --- Persistence mapping ---

  private toDomain(row: Prisma.PaymentMethodGetPayload<object>): PaymentMethod {
    const props: PaymentMethodProps = {
      id: PaymentMethodId.fromString(row.id),
      userId: UserId.fromString(row.userId),
      type: PaymentMethodType.fromString(row.type),
      brand: row.brand,
      last4: row.last4,
      expMonth: row.expMonth,
      expYear: row.expYear,
      billingAddressId: row.billingAddressId ? AddressId.fromString(row.billingAddressId) : null,
      providerRef: row.providerRef,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return PaymentMethod.fromPersistence(props);
  }

  private toPersistence(paymentMethod: PaymentMethod): {
    create: Prisma.PaymentMethodUncheckedCreateInput;
    update: Prisma.PaymentMethodUncheckedUpdateInput;
  } {
    const create = {
      id: paymentMethod.id.getValue(),
      userId: paymentMethod.userId.getValue(),
      type: paymentMethod.type,
      brand: paymentMethod.brand,
      last4: paymentMethod.last4,
      expMonth: paymentMethod.expMonth,
      expYear: paymentMethod.expYear,
      billingAddressId: paymentMethod.billingAddressId?.getValue() ?? null,
      providerRef: paymentMethod.providerRef,
      isDefault: paymentMethod.isDefault,
      createdAt: paymentMethod.createdAt,
    };

    const { id, userId, createdAt, ...update } = create;

    return { create, update };
  }
}
