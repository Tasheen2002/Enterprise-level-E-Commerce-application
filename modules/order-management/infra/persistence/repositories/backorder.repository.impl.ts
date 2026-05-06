import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaRepository } from "../../../../../apps/api/src/shared/infrastructure/persistence/prisma-repository.base";
import { IEventBus } from "../../../../../packages/core/src/domain/events/domain-event";
import {
  IBackorderRepository,
  BackorderQueryOptions,
} from "../../../domain/repositories/backorder.repository";
import { Backorder } from "../../../domain/entities/backorder.entity";
import { OrderItemId } from "../../../domain/value-objects/order-item-id.vo";

export class BackorderRepositoryImpl
  extends PrismaRepository<Backorder>
  implements IBackorderRepository
{
  constructor(prisma: PrismaClient, eventBus?: IEventBus) {
    super(prisma, eventBus);
  }

  // ─── Persistence mapping ──────────────────────────────────────────────────

  private toEntity(row: Prisma.BackorderGetPayload<Record<string, never>>): Backorder {
    return Backorder.fromPersistence({
      orderItemId: OrderItemId.fromString(row.orderItemId),
      promisedEta: row.promisedEta ?? undefined,
      notifiedAt: row.notifiedAt ?? undefined,
    });
  }

  // ─── Writes ───────────────────────────────────────────────────────────────

  async save(backorder: Backorder): Promise<void> {
    const orderItemId = backorder.orderItemId.getValue();
    const data = {
      promisedEta: backorder.promisedEta ?? null,
      notifiedAt: backorder.notifiedAt ?? null,
    };
    await this.prisma.backorder.upsert({
      where: { orderItemId },
      create: { orderItemId, ...data },
      update: data,
    });

    await this.dispatchEvents(backorder);
  }

  async delete(orderItemId: OrderItemId): Promise<void> {
    await this.prisma.backorder.delete({
      where: { orderItemId: orderItemId.getValue() },
    });
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async findByOrderItemId(orderItemId: OrderItemId): Promise<Backorder | null> {
    const row = await this.prisma.backorder.findUnique({
      where: { orderItemId: orderItemId.getValue() },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(options?: BackorderQueryOptions): Promise<Backorder[]> {
    return this.findMany({}, options);
  }

  async findNotified(options?: BackorderQueryOptions): Promise<Backorder[]> {
    return this.findMany(
      { notifiedAt: { not: null } },
      options,
      "notifiedAt",
      "desc",
    );
  }

  async findUnnotified(options?: BackorderQueryOptions): Promise<Backorder[]> {
    return this.findMany({ notifiedAt: null }, options);
  }

  async findByPromisedEtaBefore(
    date: Date,
    options?: BackorderQueryOptions,
  ): Promise<Backorder[]> {
    return this.findMany(
      { promisedEta: { not: null, lte: date } },
      options,
    );
  }

  // ─── Counts / existence ───────────────────────────────────────────────────

  async count(): Promise<number> {
    return this.prisma.backorder.count();
  }

  async countNotified(): Promise<number> {
    return this.prisma.backorder.count({
      where: { notifiedAt: { not: null } },
    });
  }

  async countUnnotified(): Promise<number> {
    return this.prisma.backorder.count({
      where: { notifiedAt: null },
    });
  }

  async countByPromisedEtaBefore(date: Date): Promise<number> {
    return this.prisma.backorder.count({
      where: { promisedEta: { not: null, lte: date } },
    });
  }

  async exists(orderItemId: OrderItemId): Promise<boolean> {
    const count = await this.prisma.backorder.count({
      where: { orderItemId: orderItemId.getValue() },
    });
    return count > 0;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async findMany(
    where: Prisma.BackorderWhereInput,
    options: BackorderQueryOptions | undefined,
    defaultSortBy: NonNullable<BackorderQueryOptions["sortBy"]> = "promisedEta",
    defaultSortOrder: "asc" | "desc" = "asc",
  ): Promise<Backorder[]> {
    const {
      limit,
      offset,
      sortBy = defaultSortBy,
      sortOrder = defaultSortOrder,
    } = options || {};

    const rows = await this.prisma.backorder.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [sortBy]: sortOrder },
    });

    return rows.map((r) => this.toEntity(r));
  }
}
