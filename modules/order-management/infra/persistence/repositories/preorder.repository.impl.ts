import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IPreorderRepository,
  PreorderQueryOptions,
} from "../../../domain/repositories/preorder.repository";
import { Preorder } from "../../../domain/entities/preorder.entity";
import { OrderItemId } from "../../../domain/value-objects/order-item-id.vo";

type PreorderRow = Prisma.PreorderGetPayload<Record<string, never>>;

export class PreorderRepositoryImpl
  extends PrismaRepository<Preorder>
  implements IPreorderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  // ─── Persistence mapping ──────────────────────────────────────────────────

  private toEntity(row: PreorderRow): Preorder {
    return Preorder.fromPersistence({
      orderItemId: OrderItemId.fromString(row.orderItemId),
      releaseDate: row.releaseDate ?? undefined,
      notifiedAt: row.notifiedAt ?? undefined,
    });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  async save(preorder: Preorder): Promise<void> {
    const orderItemId = preorder.orderItemId.getValue();
    const data = {
      releaseDate: preorder.releaseDate ?? null,
      notifiedAt: preorder.notifiedAt ?? null,
    };
    await this.prisma.preorder.upsert({
      where: { orderItemId },
      create: { orderItemId, ...data },
      update: data,
    });

    await this.dispatchEvents(preorder);
  }

  async delete(orderItemId: OrderItemId): Promise<void> {
    await this.prisma.preorder.delete({
      where: { orderItemId: orderItemId.getValue() },
    });
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findByOrderItemId(orderItemId: OrderItemId): Promise<Preorder | null> {
    const row = await this.prisma.preorder.findUnique({
      where: { orderItemId: orderItemId.getValue() },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(options?: PreorderQueryOptions): Promise<Preorder[]> {
    return this.findMany({}, options);
  }

  async findNotified(options?: PreorderQueryOptions): Promise<Preorder[]> {
    return this.findMany(
      { notifiedAt: { not: null } },
      options,
      "notifiedAt",
      "desc",
    );
  }

  async findUnnotified(options?: PreorderQueryOptions): Promise<Preorder[]> {
    return this.findMany({ notifiedAt: null }, options);
  }

  async findReleased(options?: PreorderQueryOptions): Promise<Preorder[]> {
    return this.findMany(
      { releaseDate: { not: null, lte: new Date() } },
      options,
      "releaseDate",
      "desc",
    );
  }

  async findByReleaseDateBefore(
    date: Date,
    options?: PreorderQueryOptions,
  ): Promise<Preorder[]> {
    return this.findMany(
      { releaseDate: { not: null, lte: date } },
      options,
    );
  }

  // ─── Counts / existence ───────────────────────────────────────────────────

  async count(): Promise<number> {
    return this.prisma.preorder.count();
  }

  async countNotified(): Promise<number> {
    return this.prisma.preorder.count({
      where: { notifiedAt: { not: null } },
    });
  }

  async countUnnotified(): Promise<number> {
    return this.prisma.preorder.count({
      where: { notifiedAt: null },
    });
  }

  async countReleased(): Promise<number> {
    return this.prisma.preorder.count({
      where: { releaseDate: { not: null, lte: new Date() } },
    });
  }

  async exists(orderItemId: OrderItemId): Promise<boolean> {
    const count = await this.prisma.preorder.count({
      where: { orderItemId: orderItemId.getValue() },
    });
    return count > 0;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findMany(
    where: Prisma.PreorderWhereInput,
    options: PreorderQueryOptions | undefined,
    defaultSortBy: NonNullable<PreorderQueryOptions["sortBy"]> = "releaseDate",
    defaultSortOrder: "asc" | "desc" = "asc",
  ): Promise<Preorder[]> {
    const {
      limit,
      offset,
      sortBy = defaultSortBy,
      sortOrder = defaultSortOrder,
    } = options || {};

    const rows = await this.prisma.preorder.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((r) => this.toEntity(r));
  }
}
