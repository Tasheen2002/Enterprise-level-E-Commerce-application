import { PrismaClient } from "@prisma/client";
import {
  IReturnRequestRepository,
  ReturnRequestQueryOptions,
  ReturnRequestFilterOptions,
} from "../../../domain/repositories/return-request.repository.js";
import { ReturnRequest } from "../../../domain/entities/return-request.entity.js";
import { RmaId, RmaType, RmaStatus } from "../../../domain/value-objects/index.js";

export class ReturnRequestRepositoryImpl implements IReturnRequestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private hydrate(record: any): ReturnRequest {
    return ReturnRequest.fromDatabaseRow({
      rma_id: record.id,
      order_id: record.orderId,
      type: record.type,
      reason: record.reason,
      status: record.status,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    });
  }

  private dehydrate(returnRequest: ReturnRequest): any {
    const row = returnRequest.toDatabaseRow();
    return {
      id: row.rma_id,
      orderId: row.order_id,
      type: row.type,
      reason: row.reason,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private buildOrderBy(options?: ReturnRequestQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "desc" };
    }

    return {
      [options.sortBy]: options.sortOrder || "asc",
    };
  }

  async save(returnRequest: ReturnRequest): Promise<void> {
    const data = this.dehydrate(returnRequest);
    await this.prisma.returnRequest.create({ data });
  }

  async update(returnRequest: ReturnRequest): Promise<void> {
    const data = this.dehydrate(returnRequest);
    const { id, createdAt, ...updateData } = data;
    await this.prisma.returnRequest.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(rmaId: RmaId): Promise<void> {
    await this.prisma.returnRequest.delete({
      where: { id: rmaId.getValue() },
    });
  }

  async findById(rmaId: RmaId): Promise<ReturnRequest | null> {
    const record = await this.prisma.returnRequest.findUnique({
      where: { id: rmaId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByOrderId(
    orderId: string,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    const records = await this.prisma.returnRequest.findMany({
      where: { orderId },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByType(
    type: RmaType,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    const records = await this.prisma.returnRequest.findMany({
      where: { type: type.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findByStatus(
    status: RmaStatus,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    const records = await this.prisma.returnRequest.findMany({
      where: { status: status.getValue() as any },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findAll(options?: ReturnRequestQueryOptions): Promise<ReturnRequest[]> {
    const records = await this.prisma.returnRequest.findMany({
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findWithFilters(
    filters: ReturnRequestFilterOptions,
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    const where: any = {};

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.type) {
      where.type = filters.type.getValue();
    }

    if (filters.status) {
      where.status = filters.status.getValue();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const records = await this.prisma.returnRequest.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findPendingEligibility(
    options?: ReturnRequestQueryOptions
  ): Promise<ReturnRequest[]> {
    const records = await this.prisma.returnRequest.findMany({
      where: { status: "eligibility" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findApproved(options?: ReturnRequestQueryOptions): Promise<ReturnRequest[]> {
    const records = await this.prisma.returnRequest.findMany({
      where: { status: "approved" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findInTransit(options?: ReturnRequestQueryOptions): Promise<ReturnRequest[]> {
    const records = await this.prisma.returnRequest.findMany({
      where: { status: "in_transit" },
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  async findRecentByOrder(orderId: string, limit?: number): Promise<ReturnRequest[]> {
    const records = await this.prisma.returnRequest.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      take: limit || 10,
    });

    return records.map((record) => this.hydrate(record));
  }

  async countByStatus(status: RmaStatus): Promise<number> {
    return await this.prisma.returnRequest.count({
      where: { status: status.getValue() as any },
    });
  }

  async countByOrderId(orderId: string): Promise<number> {
    return await this.prisma.returnRequest.count({
      where: { orderId },
    });
  }

  async countByType(type: RmaType): Promise<number> {
    return await this.prisma.returnRequest.count({
      where: { type: type.getValue() as any },
    });
  }

  async count(filters?: ReturnRequestFilterOptions): Promise<number> {
    if (!filters) {
      return await this.prisma.returnRequest.count();
    }

    const where: any = {};

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    if (filters.type) {
      where.type = filters.type.getValue();
    }

    if (filters.status) {
      where.status = filters.status.getValue();
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await this.prisma.returnRequest.count({ where });
  }

  async exists(rmaId: RmaId): Promise<boolean> {
    const count = await this.prisma.returnRequest.count({
      where: { id: rmaId.getValue() },
    });

    return count > 0;
  }

  async hasOrderReturns(orderId: string): Promise<boolean> {
    const count = await this.prisma.returnRequest.count({
      where: { orderId },
    });

    return count > 0;
  }

  async hasActiveReturnForOrder(orderId: string): Promise<boolean> {
    const count = await this.prisma.returnRequest.count({
      where: {
        orderId,
        NOT: { status: { in: ["refunded", "rejected"] } },
      },
    });

    return count > 0;
  }
}
