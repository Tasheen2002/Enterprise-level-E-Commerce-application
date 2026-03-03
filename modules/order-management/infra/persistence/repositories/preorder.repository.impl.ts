import { PrismaClient } from "@prisma/client";
import {
  IPreorderRepository,
  PreorderQueryOptions,
} from "../../../domain/repositories/preorder.repository";
import { Preorder } from "../../../domain/entities/preorder.entity";

export class PreorderRepositoryImpl implements IPreorderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // Hydration: Database row � Entity
  private toEntity(row: any): Preorder {
    return Preorder.fromDatabaseRow({
      order_item_id: row.orderItemId,
      release_date: row.releaseDate,
      notified_at: row.notifiedAt,
    });
  }

  async save(preorder: Preorder): Promise<void> {
    const data = preorder.toDatabaseRow();
    await this.prisma.preorder.create({
      data: {
        orderItemId: data.order_item_id,
        releaseDate: data.release_date,
        notifiedAt: data.notified_at,
      },
    });
  }

  async update(preorder: Preorder): Promise<void> {
    const data = preorder.toDatabaseRow();
    await this.prisma.preorder.update({
      where: { orderItemId: data.order_item_id },
      data: {
        releaseDate: data.release_date,
        notifiedAt: data.notified_at,
      },
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
