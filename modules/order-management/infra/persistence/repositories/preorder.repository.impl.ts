import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IPreorderRepository,
  PreorderQueryOptions,
} from "../../../domain/repositories/preorder.repository";
import { Preorder } from "../../../domain/entities/preorder.entity";

export class PreorderRepositoryImpl
  extends PrismaRepository<Preorder>
  implements IPreorderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  private toEntity(row: Prisma.PreorderGetPayload<Record<string, never>>): Preorder {
    return Preorder.fromPersistence({
      orderItemId: row.orderItemId,
      releaseDate: row.releaseDate ?? undefined,
      notifiedAt: row.notifiedAt ?? undefined,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    });
  }

  async save(preorder: Preorder): Promise<void> {
    const data = {
      releaseDate: preorder.releaseDate ?? null,
      notifiedAt: preorder.notifiedAt ?? null,
    };
    await this.prisma.preorder.upsert({
      where: { orderItemId: preorder.orderItemId },
      create: { orderItemId: preorder.orderItemId, ...data },
      update: data,
    });

    await this.dispatchEvents(preorder);
  }

  async delete(orderItemId: string): Promise<void> {
    await this.prisma.preorder.delete({
      where: { orderItemId },
    });
  }

  async findByOrderItemId(orderItemId: string): Promise<Preorder | null> {
    const preorder = await this.prisma.preorder.findUnique({
      where: { orderItemId },
    });

    if (!preorder) {
      return null;
    }

    return this.toEntity(preorder);
  }

  async findAll(options?: PreorderQueryOptions): Promise<Preorder[]> {
    const {
      limit,
      offset,
      sortBy = "releaseDate",
      sortOrder = "asc",
    } = options || {};

    const preorders = await this.prisma.preorder.findMany({
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return preorders.map((preorder) => this.toEntity(preorder));
  }

  async findNotified(options?: PreorderQueryOptions): Promise<Preorder[]> {
    const {
      limit,
      offset,
      sortBy = "notifiedAt",
      sortOrder = "desc",
    } = options || {};

    const preorders = await this.prisma.preorder.findMany({
      where: {
        notifiedAt: { not: null },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return preorders.map((preorder) => this.toEntity(preorder));
  }

  async findUnnotified(options?: PreorderQueryOptions): Promise<Preorder[]> {
    const {
      limit,
      offset,
      sortBy = "releaseDate",
      sortOrder = "asc",
    } = options || {};

    const preorders = await this.prisma.preorder.findMany({
      where: {
        notifiedAt: null,
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return preorders.map((preorder) => this.toEntity(preorder));
  }

  async findReleased(options?: PreorderQueryOptions): Promise<Preorder[]> {
    const {
      limit,
      offset,
      sortBy = "releaseDate",
      sortOrder = "desc",
    } = options || {};

    const now = new Date();

    const preorders = await this.prisma.preorder.findMany({
      where: {
        releaseDate: {
          not: null,
          lte: now,
        },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return preorders.map((preorder) => this.toEntity(preorder));
  }

  async findByReleaseDateBefore(
    date: Date,
    options?: PreorderQueryOptions,
  ): Promise<Preorder[]> {
    const {
      limit,
      offset,
      sortBy = "releaseDate",
      sortOrder = "asc",
    } = options || {};

    const preorders = await this.prisma.preorder.findMany({
      where: {
        releaseDate: {
          not: null,
          lte: date,
        },
      },
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return preorders.map((preorder) => this.toEntity(preorder));
  }

  async count(): Promise<number> {
    return await this.prisma.preorder.count();
  }

  async countNotified(): Promise<number> {
    return await this.prisma.preorder.count({
      where: {
        notifiedAt: { not: null },
      },
    });
  }

  async countUnnotified(): Promise<number> {
    return await this.prisma.preorder.count({
      where: {
        notifiedAt: null,
      },
    });
  }

  async countReleased(): Promise<number> {
    const now = new Date();
    return await this.prisma.preorder.count({
      where: {
        releaseDate: {
          not: null,
          lte: now,
        },
      },
    });
  }

  async exists(orderItemId: string): Promise<boolean> {
    const count = await this.prisma.preorder.count({
      where: { orderItemId },
    });

    return count > 0;
  }
}
