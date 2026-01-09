import { PrismaClient } from "@prisma/client";
import { IPaymentMethodRepository } from "../../../domain/repositories/ipayment-method.repository";
import {
  PaymentMethod,
  PaymentMethodType,
} from "../../../domain/entities/payment-method.entity";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class PaymentMethodRepository implements IPaymentMethodRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(paymentMethod: PaymentMethod): Promise<void> {
    const data = paymentMethod.toDatabaseRow();

    await this.prisma.paymentMethod.create({
      data: {
        id: data.payment_method_id,
        userId: data.user_id,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        expMonth: data.exp_month,
        expYear: data.exp_year,
        billingAddressId: data.billing_address_id,
        providerRef: data.provider_ref,
        isDefault: data.is_default,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const paymentMethodData = await this.prisma.paymentMethod.findUnique({
      where: { id },
    });

    if (!paymentMethodData) {
      return null;
    }

    return PaymentMethod.fromDatabaseRow({
      payment_method_id: paymentMethodData.id,
      user_id: paymentMethodData.userId,
      type: paymentMethodData.type,
      brand: paymentMethodData.brand,
      last4: paymentMethodData.last4,
      exp_month: paymentMethodData.expMonth,
      exp_year: paymentMethodData.expYear,
      billing_address_id: paymentMethodData.billingAddressId,
      provider_ref: paymentMethodData.providerRef,
      is_default: paymentMethodData.isDefault,
      created_at: paymentMethodData.createdAt,
      updated_at: paymentMethodData.updatedAt,
    });
  }

  async findByUserId(userId: UserId): Promise<PaymentMethod[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { userId: userId.getValue() },
      orderBy: [
        { isDefault: "desc" }, // Default payment methods first
        { createdAt: "desc" },
      ],
    });

    return paymentMethods.map((data) =>
      PaymentMethod.fromDatabaseRow({
        payment_method_id: data.id,
        user_id: data.userId,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        billing_address_id: data.billingAddressId,
        provider_ref: data.providerRef,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
    );
  }

  async update(paymentMethod: PaymentMethod): Promise<void> {
    const data = paymentMethod.toDatabaseRow();

    await this.prisma.paymentMethod.update({
      where: { id: data.payment_method_id },
      data: {
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        expMonth: data.exp_month,
        expYear: data.exp_year,
        billingAddressId: data.billing_address_id,
        providerRef: data.provider_ref,
        isDefault: data.is_default,
        updatedAt: data.updated_at,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.paymentMethod.delete({
      where: { id },
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

    return paymentMethods.map((data) =>
      PaymentMethod.fromDatabaseRow({
        payment_method_id: data.id,
        user_id: data.userId,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        billing_address_id: data.billingAddressId,
        provider_ref: data.providerRef,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
    );
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

    return PaymentMethod.fromDatabaseRow({
      payment_method_id: paymentMethodData.id,
      user_id: paymentMethodData.userId,
      type: paymentMethodData.type,
      brand: paymentMethodData.brand,
      last4: paymentMethodData.last4,
      exp_month: paymentMethodData.expMonth,
      exp_year: paymentMethodData.expYear,
      billing_address_id: paymentMethodData.billingAddressId,
      provider_ref: paymentMethodData.providerRef,
      is_default: paymentMethodData.isDefault,
      created_at: paymentMethodData.createdAt,
      updated_at: paymentMethodData.updatedAt,
    });
  }

  async findByBillingAddressId(addressId: string): Promise<PaymentMethod[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { billingAddressId: addressId },
      orderBy: { createdAt: "desc" },
    });

    return paymentMethods.map((data) =>
      PaymentMethod.fromDatabaseRow({
        payment_method_id: data.id,
        user_id: data.userId,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        billing_address_id: data.billingAddressId,
        provider_ref: data.providerRef,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
    );
  }

  async findByProviderRef(providerRef: string): Promise<PaymentMethod | null> {
    const paymentMethodData = await this.prisma.paymentMethod.findFirst({
      where: { providerRef },
    });

    if (!paymentMethodData) {
      return null;
    }

    return PaymentMethod.fromDatabaseRow({
      payment_method_id: paymentMethodData.id,
      user_id: paymentMethodData.userId,
      type: paymentMethodData.type,
      brand: paymentMethodData.brand,
      last4: paymentMethodData.last4,
      exp_month: paymentMethodData.expMonth,
      exp_year: paymentMethodData.expYear,
      billing_address_id: paymentMethodData.billingAddressId,
      provider_ref: paymentMethodData.providerRef,
      is_default: paymentMethodData.isDefault,
      created_at: paymentMethodData.createdAt,
      updated_at: paymentMethodData.updatedAt,
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.prisma.paymentMethod.count({
      where: { id },
    });
    return count > 0;
  }

  async setAsDefault(paymentMethodId: string, userId: UserId): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // First, remove default flag from all payment methods for this user
      await tx.paymentMethod.updateMany({
        where: { userId: userId.getValue() },
        data: { isDefault: false },
      });

      // Then set the specified payment method as default
      await tx.paymentMethod.update({
        where: { id: paymentMethodId },
        data: { isDefault: true },
      });
    });
  }

  async removeDefault(userId: UserId): Promise<void> {
    await this.prisma.paymentMethod.updateMany({
      where: {
        userId: userId.getValue(),
        isDefault: true,
      },
      data: { isDefault: false },
    });
  }

  async countByUserId(userId: UserId): Promise<number> {
    return await this.prisma.paymentMethod.count({
      where: { userId: userId.getValue() },
    });
  }

  async findExpiredPaymentMethods(beforeDate?: Date): Promise<PaymentMethod[]> {
    const cutoffDate = beforeDate || new Date();
    const currentYear = cutoffDate.getFullYear();
    const currentMonth = cutoffDate.getMonth() + 1; // getMonth() returns 0-11

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        AND: [
          { expYear: { not: null } },
          { expMonth: { not: null } },
          {
            OR: [
              { expYear: { lt: currentYear } },
              {
                AND: [
                  { expYear: currentYear },
                  { expMonth: { lt: currentMonth } },
                ],
              },
            ],
          },
        ],
      },
      orderBy: [{ expYear: "asc" }, { expMonth: "asc" }],
    });

    return paymentMethods.map((data) =>
      PaymentMethod.fromDatabaseRow({
        payment_method_id: data.id,
        user_id: data.userId,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        billing_address_id: data.billingAddressId,
        provider_ref: data.providerRef,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
    );
  }

  async findExpiringSoon(monthsAhead: number = 3): Promise<PaymentMethod[]> {
    const now = new Date();
    const futureDate = new Date(
      now.getFullYear(),
      now.getMonth() + monthsAhead,
      now.getDate()
    );
    const futureYear = futureDate.getFullYear();
    const futureMonth = futureDate.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        AND: [
          { expYear: { not: null } },
          { expMonth: { not: null } },
          {
            OR: [
              {
                AND: [
                  { expYear: currentYear },
                  { expMonth: { gte: currentMonth } },
                  { expMonth: { lte: futureMonth } },
                ],
              },
              {
                AND: [
                  { expYear: { gt: currentYear } },
                  { expYear: { lt: futureYear } },
                ],
              },
              {
                AND: [
                  { expYear: futureYear },
                  { expMonth: { lte: futureMonth } },
                ],
              },
            ],
          },
        ],
      },
      orderBy: [{ expYear: "asc" }, { expMonth: "asc" }],
    });

    return paymentMethods.map((data) =>
      PaymentMethod.fromDatabaseRow({
        payment_method_id: data.id,
        user_id: data.userId,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        billing_address_id: data.billingAddressId,
        provider_ref: data.providerRef,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
    );
  }

  async findByUserIdAndLast4(
    userId: UserId,
    last4: string
  ): Promise<PaymentMethod[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        userId: userId.getValue(),
        last4,
      },
      orderBy: { createdAt: "desc" },
    });

    return paymentMethods.map((data) =>
      PaymentMethod.fromDatabaseRow({
        payment_method_id: data.id,
        user_id: data.userId,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        billing_address_id: data.billingAddressId,
        provider_ref: data.providerRef,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
    );
  }

  async getPaymentMethodStatsByType(): Promise<
    Array<{ type: string; count: number }>
  > {
    const stats = await this.prisma.paymentMethod.groupBy({
      by: ["type"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    return stats.map((stat) => ({
      type: stat.type,
      count: stat._count.id,
    }));
  }

  async getUserPaymentMethodStats(userId: UserId): Promise<{
    total: number;
    byType: Record<string, number>;
    hasDefault: boolean;
    expiredCount: number;
    expiringSoonCount: number;
  }> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const futureDate = new Date(
      now.getFullYear(),
      now.getMonth() + 3,
      now.getDate()
    );
    const futureYear = futureDate.getFullYear();
    const futureMonth = futureDate.getMonth() + 1;

    const [
      total,
      byType,
      defaultPaymentMethod,
      expiredCount,
      expiringSoonCount,
    ] = await Promise.all([
      this.prisma.paymentMethod.count({
        where: { userId: userId.getValue() },
      }),
      this.prisma.paymentMethod.groupBy({
        by: ["type"],
        where: { userId: userId.getValue() },
        _count: {
          id: true,
        },
      }),
      this.prisma.paymentMethod.findFirst({
        where: {
          userId: userId.getValue(),
          isDefault: true,
        },
        select: { id: true },
      }),
      // Count expired payment methods
      this.prisma.paymentMethod.count({
        where: {
          userId: userId.getValue(),
          AND: [
            { expYear: { not: null } },
            { expMonth: { not: null } },
            {
              OR: [
                { expYear: { lt: currentYear } },
                {
                  AND: [
                    { expYear: currentYear },
                    { expMonth: { lt: currentMonth } },
                  ],
                },
              ],
            },
          ],
        },
      }),
      // Count expiring soon payment methods
      this.prisma.paymentMethod.count({
        where: {
          userId: userId.getValue(),
          AND: [
            { expYear: { not: null } },
            { expMonth: { not: null } },
            {
              OR: [
                {
                  AND: [
                    { expYear: currentYear },
                    { expMonth: { gte: currentMonth } },
                    { expMonth: { lte: futureMonth } },
                  ],
                },
                {
                  AND: [
                    { expYear: { gt: currentYear } },
                    { expYear: { lt: futureYear } },
                  ],
                },
                {
                  AND: [
                    { expYear: futureYear },
                    { expMonth: { lte: futureMonth } },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ]);

    const typeStats: Record<string, number> = {};
    byType.forEach((stat) => {
      typeStats[stat.type] = stat._count.id;
    });

    return {
      total,
      byType: typeStats,
      hasDefault: !!defaultPaymentMethod,
      expiredCount,
      expiringSoonCount,
    };
  }

  async findByIds(ids: string[]): Promise<PaymentMethod[]> {
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
    });

    return paymentMethods.map((data) =>
      PaymentMethod.fromDatabaseRow({
        payment_method_id: data.id,
        user_id: data.userId,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        billing_address_id: data.billingAddressId,
        provider_ref: data.providerRef,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
    );
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    const result = await this.prisma.paymentMethod.deleteMany({
      where: { userId: userId.getValue() },
    });
    return result.count;
  }

  async deleteExpired(beforeDate: Date): Promise<number> {
    const currentYear = beforeDate.getFullYear();
    const currentMonth = beforeDate.getMonth() + 1;

    const result = await this.prisma.paymentMethod.deleteMany({
      where: {
        AND: [
          { expYear: { not: null } },
          { expMonth: { not: null } },
          {
            OR: [
              { expYear: { lt: currentYear } },
              {
                AND: [
                  { expYear: currentYear },
                  { expMonth: { lt: currentMonth } },
                ],
              },
            ],
          },
        ],
      },
    });
    return result.count;
  }

  async findByUserIds(userIds: UserId[]): Promise<PaymentMethod[]> {
    const userIdValues = userIds.map((id) => id.getValue());

    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { userId: { in: userIdValues } },
      orderBy: [
        { userId: "asc" },
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return paymentMethods.map((data) =>
      PaymentMethod.fromDatabaseRow({
        payment_method_id: data.id,
        user_id: data.userId,
        type: data.type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.expMonth,
        exp_year: data.expYear,
        billing_address_id: data.billingAddressId,
        provider_ref: data.providerRef,
        is_default: data.isDefault,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
      })
    );
  }
}
