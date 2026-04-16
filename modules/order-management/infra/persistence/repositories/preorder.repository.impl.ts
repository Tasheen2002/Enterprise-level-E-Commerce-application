import { PrismaClient } from "@prisma/client";
import {
  IPreorderRepository,
  PreorderQueryOptions,
} from "../../../domain/repositories/preorder.repository";
import { Preorder } from "../../../domain/entities/preorder.entity";

interface PreorderDatabaseRow {
  orderItemId: string;
  releaseDate: Date | null;
  notifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class PreorderRepositoryImpl implements IPreorderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private toEntity(row: PreorderDatabaseRow): Preorder {
    return Preorder.fromPersistence({
      orderItemId: row.orderItemId,
      releaseDate: row.releaseDate || undefined,
      notifiedAt: row.notifiedAt || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async save(preorder: Preorder): Promise<void> {
    const data = {
      releaseDate: preorder.releaseDate || null,
      notifiedAt: preorder.notifiedAt || null,
    };
    await this.prisma.preorder.upsert({
      where: { orderItemId: preorder.orderItemId },
      create: { orderItemId: preorder.orderItemId, ...data },
      update: data,
    });
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

    return this.toEntity(preorder as any);
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

    return preorders.map((preorder) => this.toEntity(preorder as any));
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

    return preorders.map((preorder) => this.toEntity(preorder as any));
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

    return preorders.map((preorder) => this.toEntity(preorder as any));
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

    return preorders.map((preorder) => this.toEntity(preorder as any));
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

    return preorders.map((preorder) => this.toEntity(preorder as any));
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
