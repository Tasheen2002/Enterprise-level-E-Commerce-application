import { PrismaClient } from "@prisma/client";
import {
  IBackorderRepository,
  BackorderQueryOptions,
} from "../../../domain/repositories/backorder.repository";
import { Backorder } from "../../../domain/entities/backorder.entity";

export class BackorderRepositoryImpl implements IBackorderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Hydration: Database row � Entity
  private toEntity(row: any): Backorder {
    return Backorder.fromDatabaseRow({
      order_item_id: row.orderItemId,
      promised_eta: row.promisedEta,
      notified_at: row.notifiedAt,
    });
  }

  async save(backorder: Backorder): Promise<void> {
    const data = backorder.toDatabaseRow();
    await this.prisma.backorder.create({
      data: {
        orderItemId: data.order_item_id,
        promisedEta: data.promised_eta,
        notifiedAt: data.notified_at,
      },
    });
  }

  async update(backorder: Backorder): Promise<void> {
    const data = backorder.toDatabaseRow();
    await this.prisma.backorder.update({
      where: { orderItemId: data.order_item_id },
      data: {
        promisedEta: data.promised_eta,
        notifiedAt: data.notified_at,
      },
    });
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

  async exists(orderItemId: string): Promise<boolean> {
    const count = await this.prisma.backorder.count({
      where: { orderItemId },
    });

    return count > 0;
  }
}
