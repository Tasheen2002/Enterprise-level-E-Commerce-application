import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IBackorderRepository,
  BackorderQueryOptions,
} from "../../../domain/repositories/backorder.repository";
import { Backorder } from "../../../domain/entities/backorder.entity";

export class BackorderRepositoryImpl
  extends PrismaRepository<Backorder>
  implements IBackorderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: Prisma.BackorderGetPayload<Record<string, never>>): Backorder {
    return Backorder.fromPersistence({
      orderItemId: row.orderItemId,
      promisedEta: row.promisedEta ?? undefined,
      notifiedAt: row.notifiedAt ?? undefined,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    });
  }

  async save(backorder: Backorder): Promise<void> {
    const data = {
      promisedEta: backorder.promisedEta ?? null,
      notifiedAt: backorder.notifiedAt ?? null,
    };
    await this.prisma.backorder.upsert({
      where: { orderItemId: backorder.orderItemId },
      create: { orderItemId: backorder.orderItemId, ...data },
      update: data,
    });

    await this.dispatchEvents(backorder);
  }

  async delete(orderItemId: string): Promise<void> {
    await this.prisma.backorder.delete({
      where: { orderItemId },
    });
  }

  async findByOrderItemId(orderItemId: string): Promise<Backorder | null> {
    const backorder = await this.prisma.backorder.findUnique({
      where: { orderItemId },
    });

    if (!backorder) {
      return null;
    }

    return this.toEntity(backorder);
  }

  async findAll(options?: BackorderQueryOptions): Promise<Backorder[]> {
    const {
      limit,
      offset,
      sortBy = "promisedEta",
      sortOrder = "asc",
    } = options || {};

    const backorders = await this.prisma.backorder.findMany({
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return backorders.map((backorder) => this.toEntity(backorder));
  }

  async findNotified(options?: BackorderQueryOptions): Promise<Backorder[]> {
    const {
      limit,
      offset,
      sortBy = "notifiedAt",
      sortOrder = "desc",
    } = options || {};

    const backorders = await this.prisma.backorder.findMany({
      where: {
        notifiedAt: { not: null },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return backorders.map((backorder) => this.toEntity(backorder));
  }

  async findUnnotified(options?: BackorderQueryOptions): Promise<Backorder[]> {
    const {
      limit,
      offset,
      sortBy = "promisedEta",
      sortOrder = "asc",
    } = options || {};

    const backorders = await this.prisma.backorder.findMany({
      where: {
        notifiedAt: null,
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return backorders.map((backorder) => this.toEntity(backorder));
  }

  async findByPromisedEtaBefore(
    date: Date,
    options?: BackorderQueryOptions,
  ): Promise<Backorder[]> {
    const {
      limit,
      offset,
      sortBy = "promisedEta",
      sortOrder = "asc",
    } = options || {};

    const backorders = await this.prisma.backorder.findMany({
      where: {
        promisedEta: {
          not: null,
          lte: date,
        },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return backorders.map((backorder) => this.toEntity(backorder));
  }

  async count(): Promise<number> {
    return await this.prisma.backorder.count();
  }

  async countNotified(): Promise<number> {
    return await this.prisma.backorder.count({
      where: {
        notifiedAt: { not: null },
      },
    });
  }

  async countUnnotified(): Promise<number> {
    return await this.prisma.backorder.count({
      where: {
        notifiedAt: null,
      },
    });
  }

  async countByPromisedEtaBefore(date: Date): Promise<number> {
    return await this.prisma.backorder.count({
      where: {
        promisedEta: {
          not: null,
          lte: date,
        },
      },
    });
  }

  async exists(orderItemId: string): Promise<boolean> {
    const count = await this.prisma.backorder.count({
      where: { orderItemId },
    });

    return count > 0;
  }
}
