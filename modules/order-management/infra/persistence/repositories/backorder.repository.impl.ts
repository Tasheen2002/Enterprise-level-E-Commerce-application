import { PrismaClient } from "@prisma/client";
import {
  IBackorderRepository,
  BackorderQueryOptions,
} from "../../../domain/repositories/backorder.repository";
import { Backorder } from "../../../domain/entities/backorder.entity";

interface BackorderDatabaseRow {
  orderItemId: string;
  promisedEta: Date | null;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class BackorderRepositoryImpl implements IBackorderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: BackorderDatabaseRow): Backorder {
    return Backorder.fromPersistence({
      orderItemId: row.orderItemId,
      promisedEta: row.promisedEta || undefined,
      notifiedAt: row.notifiedAt || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(backorder: Backorder): Promise<void> {
    const data = {
      promisedEta: backorder.promisedEta || null,
      notifiedAt: backorder.notifiedAt || null,
    };
    await this.prisma.backorder.upsert({
      where: { orderItemId: backorder.orderItemId },
      create: { orderItemId: backorder.orderItemId, ...data },
      update: data,
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

    return this.toEntity(backorder as any);
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

    return backorders.map((backorder) => this.toEntity(backorder as any));
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

    return backorders.map((backorder) => this.toEntity(backorder as any));
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

    return backorders.map((backorder) => this.toEntity(backorder as any));
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

    return backorders.map((backorder) => this.toEntity(backorder as any));
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
