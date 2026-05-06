import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import { ISocialLoginRepository } from "../../../domain/repositories/isocial-login.repository";
import { SocialLogin } from "../../../domain/entities/social-login.entity";
import { SocialProvider } from "../../../domain/value-objects/social-provider.vo";
import { SocialLoginId } from "../../../domain/value-objects/social-login-id.vo";
import { UserId } from "../../../domain/value-objects/user-id.vo";

export class SocialLoginRepository
  extends PrismaRepository<SocialLogin>
  implements ISocialLoginRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  async save(socialLogin: SocialLogin): Promise<void> {
    const data = this.toPersistence(socialLogin);

    await this.prisma.socialLogin.upsert({
      where: { id: socialLogin.id.getValue() },
      create: data.create,
      update: data.update,
    });

    await this.dispatchEvents(socialLogin);
  }

  async findById(id: SocialLoginId): Promise<SocialLogin | null> {
    const row = await this.prisma.socialLogin.findUnique({
      where: { id: id.getValue() },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: UserId): Promise<SocialLogin[]> {
    const rows = await this.prisma.socialLogin.findMany({
      where: { userId: userId.getValue() },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async delete(id: SocialLoginId): Promise<void> {
    await this.prisma.socialLogin.delete({
      where: { id: id.getValue() },
    });
  }

  async findByProviderUserId(
    provider: SocialProvider,
    providerUserId: string,
  ): Promise<SocialLogin | null> {
    const row = await this.prisma.socialLogin.findFirst({
      where: {
        provider,
        providerUserId,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserIdAndProvider(
    userId: UserId,
    provider: SocialProvider,
  ): Promise<SocialLogin | null> {
    const row = await this.prisma.socialLogin.findFirst({
      where: {
        userId: userId.getValue(),
        provider,
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async countByUserId(userId: UserId): Promise<number> {
    return this.prisma.socialLogin.count({
      where: { userId: userId.getValue() },
    });
  }

  async deleteByUserId(userId: UserId): Promise<number> {
    const result = await this.prisma.socialLogin.deleteMany({
      where: { userId: userId.getValue() },
    });
    return result.count;
  }

  // --- Persistence mapping ---

  private toDomain(row: Prisma.SocialLoginGetPayload<object>): SocialLogin {
    return SocialLogin.fromPersistence({
      id: SocialLoginId.fromString(row.id),
      userId: UserId.fromString(row.userId),
      provider: SocialProvider.fromString(row.provider),
      providerUserId: row.providerUserId,
      createdAt: row.createdAt,
    });
  }

  private toPersistence(socialLogin: SocialLogin): {
    create: Prisma.SocialLoginUncheckedCreateInput;
    update: Prisma.SocialLoginUncheckedUpdateInput;
  } {
    return {
      create: {
        id: socialLogin.id.getValue(),
        userId: socialLogin.userId.getValue(),
        provider: socialLogin.provider,
        providerUserId: socialLogin.providerUserId,
        createdAt: socialLogin.createdAt,
      },
      update: {
        provider: socialLogin.provider,
        providerUserId: socialLogin.providerUserId,
      },
    };
  }
}
