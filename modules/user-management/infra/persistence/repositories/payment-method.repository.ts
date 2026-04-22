import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { IPaymentMethodRepository } from "../../../domain/repositories/ipayment-method.repository";
import {
  PaymentMethod,
  PaymentMethodProps,
} from "../../../domain/entities/payment-method.entity";
import { PaymentMethodType } from "../../../domain/enums/payment-method-type.enum";
import { PaymentMethodId } from "../../../domain/value-objects/payment-method-id";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class PaymentMethodRepository
  extends PrismaRepository<PaymentMethod>
  implements IPaymentMethodRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  // Maps a Prisma record to a PaymentMethod domain entity
  private toDomain(data: Prisma.PaymentMethodGetPayload<object>): PaymentMethod {
    const props: PaymentMethodProps = {
      id: PaymentMethodId.fromString(data.id),
      userId: UserId.fromString(data.userId),
      type: PaymentMethodType.fromString(data.type),
      brand: data.brand,
      last4: data.last4,
      expMonth: data.expMonth,
      expYear: data.expYear,
      billingAddressId: data.billingAddressId,
      providerRef: data.providerRef,
      isDefault: data.isDefault,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return PaymentMethod.fromPersistence(props);
  }

  // Maps a PaymentMethod domain entity to a Prisma-compatible persistence object
  private toPersistence(paymentMethod: PaymentMethod): {
    create: Prisma.PaymentMethodUncheckedCreateInput;
    update: Prisma.PaymentMethodUncheckedUpdateInput;
  } {
    const create = {
      id: paymentMethod.id.getValue(),
      userId: paymentMethod.userId.getValue(),
      type: paymentMethod.type.toString(),
      brand: paymentMethod.brand,
      last4: paymentMethod.last4,
      expMonth: paymentMethod.expMonth,
      expYear: paymentMethod.expYear,
      billingAddressId: paymentMethod.billingAddressId,
      providerRef: paymentMethod.providerRef,
      isDefault: paymentMethod.isDefault,
      createdAt: paymentMethod.createdAt,
    };

    const { id, userId, createdAt, ...update } = create;

    return { create, update };
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
    const paymentMethodData = await this.prisma.paymentMethod.findUnique({
      where: { id: id.getValue() },
    });

    if (!paymentMethodData) {
      return null;
    }

    return this.toDomain(paymentMethodData);
  }

  async findByUserId(userId: UserId): Promise<PaymentMethod[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { userId: userId.getValue() },
      orderBy: [
        { isDefault: "desc" }, // Default payment methods first
        { createdAt: "desc" },
      ],
    });

    return paymentMethods.map((data) => this.toDomain(data));
  }

  async delete(id: PaymentMethodId): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id: id.getValue() },
    });
  }

  async findByUserIdAndType(
    userId: UserId,
    type: PaymentMethodType
  ): Promise<PaymentMethod[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        userId: userId.getValue(),
        type: type.toString(),
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return paymentMethods.map((data) => this.toDomain(data));
  }

  async findDefaultByUserId(userId: UserId): Promise<PaymentMethod | null> {
    const paymentMethodData = await this.prisma.paymentMethod.findFirst({
      where: {
        userId: userId.getValue(),
        isDefault: true,
      },
    });

    if (!paymentMethodData) {
      return null;
    }

    return this.toDomain(paymentMethodData);
  }

  async countByUserId(userId: UserId): Promise<number> {
    return await this.prisma.paymentMethod.count({
      where: { userId: userId.getValue() },
    });
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    const result = await this.prisma.paymentMethod.deleteMany({
      where: { userId: userId.getValue() },
    });
    return result.count;
  }
}
