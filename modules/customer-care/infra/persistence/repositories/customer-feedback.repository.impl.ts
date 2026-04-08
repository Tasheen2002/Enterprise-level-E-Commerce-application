import { PrismaClient, Prisma } from "@prisma/client";
import {
  ICustomerFeedbackRepository,
  FeedbackQueryOptions,
  FeedbackFilterOptions,
} from "../../../domain/repositories/customer-feedback.repository.js";
import { CustomerFeedback } from "../../../domain/entities/customer-feedback.entity.js";
import { FeedbackId } from "../../../domain/value-objects/index.js";

type PrismaWhere = Prisma.CustomerFeedbackWhereInput;

export class CustomerFeedbackRepositoryImpl
  implements ICustomerFeedbackRepository
{
  constructor(private readonly prisma: PrismaClient) {}

  // ---------------------------------------------------------------------------
  // Hydration helpers
  // ---------------------------------------------------------------------------
  private hydrate(record: any): CustomerFeedback {
    return CustomerFeedback.fromDatabaseRow({
      feedback_id: record.id,
      user_id: record.userId,
      ticket_id: record.ticketId,
      order_id: record.orderId,
      nps_score: record.nps,
      csat_score: record.csat,
      comment: record.comment,
      created_at: record.createdAt,
    });
  }

  private dehydrate(feedback: CustomerFeedback): any {
    const row = feedback.toDatabaseRow();
    return {
      id: row.feedback_id,
      userId: row.user_id,
      ticketId: row.ticket_id,
      orderId: row.order_id,
      nps: row.nps_score,
      csat: row.csat_score,
      comment: row.comment,
      createdAt: row.created_at,
    };
  }

  private buildOrderBy(options?: FeedbackQueryOptions): any {
    if (!options?.sortBy) {
      return { createdAt: "desc" };
    }

    const sortMap: Record<string, string> = {
      createdAt: "createdAt",
      npsScore: "nps",
      csatScore: "csat",
    };

    const field = sortMap[options.sortBy] ?? "createdAt";
    const direction =
      options.sortOrder ?? (field === "createdAt" ? "desc" : "asc");

    return {
      [field]: direction,
    };
  }

  private buildWhere(filters?: FeedbackFilterOptions): any {
    if (!filters) {
      return {};
    }

    const where: any = {};
    const andConditions: any[] = [];

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.ticketId) {
      where.ticket_id = filters.ticketId;
    }

    if (filters.orderId) {
      where.orderId = filters.orderId;
    }

    // NPS conditions
    if (filters.hasNpsScore === false) {
      andConditions.push({ nps: null });
    } else {
      const npsConditions: Prisma.IntNullableFilter = {};

      if (filters.hasNpsScore === true) {
        npsConditions.not = null;
      }

      if (filters.npsCategory) {
        switch (filters.npsCategory) {
          case "promoter":
            npsConditions.gte =
              npsConditions.gte !== undefined
                ? Math.max(npsConditions.gte, 9)
                : 9;
            break;
          case "passive":
            npsConditions.gte =
              npsConditions.gte !== undefined
                ? Math.max(npsConditions.gte, 7)
                : 7;
            npsConditions.lte =
              npsConditions.lte !== undefined
                ? Math.min(npsConditions.lte, 8)
                : 8;
            break;
          case "detractor":
            npsConditions.lte =
              npsConditions.lte !== undefined
                ? Math.min(npsConditions.lte, 6)
                : 6;
            break;
        }
      }

      if (filters.minNpsScore !== undefined) {
        npsConditions.gte =
          npsConditions.gte !== undefined
            ? Math.max(npsConditions.gte, filters.minNpsScore)
            : filters.minNpsScore;
      }

      if (filters.maxNpsScore !== undefined) {
        npsConditions.lte =
          npsConditions.lte !== undefined
            ? Math.min(npsConditions.lte, filters.maxNpsScore)
            : filters.maxNpsScore;
      }

      if (Object.keys(npsConditions).length > 0) {
        andConditions.push({ nps: npsConditions });
      }
    }

    // CSAT conditions
    if (filters.hasCsatScore === false) {
      andConditions.push({ csat: null });
    } else {
      const csatConditions: Prisma.IntNullableFilter = {};

      if (filters.hasCsatScore === true) {
        csatConditions.not = null;
      }

      if (filters.csatCategory) {
        switch (filters.csatCategory) {
          case "positive":
            csatConditions.gte =
              csatConditions.gte !== undefined
                ? Math.max(csatConditions.gte, 4)
                : 4;
            break;
          case "neutral":
            csatConditions.equals = 3;
            break;
          case "negative":
            csatConditions.lte =
              csatConditions.lte !== undefined
                ? Math.min(csatConditions.lte, 2)
                : 2;
            break;
        }
      }

      if (filters.minCsatScore !== undefined) {
        csatConditions.gte =
          csatConditions.gte !== undefined
            ? Math.max(csatConditions.gte, filters.minCsatScore)
            : filters.minCsatScore;
      }

      if (filters.maxCsatScore !== undefined) {
        csatConditions.lte =
          csatConditions.lte !== undefined
            ? Math.min(csatConditions.lte, filters.maxCsatScore)
            : filters.maxCsatScore;
      }

      if (Object.keys(csatConditions).length > 0) {
        andConditions.push({ csat: csatConditions });
      }
    }

    if (filters.hasComment !== undefined) {
      if (filters.hasComment) {
        andConditions.push({ comment: { not: null } });
        andConditions.push({ NOT: { comment: "" } });
      } else {
        andConditions.push({
          OR: [{ comment: null }, { comment: "" }],
        });
      }
    }

    const createdAtConditions: any = {};
    if (filters.startDate) {
      createdAtConditions.gte = filters.startDate;
    }
    if (filters.endDate) {
      createdAtConditions.lte = filters.endDate;
    }
    if (Object.keys(createdAtConditions).length > 0) {
      andConditions.push({ created_at: createdAtConditions });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    return where;
  }

  private combineWhere(base: PrismaWhere, extra: PrismaWhere): PrismaWhere {
    const baseEmpty = !base || Object.keys(base).length === 0;
    const extraEmpty = !extra || Object.keys(extra).length === 0;

    if (baseEmpty && extraEmpty) {
      return {};
    }
    if (baseEmpty) {
      return extra;
    }
    if (extraEmpty) {
      return base;
    }

    return {
      AND: [base, extra],
    };
  }

  private async findMany(
    where: PrismaWhere,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    const records = await this.prisma.customerFeedback.findMany({
      where,
      orderBy: this.buildOrderBy(options),
      skip: options?.offset,
      take: options?.limit,
    });

    return records.map((record) => this.hydrate(record));
  }

  private async countWithWhere(where: PrismaWhere): Promise<number> {
    return this.prisma.customerFeedback.count({ where });
  }

  // ---------------------------------------------------------------------------
  // Basic CRUD
  // ---------------------------------------------------------------------------
  async save(feedback: CustomerFeedback): Promise<void> {
    const data = this.dehydrate(feedback);
    await this.prisma.customerFeedback.create({ data });
  }

  async update(feedback: CustomerFeedback): Promise<void> {
    const data = this.dehydrate(feedback);
    const { id, createdAt, ...updateData } = data;
    await this.prisma.customerFeedback.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(feedbackId: FeedbackId): Promise<void> {
    await this.prisma.customerFeedback.delete({
      where: { id: feedbackId.getValue() },
    });
  }

  // ---------------------------------------------------------------------------
  // Finders
  // ---------------------------------------------------------------------------
  async findById(feedbackId: FeedbackId): Promise<CustomerFeedback | null> {
    const record = await this.prisma.customerFeedback.findUnique({
      where: { id: feedbackId.getValue() },
    });

    return record ? this.hydrate(record) : null;
  }

  async findByUserId(
    userId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return this.findMany({ userId }, options);
  }

  async findByTicketId(
    ticketId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return this.findMany({ ticket_id: ticketId } as any, options);
  }

  async findByOrderId(
    orderId: string,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return this.findMany({ orderId }, options);
  }

  async findAll(options?: FeedbackQueryOptions): Promise<CustomerFeedback[]> {
    return this.findMany({}, options);
  }

  // ---------------------------------------------------------------------------
  // Advanced queries
  // ---------------------------------------------------------------------------
  async findWithFilters(
    filters: FeedbackFilterOptions,
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    const where = this.buildWhere(filters);
    return this.findMany(where, options);
  }

  async findPromoters(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return this.findMany({ nps: { gte: 9 } }, options);
  }

  async findPassives(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return this.findMany(
      { AND: [{ nps: { gte: 7 } }, { nps: { lte: 8 } }] },
      options
    );
  }

  async findDetractors(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return this.findMany({ nps: { lte: 6 } }, options);
  }

  async findPositiveCsat(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return this.findMany({ csat: { gte: 4 } }, options);
  }

  async findNegativeCsat(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    return this.findMany({ csat: { lte: 2 } }, options);
  }

  async findWithComments(
    options?: FeedbackQueryOptions
  ): Promise<CustomerFeedback[]> {
    const where: PrismaWhere = {
      AND: [{ comment: { not: null } }, { NOT: { comment: "" } }],
    };
    return this.findMany(where, options);
  }

  async findRecentByUser(
    userId: string,
    limit?: number
  ): Promise<CustomerFeedback[]> {
    const records = await this.prisma.customerFeedback.findMany({
      where: { userId },
      orderBy: { created_at: "desc" } as any,
      take: limit ?? 10,
    });

    return records.map((record) => this.hydrate(record));
  }

  // ---------------------------------------------------------------------------
  // NPS calculations
  // ---------------------------------------------------------------------------
  async calculateNpsScore(filters?: FeedbackFilterOptions): Promise<number> {
    const baseWhere = this.buildWhere(filters);
    const totalWhere = this.combineWhere(baseWhere, {
      nps: { not: null },
    });
    const total = await this.countWithWhere(totalWhere);

    if (total === 0) {
      return 0;
    }

    const promotersWhere = this.combineWhere(baseWhere, {
      nps: { gte: 9 },
    });
    const detractorsWhere = this.combineWhere(baseWhere, {
      nps: { lte: 6 },
    });

    const [promoters, detractors] = await Promise.all([
      this.countWithWhere(promotersWhere),
      this.countWithWhere(detractorsWhere),
    ]);

    return ((promoters - detractors) / total) * 100;
  }

  async countPromoters(filters?: FeedbackFilterOptions): Promise<number> {
    const where = this.combineWhere(this.buildWhere(filters), {
      nps: { gte: 9 },
    });
    return this.countWithWhere(where);
  }

  async countPassives(filters?: FeedbackFilterOptions): Promise<number> {
    const where = this.combineWhere(this.buildWhere(filters), {
      AND: [{ nps: { gte: 7 } }, { nps: { lte: 8 } }],
    });
    return this.countWithWhere(where);
  }

  async countDetractors(filters?: FeedbackFilterOptions): Promise<number> {
    const where = this.combineWhere(this.buildWhere(filters), {
      nps: { lte: 6 },
    });
    return this.countWithWhere(where);
  }

  async getAverageNpsScore(filters?: FeedbackFilterOptions): Promise<number> {
    const where = this.combineWhere(this.buildWhere(filters), {
      nps: { not: null },
    });

    const result = await this.prisma.customerFeedback.aggregate({
      where,
      _avg: { nps: true },
    });

    return result._avg.nps ?? 0;
  }

  // ---------------------------------------------------------------------------
  // CSAT calculations
  // ---------------------------------------------------------------------------
  async calculateCsatScore(filters?: FeedbackFilterOptions): Promise<number> {
    const baseWhere = this.buildWhere(filters);
    const totalWhere = this.combineWhere(baseWhere, {
      csat: { not: null },
    });
    const total = await this.countWithWhere(totalWhere);

    if (total === 0) {
      return 0;
    }

    const positiveWhere = this.combineWhere(baseWhere, {
      csat: { gte: 4 },
    });
    const positive = await this.countWithWhere(positiveWhere);

    return (positive / total) * 100;
  }

  async getAverageCsatScore(filters?: FeedbackFilterOptions): Promise<number> {
    const where = this.combineWhere(this.buildWhere(filters), {
      csat: { not: null },
    });

    const result = await this.prisma.customerFeedback.aggregate({
      where,
      _avg: { csat: true },
    });

    return result._avg.csat ?? 0;
  }

  async countPositiveCsat(filters?: FeedbackFilterOptions): Promise<number> {
    const where = this.combineWhere(this.buildWhere(filters), {
      csat: { gte: 4 },
    });
    return this.countWithWhere(where);
  }

  async countNegativeCsat(filters?: FeedbackFilterOptions): Promise<number> {
    const where = this.combineWhere(this.buildWhere(filters), {
      csat: { lte: 2 },
    });
    return this.countWithWhere(where);
  }

  // ---------------------------------------------------------------------------
  // Counts
  // ---------------------------------------------------------------------------
  async countByUserId(userId: string): Promise<number> {
    return this.prisma.customerFeedback.count({ where: { userId } });
  }

  async countByTicketId(ticketId: string): Promise<number> {
    return this.prisma.customerFeedback.count({
      where: { ticket_id: ticketId } as any,
    });
  }

  async countByOrderId(orderId: string): Promise<number> {
    return this.prisma.customerFeedback.count({ where: { orderId } });
  }

  async count(filters?: FeedbackFilterOptions): Promise<number> {
    const where = this.buildWhere(filters);
    return this.prisma.customerFeedback.count({ where });
  }

  // ---------------------------------------------------------------------------
  // Existence checks
  // ---------------------------------------------------------------------------
  async exists(feedbackId: FeedbackId): Promise<boolean> {
    const count = await this.prisma.customerFeedback.count({
      where: { id: feedbackId.getValue() },
    });

    return count > 0;
  }

  async hasFeedbackForTicket(ticketId: string): Promise<boolean> {
    const count = await this.prisma.customerFeedback.count({
      where: { ticket_id: ticketId } as any,
    });

    return count > 0;
  }

  async hasFeedbackForOrder(orderId: string): Promise<boolean> {
    const count = await this.prisma.customerFeedback.count({
      where: { orderId },
    });

    return count > 0;
  }
}
